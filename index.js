#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const INSTALL_DIR = __dirname; // De map waar de tool staat
const TEMPLATE_DIR = path.join(INSTALL_DIR, 'templates');
const command = process.argv[2];
const targetDir = process.cwd();

async function run() {
    // 1. Check of de gebruiker 'update' typte
    if (command === 'update') {
        console.log("🔄 Bezig met ophalen van de nieuwste versie van GitHub...");
        try {
            // Voer de harde reset uit binnen de installatiemap
            execSync('git fetch origin && git reset --hard origin/main', { cwd: INSTALL_DIR, stdio: 'inherit' });
            console.log("✅ Update voltooid! Je gebruikt nu de nieuwste versie.");
        } catch (err) {
            console.error("❌ Update mislukt. Controleer je internetverbinding of Git status.");
        }
        return;
    }

    // 2. Normale boilerplate functionaliteit
    if (!command) {
        console.log("❌ Gebruik: dinsum <naam> of dinsum update");
        if (fs.existsSync(TEMPLATE_DIR)) {
            const folders = fs.readdirSync(TEMPLATE_DIR);
            console.log("Beschikbare templates:", folders.join(", "));
        }
        return;
    }

    const source = path.join(TEMPLATE_DIR, command);

    if (fs.existsSync(source)) {
        try {
            await fs.copy(source, targetDir);
            console.log(`✅ Succes! ${command} is gekopieerd.`);
        } catch (err) {
            console.error("❌ Fout bij kopiëren:", err);
        }
    } else {
        console.log(`⚠️ Template "${command}" niet gevonden.`);
    }
}

run();