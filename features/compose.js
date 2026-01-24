import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kleuren instellen volgens COLOR_SCHEME.md (fallback als niet doorgegeven)
// Groen = Succes, Rood = Fail, Grijs = Comment, Blauw = Status, Oranje = AccentColor
const defaultGreen = chalk.green;
const defaultBoldGreen = chalk.bold.green;
const defaultRed = chalk.red;
const defaultBoldRed = chalk.bold.red;
const defaultGray = chalk.gray;
const defaultBlue = chalk.blue;
const defaultBoldBlue = chalk.bold.blue;
const defaultOrange = chalk.hex('#FFA500');
const defaultBoldOrange = chalk.bold.hex('#FFA500');
const defaultWhite = chalk.white;

/**
 * Vraagt om bevestiging van de gebruiker
 */
function askConfirmation(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
        });
    });
}

/**
 * Vraagt om input van de gebruiker
 */
function askQuestion(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Stelt een vraag voor een array veld (ports, volumes, networks)
 */
async function askArrayField(field, colors) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    console.log(textWhite(`Huidige waarde: ${JSON.stringify(field.default)}`));
    
    const answer = await askQuestion(accentOrange(`${field.label} (druk Enter voor standaard, of geef nieuwe waarden gescheiden door komma's): `));
    
    if (!answer) {
        return field.default;
    }
    
    // Split op komma en trim elke waarde
    const result = answer.split(',').map(item => item.trim()).filter(item => item.length > 0);
    return result.length > 0 ? result : undefined;
}

/**
 * Stelt een vraag voor poorten (specifiek host poort aanpassen)
 */
async function askPortsField(field, colors) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    
    // Vraag om modus (Expose vs Ports)
    console.log(textWhite("Kies poort configuratie:"));
    console.log(commentGray("  - expose: [Default] Alleen intern bereikbaar (voor proxy)"));
    console.log(commentGray("  - ports:  Direct bereikbaar op host (public)"));
    
    const modeAnswer = await askQuestion(accentOrange("Kies optie [expose]/ports: "));
    const isPortsMode = modeAnswer.toLowerCase().trim() === 'ports';
    
    // Fallback naar standaard array input als er geen defaults zijn om te parsen
    if (!field.default || !Array.isArray(field.default) || field.default.length === 0) {
        const values = await askArrayField(field, colors);
        return {
            mode: isPortsMode ? 'ports' : 'expose',
            values: values
        };
    }

    const newPorts = [];
    console.log(textWhite(isPortsMode ? "Configureer poort mappings (druk Enter voor standaard):" : "Poorten voor expose (worden automatisch overgenomen):"));
    
    for (const portMapping of field.default) {
        // We gaan ervan uit dat de template een mapping bevat (host:container)
        const sepIndex = portMapping.lastIndexOf(':');
        let containerPort = portMapping;
        let hostPort = '';
        
        if (sepIndex !== -1) {
            containerPort = portMapping.substring(sepIndex + 1);
            hostPort = portMapping.substring(0, sepIndex);
        }
        
        if (isPortsMode) {
            const answer = await askQuestion(accentOrange(`  Host poort voor '${containerPort}' [${hostPort || containerPort}]: `));
            const finalHost = answer.trim() || hostPort || containerPort;
            newPorts.push(`${finalHost}:${containerPort}`);
        } else {
            // Expose mode: alleen container poort
            console.log(commentGray(`  - Container poort ${containerPort} wordt exposed.`));
            newPorts.push(containerPort);
        }
    }
    
    return {
        mode: isPortsMode ? 'ports' : 'expose',
        values: newPorts.length > 0 ? newPorts : undefined
    };
}

/**
 * Stelt een vraag voor volumes (specifiek host paths aanpassen)
 */
async function askVolumesField(field, colors) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    
    // Fallback naar standaard array input als er geen defaults zijn om te parsen
    if (!field.default || !Array.isArray(field.default) || field.default.length === 0) {
        return askArrayField(field, colors);
    }

    const newVolumes = [];
    console.log(textWhite("Configureer volumes (druk Enter voor standaard):"));
    
    for (const vol of field.default) {
        // Probeer host en container deel te scheiden
        // We zoeken naar ':/' omdat container paths meestal absoluut zijn (beginnen met /)
        let sepIndex = vol.indexOf(':/');
        
        // Fallback voor als er geen :/ is (bijv named volumes of relatieve container paden)
        if (sepIndex === -1) sepIndex = vol.indexOf(':');
        
        if (sepIndex === -1) {
            // Geen separator, behoud origineel
            newVolumes.push(vol);
            continue;
        }
        
        const hostPart = vol.substring(0, sepIndex);
        const containerPart = vol.substring(sepIndex + 1); // bevat ook :ro indien aanwezig
        
        const answer = await askQuestion(accentOrange(`  Host path voor '${containerPart}' [${hostPart}]: `));
        
        const finalHost = answer.trim() || hostPart;
        newVolumes.push(`${finalHost}:${containerPart}`);
    }
    
    return newVolumes;
}

