#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const INSTALL_DIR = __dirname;
const TEMPLATE_DIR = path.join(INSTALL_DIR, 'templates');
const command = process.argv[2];
const targetDir = process.cwd();

async function run() {
    // --- FEATURE: UPDATE ---
    if (command === 'update') {
        console.log("🔍 Controleren op internetverbinding...");
        try {
            execSync('ping -c 1 google.com', { stdio: 'ignore' });
            console.log("🔄 Update ophalen van GitHub...");
            execSync('git fetch origin && git reset --hard origin/main', { cwd: INSTALL_DIR, stdio: 'inherit' });
            console.log("✅ Update succesvol!");
        } catch (err) {
            console.error("❌ Update mislukt: Geen internet of Git fout.");
        }
        return;
    }

    // --- FEATURE: UNINSTALL ---
    if (command === 'uninstall') {
        console.log("⚠️ Weet je het zeker? Dit verwijdert de tool en alle templates.");
        console.log("Druk op Ctrl+C om te annuleren, of wacht 3 seconden...");
        
        setTimeout(() => {
            try {
                console.log("🗑️ Bezig met verwijderen...");
                // Verwijdert de symlink (het commando) en de map
                execSync(`sudo npm uninstall -g dinsum`, { stdio: 'inherit' });
                execSync(`rm -rf ${INSTALL_DIR}`, { stdio: 'inherit' });
                console.log("✅ 'dinsum' is volledig verwijderd.");
            } catch (err) {
                console.error("❌ Fout bij het verwijderen. Probeer handmatig: sudo npm uninstall -g dinsum");
            }
        }, 3000);
        return;
    }

    // --- STANDAARD BOILERPLATE LOGICA ---
    if (!command) {
        console.log("🚀 Dinsum CLI Tool");
        console.log("Gebruik: dinsum <template> | dinsum update | dinsum uninstall");
        if (fs.existsSync(TEMPLATE_DIR)) {
            const folders = fs.readdirSync(TEMPLATE_DIR);
            console.log("\nBeschikbare templates:", folders.join(", "));
        }
        return;
    }

    const source = path.join(TEMPLATE_DIR, command);
    if (fs.existsSync(source)) {
        await fs.copy(source, targetDir);
        console.log(`✅ ${command} klaargezet in huidige map.`);
    } else {
        console.log(`⚠️ Template "${command}" niet gevonden.`);
    }
}

run();