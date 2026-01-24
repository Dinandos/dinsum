import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controleert of er een internetverbinding is
 */
async function checkInternetConnection() {
    try {
        // Probeer een verbinding te maken met een betrouwbare service
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconden timeout
        
        const response = await fetch('1.1.1.1', {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors'
        });
        
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        return false;
    }
}

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
 */
export async function updateTool({ INSTALL_DIR, blue, gray, green, red }) {
    console.log(blue("\n--- DINSUM UPDATE ---\n"));
    
    try {
        // Stap 1: Controleer internetverbinding
        console.log(gray("1. Controleren van internetverbinding..."));
        const hasInternet = await checkInternetConnection();
        
        if (!hasInternet) {
            console.log(red("❌ Geen internetverbinding gevonden. Update kan niet worden uitgevoerd."));
            process.exit(1);
        }
        console.log(green("✅ Internetverbinding gevonden.\n"));
        
        // Stap 2: Git fetch
        console.log(gray("2. Ophalen van laatste wijzigingen (git fetch origin/main)..."));
        await gitFetch();
        console.log(green("✅ Git fetch voltooid.\n"));
        
        // Stap 3: Git hard pull
        console.log(gray("3. Toepassen van updates (git reset --hard origin/main)..."));
        await gitHardPull();
        console.log(green("✅ Git hard pull voltooid.\n"));
        
        // Stap 4: Execute permissions instellen
        console.log(gray("4. Instellen van execute permissions voor index.js..."));
        await setExecutePermissions();
        console.log(green("✅ Execute permissions ingesteld.\n"));
        
        console.log(green("✅ Update voltooid! dinsum is bijgewerkt naar de laatste versie.\n"));
        
    } catch (error) {
        console.log(red(`\n❌ Fout tijdens update: ${error.message}\n`));
        process.exit(1);
    }
}