/**
 * Stelt een vraag voor een select veld
 */
async function askSelectField(field, colors) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    console.log(textWhite(`Opties: ${field.options.join(', ')}`));
    
    const answer = await askQuestion(accentOrange(`${field.label} (druk Enter voor geen, of kies een optie): `));
    
    if (!answer) {
        return field.default;
    }
    
    if (field.options.includes(answer)) {
        return answer;
    }
    
    console.log(commentGray(`⚠️  "${answer}" is geen geldige optie, gebruik standaard.`));
    return field.default;
}

/**
 * Stelt een vraag voor netwerk configuratie (top-level of service-level)
 */
async function askNetworksField(field, colors, isTopLevel = true) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    
    // Default weergave afhandelen (array voor services, object voor top-level)
    let defaultDisplay = '';
    if (field.default) {
        if (Array.isArray(field.default)) {
            defaultDisplay = field.default.join(', ');
        } else if (typeof field.default === 'object') {
            defaultDisplay = Object.keys(field.default).join(', ');
        }
    }
    console.log(textWhite(`Huidige netwerken: ${defaultDisplay || 'geen'}`));
    
    const answer = await askQuestion(accentOrange(`${field.label} (druk Enter voor standaard, of geef namen gescheiden door komma's): `));
    
    if (!answer) {
        return field.default;
    }
    
    const names = answer.split(',').map(item => item.trim()).filter(item => item.length > 0);
    
    // Als het niet de top-level configuratie is, retourneren we gewoon de lijst met namen
    if (!isTopLevel) {
        return names.length > 0 ? names : undefined;
    }

    const networksConfig = {};
    
    for (const name of names) {
        // Vraag details voor elk netwerk
        const isExternal = await askConfirmation(accentOrange(`  Is netwerk '${name}' extern? (y/N): `));
        
        if (isExternal) {
            networksConfig[name] = { external: true };
            continue;
        }
        
        const isInternal = await askConfirmation(accentOrange(`  Is netwerk '${name}' intern? (y/N): `));
        
        if (isInternal) {
            networksConfig[name] = { internal: true };
            continue;
        }
        
        // Standaard (leeg object = default driver, geen expliciete 'bridge')
        networksConfig[name] = {};
    }
    
    // Als config leeg is, return undefined zodat de key verwijderd wordt uit YAML
    if (Object.keys(networksConfig).length === 0) {
        return undefined;
    }
    
    return networksConfig;
}

/**
 * Stelt een vraag voor een text veld
 */
async function askTextField(field, colors) {
    const { commentGray, accentOrange, textWhite } = colors;
    
    console.log(commentGray(`\n${field.description}`));
    
    const answer = await askQuestion(accentOrange(`${field.label} (druk Enter voor "${field.default}"): `));
    
    return answer || field.default;
}

/**
 * Zet een waarde in een geneste object structuur
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
            current[key] = {};
        }
        current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    
    // Als de waarde null of undefined is, verwijder het veld uit het object
    if (value === null || value === undefined) {
        delete current[lastKey];
    } else {
        current[lastKey] = value;
    }
}

/**
 * Customize de compose.yml op basis van de configuratie
 */
