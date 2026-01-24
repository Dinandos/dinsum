#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

// Fix voor __dirname in moderne ESM mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTALL_DIR = __dirname;
const TEMPLATE_DIR = path.join(INSTALL_DIR, 'templates');
const command = process.argv[2];
const targetDir = process.cwd();

// Kleuren instellen met Chalk v5 syntax
const blue = chalk.bold.blue;
const orange = chalk.hex('#FFA500'); // Mooi oranje
const red = chalk.bold.red;
const gray = chalk.gray;
const white = chalk.white;

async function run() {
    console.log(blue("\n--- DINSUM CLI TOOL ---"));

    if (command === 'update') {
        console.log(gray("🔍 Controleren op internetverbinding..."));
        try {
            execSync('ping -c 1 google.com', { stdio: 'ignore' });
            console.log(blue("🔄 Update ophalen van GitHub..."));
            
            // We sturen de output naar 'ignore' zodat je geen "HEAD is now at..." ziet
            execSync('git fetch origin && git reset --hard origin/main', { 
                cwd: INSTALL_DIR, 
                stdio: 'ignore' 
            });
            
            console.log(white("✅ Update succesvol!"));
        } catch (err) {
            console.error(red("❌ Update mislukt: Geen internet of Git fout."));
        }
        return;
    }

    if (command === 'uninstall') {
        console.log(orange("⚠️  WAARSCHUWING: Dit verwijdert de tool en alle templates."));
        setTimeout(() => {
            try {
                execSync(`sudo npm uninstall -g dinsum`, { stdio: 'inherit' });
                execSync(`rm -rf ${INSTALL_DIR}`, { stdio: 'inherit' });
                console.log(white("✅ 'dinsum' is verwijderd."));
            } catch (err) {
                console.error(red("❌ Fout bij verwijderen."));
            }
        }, 3000);
        return;
    }

    if (!command) {
        console.log(white("Gebruik: ") + blue("dinsum <template>") + gray(" | ") + orange("update"));
        if (fs.existsSync(TEMPLATE_DIR)) {
            const folders = fs.readdirSync(TEMPLATE_DIR);
            folders.forEach(f => console.log(gray(" - ") + white(f)));
        }
        return;
    }

    const source = path.join(TEMPLATE_DIR, command);
    if (fs.existsSync(source)) {
        await fs.copy(source, targetDir);
        console.log(white("✅ Template ") + blue(command) + white(" staat klaar!"));
    } else {
        console.log(red(`⚠️  Fout: Template "${command}" niet gevonden.`));
    }
}

run();