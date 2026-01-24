#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk'); // Voor de kleuren

const INSTALL_DIR = __dirname;
const TEMPLATE_DIR = path.join(INSTALL_DIR, 'templates');
const command = process.argv[2];
const targetDir = process.cwd();

// Kleurenconfiguratie
const blue = chalk.bold.blue;
const orange = chalk.keyword('orange'); // Of chalk.yellow
const red = chalk.bold.red;
const gray = chalk.gray;
const white = chalk.white;

async function run() {
    console.log(blue("\n--- DINSUM CLI TOOL ---"));

    // --- FEATURE: UPDATE ---
    if (command === 'update') {
        console.log(gray("🔍 Controleren op internetverbinding..."));
        try {
            execSync('ping -c 1 google.com', { stdio: 'ignore' });
            console.log(blue("🔄 Update ophalen van GitHub..."));
            execSync('git fetch origin && git reset --hard origin/main', { cwd: INSTALL_DIR, stdio: 'inherit' });
            console.log(white("✅ Update ") + blue("succesvol") + white(" uitgevoerd!"));
        } catch (err) {
            console.error(red("❌ Update mislukt: Geen internet of Git-fout."));
        }
        return;
    }

    // --- FEATURE: UNINSTALL ---
    if (command === 'uninstall') {
        console.log(orange("⚠️  WAARSCHUWING: Dit verwijdert de tool en alle templates."));
        console.log(gray("Druk op Ctrl+C om te annuleren, of wacht 3 seconden..."));
        
        setTimeout(() => {
            try {
                console.log(red("🗑️  Bezig met verwijderen..."));
                execSync(`sudo npm uninstall -g dinsum`, { stdio: 'inherit' });
                execSync(`rm -rf ${INSTALL_DIR}`, { stdio: 'inherit' });
                console.log(white("✅ 'dinsum' is ") + red("verwijderd") + white("."));
            } catch (err) {
                console.error(red("❌ Fout bij verwijderen. Doe handmatig: sudo npm uninstall -g dinsum"));
            }
        }, 3000);
        return;
    }

    // --- HELP MENU / NO COMMAND ---
    if (!command) {
        console.log(white("Gebruik: ") + blue("dinsum <template>") + gray(" | ") + orange("update") + gray(" | ") + red("uninstall"));
        
        if (fs.existsSync(TEMPLATE_DIR)) {
            const folders = fs.readdirSync(TEMPLATE_DIR);
            console.log(white("\nBeschikbare templates:"));
            folders.forEach(f => console.log(gray(" - ") + white(f)));
        }
        console.log(blue("-----------------------\n"));
        return;
    }

    // --- TEMPLATE KOPIËREN ---
    const source = path.join(TEMPLATE_DIR, command);
    if (fs.existsSync(source)) {
        console.log(gray(`📦 Kopiëren van ${command}...`));
        await fs.copy(source, targetDir);
        console.log(white("✅ Template ") + blue(command) + white(" staat klaar in de huidige map!"));
    } else {
        console.log(red(`⚠️  Fout: Template "${command}" niet gevonden.`));
        console.log(gray("Typ 'dinsum' zonder argumenten om de lijst te zien."));
    }
}

run();