async function customizeCompose(composeContent, customizeConfig, colors) {
    const { statusBlue, commentGray, accentOrange, textWhite } = colors;
    
    console.log(statusBlue("\n--- CUSTOMIZE TEMPLATE ---\n"));
    
    // Parse YAML
    const composeData = yaml.load(composeContent);
    
    // Stel vragen voor elk veld
    for (const field of customizeConfig.fields) {
        let value;
        
        switch (field.type) {
            case 'text':
                value = await askTextField(field, colors);
                break;
            case 'select':
                value = await askSelectField(field, colors);
                break;
            case 'ports':
                const portsResult = await askPortsField(field, colors);
                
                // Speciale afhandeling voor ports/expose switch
                if (portsResult && typeof portsResult === 'object' && 'mode' in portsResult) {
                    // Bepaal parent path (bijv. services.nginx)
                    const lastDotIndex = field.key.lastIndexOf('.');
                    if (lastDotIndex !== -1) {
                        const parentPath = field.key.substring(0, lastDotIndex);
                        
                        if (portsResult.mode === 'expose') {
                            // Zet expose, verwijder ports
                            setNestedValue(composeData, `${parentPath}.expose`, portsResult.values);
                            setNestedValue(composeData, field.key, undefined);
                        } else {
                            // Zet ports, verwijder expose
                            setNestedValue(composeData, field.key, portsResult.values);
                            setNestedValue(composeData, `${parentPath}.expose`, undefined);
                        }
                        continue; // Sla de standaard setNestedValue over
                    }
                }
                value = portsResult;
                break;
            case 'list':
                value = await askArrayField(field, colors);
                break;
            case 'volumes':
                value = await askVolumesField(field, colors);
                break;
            case 'networks':
                value = await askNetworksField(field, colors, field.key === 'networks');
                break;
            default:
                console.log(commentGray(`⚠️  Onbekend veld type: ${field.type}, overslaan...`));
                continue;
        }
        
        // Zet de waarde in de compose data
        setNestedValue(composeData, field.key, value);
    }
    
    // Converteer terug naar YAML
    return yaml.dump(composeData, { indent: 2, lineWidth: -1 });
}

/**
 * Hoofdfunctie voor het genereren van compose bestanden
 * Gebruikt kleuren volgens COLOR_SCHEME.md
 */
export async function composeTool({ INSTALL_DIR, TEMPLATE_DIR, templateName, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange, white }) {
    // Gebruik doorgegeven kleuren of fallback naar defaults
    const statusBlue = boldBlue || defaultBoldBlue;
    const commentGray = gray || defaultGray;
    const successGreen = boldGreen || defaultBoldGreen;
    const failRed = boldRed || defaultBoldRed;
    const accentOrange = boldOrange || defaultBoldOrange;
    const textWhite = white || defaultWhite;
    
    const colors = { statusBlue, commentGray, successGreen, failRed, accentOrange, textWhite };
    
    console.log(statusBlue("\n--- DINSUM COMPOSE ---\n"));
    
    try {
        // Controleer of template bestaat
        const templatePath = path.join(TEMPLATE_DIR, templateName);
        
        if (!await fs.pathExists(templatePath)) {
            console.log(failRed(`❌ Fout: Template "${templateName}" niet gevonden.`));
            console.log(commentGray("\nBeschikbare templates:"));
            if (await fs.pathExists(TEMPLATE_DIR)) {
                const folders = await fs.readdir(TEMPLATE_DIR);
                folders.forEach(f => console.log(commentGray(`  - ${f}`)));
            }
            process.exit(1);
        }

        // Lees compose.yml
        const composeFile = path.join(templatePath, 'compose.yml');
        if (!await fs.pathExists(composeFile)) {
            console.log(failRed(`❌ Fout: compose.yml niet gevonden in template "${templateName}".`));
            process.exit(1);
        }
        
        let composeContent = await fs.readFile(composeFile, 'utf-8');
        
        // Vraag of gebruiker wil customizen
        console.log(textWhite(`Template "${templateName}" gevonden.`));
        
        const wantsCustomize = await askConfirmation(accentOrange("\nWil je deze template customizen? (y/N): "));
        
        if (wantsCustomize) {
            // Lees customize.json
            const customizeFile = path.join(templatePath, 'customize.json');
            
            if (!await fs.pathExists(customizeFile)) {
                console.log(commentGray("\n⚠️  Geen customize.json gevonden voor dit template."));
                console.log(commentGray("Template wordt zonder aanpassingen gekopieerd.\n"));
            } else {
                const customizeConfig = JSON.parse(await fs.readFile(customizeFile, 'utf-8'));
                composeContent = await customizeCompose(composeContent, customizeConfig, colors);
            }
        }

        // Schrijf compose.yml naar de huidige directory
        const targetDir = process.cwd();
        const outputFile = path.join(targetDir, 'compose.yml');
        await fs.writeFile(outputFile, composeContent, 'utf-8');
        
        console.log(successGreen(`\n✅ compose.yml is aangemaakt in de huidige directory!`));
        console.log(commentGray(`   Gebruik: ${accentOrange("docker compose up -d")} om te starten.\n`));
        
    } catch (error) {
        console.log(failRed(`\n❌ Fout tijdens compose: ${error.message}\n`));
        if (error.stack) {
            console.log(commentGray(error.stack));
        }
        process.exit(1);
    }
}
