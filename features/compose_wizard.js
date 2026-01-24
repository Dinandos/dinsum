import * as yaml from 'js-yaml';
import { createInterface, askQuestion, askConfirmation, closeInterface } from '../utils/io.js';

export async function runComposeWizard(composeContent, colors) {
    const { accentOrange, textWhite, commentGray } = colors;
    const rl = createInterface();
    
    // Parse de originele YAML
    const composeData = yaml.load(composeContent);
    const envVars = {}; // Hier verzamelen we de .env variabelen
    
    // We gaan ervan uit dat er één hoofdservice is (vaak de eerste of met dezelfde naam als template)
    // Voor nu pakken we de eerste service die we vinden om te configureren
    const serviceName = Object.keys(composeData.services)[0];
    const service = composeData.services[serviceName];

    console.log(textWhite(`\nConfigureren van service: ${accentOrange(serviceName)}\n`));

    // --- STAP 1: Container Name ---
    const defaultName = service.container_name || `${serviceName}-container`;
    const nameAnswer = await askQuestion(rl, accentOrange(`1. Container naam [${defaultName}]: `));
    const finalName = nameAnswer || defaultName;
    
    // Zet variabele in YAML en .env
    service.container_name = '${CONTAINER_NAME}';
    envVars['CONTAINER_NAME'] = finalName;


    // --- STAP 2: Ports of Expose ---
    if (service.ports && service.ports.length > 0) {
        console.log(textWhite("\n2. Netwerk blootstelling:"));
        console.log(commentGray("   - ports:  Bereikbaar via host IP (bijv. 80:80)"));
        console.log(commentGray("   - expose: Alleen intern bereikbaar (voor proxy)"));
        
        const modeAnswer = await askQuestion(rl, accentOrange("   Kies modus [ports]/expose: "));
        const isExpose = modeAnswer.toLowerCase().startsWith('e');

        if (isExpose) {
            // Omzetten naar expose
            const exposePorts = [];
            service.ports.forEach(p => {
                // Haal container poort op (rechts van :)
                const parts = p.toString().split(':');
                const containerPort = parts.length > 1 ? parts[1] : parts[0];
                exposePorts.push(containerPort);
            });
            
            delete service.ports;
            service.expose = exposePorts;
            console.log(commentGray(`   -> Omgezet naar expose: ${exposePorts.join(', ')}`));
        } else {
            // Ports behouden, maar host poort variabel maken
            const newPorts = [];
            for (let i = 0; i < service.ports.length; i++) {
                const p = service.ports[i].toString();
                const parts = p.split(':');
                const containerPort = parts.length > 1 ? parts[1] : parts[0];
                const defaultHostPort = parts.length > 1 ? parts[0] : containerPort;
                
                const hostPort = await askQuestion(rl, accentOrange(`   Host poort voor ${containerPort} [${defaultHostPort}]: `));
                const finalHostPort = hostPort || defaultHostPort;
                
                // Maak unieke env var naam, bijv. PORT_80
                const varName = `PORT_${containerPort}`;
                envVars[varName] = finalHostPort;
                newPorts.push(`\${${varName}}:${containerPort}`);
            }
            service.ports = newPorts;
        }
    }


    // --- STAP 3: Host Volumes ---
    if (service.volumes && service.volumes.length > 0) {
        console.log(textWhite("\n3. Volumes configureren:"));
        const newVolumes = [];
        
        for (let i = 0; i < service.volumes.length; i++) {
            const vol = service.volumes[i];
            // Check of het een string is (kan ook object zijn in long syntax, hier gaan we uit van short)
            if (typeof vol === 'string') {
                const parts = vol.split(':');
                if (parts.length >= 2) {
                    const hostPath = parts[0];
                    const containerPath = parts[1];
                    const options = parts[2] ? `:${parts[2]}` : '';
                    
                    // Maak een leesbare variabele naam van het container pad
                    // bijv /etc/nginx/nginx.conf -> VOL_NGINX_CONF
                    const cleanName = containerPath.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                    const varName = `VOL${cleanName}`; // VOL__ETC_NGINX_...
                    // Beetje opschonen van dubbele underscores
                    const finalVarName = varName.replace(/_+/g, '_').replace(/_$/, '');

                    const answer = await askQuestion(rl, accentOrange(`   Host pad voor ${containerPath} [${hostPath}]: `));
                    const finalHostPath = answer || hostPath;
                    
                    envVars[finalVarName] = finalHostPath;
                    newVolumes.push(`\${${finalVarName}}:${containerPath}${options}`);
                } else {
                    newVolumes.push(vol);
                }
            } else {
                newVolumes.push(vol);
            }
        }
        service.volumes = newVolumes;
    }


    // --- STAP 4 & 5: Network ---
    console.log(textWhite("\n4. Netwerk configuratie:"));
    const wantNetwork = await askConfirmation(rl, accentOrange("   Wil je een extra netwerk toevoegen? (y/N): "));
    
    if (wantNetwork) {
        const netName = await askQuestion(rl, accentOrange("   Naam van het netwerk: "));
        
        if (netName) {
            // Vraag type (Stap 5)
            console.log(commentGray("   Type netwerk:"));
            console.log(commentGray("   1. External (bestaand netwerk, bijv. proxy)"));
            console.log(commentGray("   2. Internal (geïsoleerd)"));
            
            const typeAns = await askQuestion(rl, accentOrange("   Kies optie [1]/2: "));
            const isInternal = typeAns === '2';
            
            // Toevoegen aan service
            if (!service.networks) service.networks = [];
            // Check of het al een array is (kan ook object zijn)
            if (Array.isArray(service.networks)) {
                service.networks.push(netName);
            } else {
                // Als het een object is, voeg toe als key
                service.networks[netName] = {};
            }
            
            // Toevoegen aan top-level networks
            if (!composeData.networks) composeData.networks = {};
            
            if (isInternal) {
                composeData.networks[netName] = { internal: true };
            } else {
                composeData.networks[netName] = { external: true };
            }
        }
    }

    closeInterface(rl);

    // Genereer .env content
    let envContent = "# Generated by Dinsum\n";
    for (const [key, value] of Object.entries(envVars)) {
        envContent += `${key}=${value}\n`;
    }

    // Genereer nieuwe YAML
    const newYaml = yaml.dump(composeData, { 
        indent: 2, 
        lineWidth: -1,
        quotingType: '"' // Dubbele quotes voor variabelen zoals "${VAR}"
    });

    return {
        yaml: newYaml,
        env: envContent
    };
}