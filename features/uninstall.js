import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';

const execAsync = promisify(exec);
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
 * Gebruikt kleuren volgens COLOR_SCHEME.md
 */
export async function uninstallTool({ INSTALL_DIR, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange, white }) {
    // Gebruik doorgegeven kleuren of fallback naar defaults
    const accentOrange = boldOrange || defaultBoldOrange;
    const textWhite = white || defaultWhite;
    const commentGray = gray || defaultGray;
    const successGreen = boldGreen || defaultBoldGreen;
    const failRed = boldRed || defaultBoldRed;
    const warningOrange = orange || defaultOrange;
    
    console.log(accentOrange("\n--- DINSUM UNINSTALL ---\n"));
    
    try {
        // Toon informatie over wat er verwijderd gaat worden
        console.log(textWhite("Dit zal dinsum volledig verwijderen:"));
        console.log(commentGray(`  - Installatie directory: ${INSTALL_DIR}`));
        console.log(commentGray("  - npm link verwijderen\n"));

        // Vraag om bevestiging
        const confirmed = await askConfirmation(accentOrange("Weet je zeker dat je dinsum wilt verwijderen? (y/N): "));
        
        if (!confirmed) {
            console.log(failRed("\n❌ Uninstall geannuleerd.\n"));
            return;
        }

        console.log(textWhite("\n"));

        // Stap 1: Verwijder npm link
        console.log(commentGray("1. Verwijderen van npm link..."));
        await removeNpmLink();
        console.log(successGreen("✅ npm link verwijderd.\n"));

        // Stap 2: Verwijder installatie directory
        console.log(commentGray(`2. Verwijderen van installatie directory (${INSTALL_DIR})...`));
        const removed = await removeInstallDirectory(INSTALL_DIR);
        
        if (removed) {
            console.log(successGreen("✅ Installatie directory verwijderd.\n"));
        } else {
            console.log(warningOrange("⚠️  Installatie directory bestaat niet of is al verwijderd.\n"));
        }

        console.log(successGreen("✅ dinsum is volledig verwijderd!\n"));
        console.log(commentGray("Bedankt voor het gebruik van dinsum. Tot ziens! 👋\n"));

    } catch (error) {
        console.log(failRed(`\n❌ Fout tijdens uninstall: ${error.message}\n`));
        console.log(commentGray("Mogelijk moet je handmatig de volgende directory verwijderen:"));
        console.log(commentGray(`  ${INSTALL_DIR}\n`));
        process.exit(1);
    }
}
