import * as yaml from 'js-yaml';
import { createInterface, askQuestion, askConfirmation, closeInterface } from '../utils/io.js';

export async function runComposeWizard(envContent, composeContent, colors) {
    const { accentOrange, textWhite, commentGray } = colors;
    const rl = createInterface();
    
    console.log(textWhite("\nConfigureren van variabelen (.env):\n"));

    const lines = envContent.split('\n');
    const newLines = [];

    for (let line of lines) {
        const trimmed = line.trim();
        
        // Sla comments en lege regels over (behoud ze wel in output)
        if (!trimmed || trimmed.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        // Check voor KEY=VALUE
        const eqIndex = line.indexOf('=');
        if (eqIndex !== -1) {
            const key = line.substring(0, eqIndex).trim();
            const defaultValue = line.substring(eqIndex + 1).trim();
            
            const answer = await askQuestion(rl, accentOrange(`Wat wil je dat ${key} wordt? [${defaultValue}]: `));
            const finalValue = answer !== '' ? answer : defaultValue;
            
            newLines.push(`${key}=${finalValue}`);
        } else {
            newLines.push(line);
        }
    }
    
    const finalEnvContent = newLines.join('\n');

    // --- Extra configuratie: Ports/Expose & Networks ---
    // Parse de YAML om structuur aan te passen
    const composeData = yaml.load(composeContent);
    
    // We pakken de eerste service
    const serviceName = Object.keys(composeData.services)[0];
    const service = composeData.services[serviceName];

    // 1. Ports vs Expose
    if (service.ports && service.ports.length > 0) {
        console.log(textWhite("\nNetwerk blootstelling:"));
        console.log(commentGray("   - ports:  Bereikbaar via host IP (zoals ingesteld in .env)"));
        console.log(commentGray("   - expose: Alleen intern bereikbaar (voor proxy)"));
        
        const modeAnswer = await askQuestion(rl, accentOrange("   Kies modus [ports]/expose: "));
        const isExpose = modeAnswer.toLowerCase().startsWith('e');

        if (isExpose) {
            const exposePorts = [];
            service.ports.forEach(p => {
                // Haal container poort op (alles na de laatste :)
                const str = p.toString();
                const lastColon = str.lastIndexOf(':');
                const containerPort = lastColon !== -1 ? str.substring(lastColon + 1) : str;
                exposePorts.push(containerPort);
            });
            
            delete service.ports;
            service.expose = exposePorts;
            console.log(commentGray(`   -> Omgezet naar expose: ${exposePorts.join(', ')}`));
        }
    }

    // 2. Netwerken
    console.log(textWhite("\nNetwerk configuratie:"));
    const wantNetwork = await askConfirmation(rl, accentOrange("   Wil je een extra netwerk toevoegen? (y/N): "));
    
    if (wantNetwork) {
        const netName = await askQuestion(rl, accentOrange("   Naam van het netwerk: "));
        
        if (netName) {
            console.log(commentGray("   Type netwerk:"));
            console.log(commentGray("   1. External (bestaand netwerk, bijv. proxy)"));
            console.log(commentGray("   2. Internal (geïsoleerd)"));
            
            const typeAns = await askQuestion(rl, accentOrange("   Kies optie [1]/2: "));
            const isInternal = typeAns === '2';
            
            // Toevoegen aan service
            if (!service.networks) service.networks = [];
            if (Array.isArray(service.networks)) {
                service.networks.push(netName);
            } else {
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

    return {
        env: finalEnvContent,
        yaml: yaml.dump(composeData, { indent: 2, lineWidth: -1, quotingType: '"' })
    };
}
