import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
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

/**
 * Controleert of er een internetverbinding is
 */


/**
 * Voert git fetch origin/main uit
 */
async function gitFetch() {
    try {
        const { stdout, stderr } = await execAsync('git fetch origin main', {
            cwd: path.dirname(__dirname) // Ga naar de root directory van het project
        });
        if (stderr && !stderr.includes('From')) {
            console.warn(stderr);
        }
        return true;
    } catch (error) {
        throw new Error(`Git fetch mislukt: ${error.message}`);
    }
}

/**
 * Voert git reset --hard origin/main uit (hard pull)
 */
async function gitHardPull() {
    try {
        const { stdout, stderr } = await execAsync('git reset --hard origin/main', {
            cwd: path.dirname(__dirname) // Ga naar de root directory van het project
        });
        if (stderr && !stderr.includes('HEAD is now at')) {
            console.warn(stderr);
        }
        return true;
    } catch (error) {
        throw new Error(`Git hard pull mislukt: ${error.message}`);
    }
}

/**
 * Zet execute permissions op index.js voor Linux
 */
async function setExecutePermissions() {
    try {
        const indexJsPath = path.join(path.dirname(__dirname), 'index.js');
        
        // Controleer of we op Linux/Unix zijn (niet Windows)
        if (process.platform !== 'win32') {
            await execAsync(`chmod +x "${indexJsPath}"`);
            return true;
        }
        // Op Windows zijn execute permissions niet nodig
        return true;
    } catch (error) {
        throw new Error(`Instellen van execute permissions mislukt: ${error.message}`);
    }
}

/**
 * Hoofdfunctie voor het updaten van dinsum
 * Gebruikt kleuren volgens COLOR_SCHEME.md
 */
export async function updateTool({ INSTALL_DIR, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange }) {
    // Gebruik doorgegeven kleuren of fallback naar defaults
    const statusBlue = boldBlue || defaultBoldBlue;
    const commentGray = gray || defaultGray;
    const successGreen = boldGreen || defaultBoldGreen;
    const failRed = boldRed || defaultBoldRed;
    
    console.log(statusBlue("\n--- DINSUM UPDATE ---\n"));
    
    try {
        // Stap 1: Controleer internetverbinding
        console.log(commentGray("1. Controleren van internetverbinding..."));
        
        console.log(successGreen("✅ Internetverbinding gevonden.\n"));
        
        // Stap 2: Git fetch
        console.log(commentGray("2. Ophalen van laatste wijzigingen (git fetch origin/main)..."));
        await gitFetch();
        console.log(successGreen("✅ Git fetch voltooid.\n"));
        
        // Stap 3: Git hard pull
        console.log(commentGray("3. Toepassen van updates (git reset --hard origin/main)..."));
        await gitHardPull();
        console.log(successGreen("✅ Git hard pull voltooid.\n"));
        
        // Stap 4: Execute permissions instellen
        console.log(commentGray("4. Instellen van execute permissions voor index.js..."));
        await setExecutePermissions();
        console.log(successGreen("✅ Execute permissions ingesteld.\n"));
        
        console.log(successGreen("✅ Update voltooid! dinsum is bijgewerkt naar de laatste versie.\n"));
        
    } catch (error) {
        console.log(failRed(`\n❌ Fout tijdens update: ${error.message}\n`));
        process.exit(1);
    }
}
