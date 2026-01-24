import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Verwijdert de npm link
 */
async function removeNpmLink() {
    try {
        // Probeer npm unlink uit te voeren
        // Dit verwijdert de symlink die is aangemaakt met 'npm link'
        const { stdout, stderr } = await execAsync('npm unlink -g dinsum', {
            cwd: path.dirname(__dirname)
        });
        
        // npm unlink kan warnings geven, maar dat is ok
        return true;
    } catch (error) {
        // Als npm unlink faalt, betekent het waarschijnlijk dat het niet gelinkt is
        // of dat we geen rechten hebben. We gaan door met de uninstall.
        console.warn(`Waarschuwing: npm unlink mislukt (mogelijk niet gelinkt): ${error.message}`);
        return false;
    }
}

/**
 * Verwijdert de installatie directory
 */
async function removeInstallDirectory(installDir) {
    try {
        // Controleer of de directory bestaat
        if (!await fs.pathExists(installDir)) {
            return false; // Directory bestaat niet
        }

        // Verwijder de hele directory inclusief alle bestanden
        await fs.remove(installDir);
        return true;
    } catch (error) {
        throw new Error(`Verwijderen van installatie directory mislukt: ${error.message}`);
    }
}

/**
 * Hoofdfunctie voor het verwijderen van dinsum
 */
export async function uninstallTool({ INSTALL_DIR, orange, red, white }) {
    console.log(orange("\n--- DINSUM UNINSTALL ---\n"));
    
    try {
        // Toon informatie over wat er verwijderd gaat worden
        console.log(white("Dit zal dinsum volledig verwijderen:"));
        console.log(white(`  - Installatie directory: ${INSTALL_DIR}`));
        console.log(white("  - npm link verwijderen\n"));

        // Vraag om bevestiging
        const confirmed = await askConfirmation(orange("Weet je zeker dat je dinsum wilt verwijderen? (y/N): "));
        
        if (!confirmed) {
            console.log(white("\n❌ Uninstall geannuleerd.\n"));
            return;
        }

        console.log(white("\n"));

        // Stap 1: Verwijder npm link
        console.log(white("1. Verwijderen van npm link..."));
        await removeNpmLink();
        console.log(white("✅ npm link verwijderd.\n"));

        // Stap 2: Verwijder installatie directory
        console.log(white(`2. Verwijderen van installatie directory (${INSTALL_DIR})...`));
        const removed = await removeInstallDirectory(INSTALL_DIR);
        
        if (removed) {
            console.log(white("✅ Installatie directory verwijderd.\n"));
        } else {
            console.log(white("⚠️  Installatie directory bestaat niet of is al verwijderd.\n"));
        }

        console.log(orange("✅ dinsum is volledig verwijderd!\n"));
        console.log(white("Bedankt voor het gebruik van dinsum. Tot ziens! 👋\n"));

    } catch (error) {
        console.log(red(`\n❌ Fout tijdens uninstall: ${error.message}\n`));
        console.log(white("Mogelijk moet je handmatig de volgende directory verwijderen:"));
        console.log(white(`  ${INSTALL_DIR}\n`));
        process.exit(1);
    }
}
