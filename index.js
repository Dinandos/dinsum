#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Functies importeren uit losse bestanden in ./features
import { updateTool } from './features/update.js';
import { uninstallTool } from './features/uninstall.js';
import { composeTool } from './features/compose.js';

// Fix voor __dirname in moderne ESM mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTALL_DIR = __dirname;
const TEMPLATE_DIR = path.join(INSTALL_DIR, 'templates');
const command = process.argv[2];
const templateName = process.argv[3]; // Voor compose command
const targetDir = process.cwd();

// Kleuren instellen volgens COLOR_SCHEME.md
// Groen = Succes, Rood = Fail, Grijs = Comment, Blauw = Status, Oranje = AccentColor
const green = chalk.green;           // Succes
const boldGreen = chalk.bold.green; // Succes (bold)
const red = chalk.red;               // Fail
const boldRed = chalk.bold.red;     // Fail (bold)
const gray = chalk.gray;             // Comment
const blue = chalk.blue;             // Status
const boldBlue = chalk.bold.blue;   // Status (bold)
const orange = chalk.hex('#FFA500'); // AccentColor
const boldOrange = chalk.bold.hex('#FFA500'); // AccentColor (bold)
const white = chalk.white;           // Standaard tekst

async function run() {
    console.log(boldBlue("\n--- DINSUM CLI TOOL ---"));

    if (command === 'update') {
        await updateTool({ INSTALL_DIR, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange });
        return;
    }

    if (command === 'uninstall') {
        await uninstallTool({ INSTALL_DIR, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange, white });
        return;
    }

    if (command === 'compose') {
        if (!templateName) {
            console.log(boldRed("❌ Fout: Geen template naam opgegeven."));
            console.log(white("Gebruik: ") + orange("dinsum compose <template>"));
            if (fs.existsSync(TEMPLATE_DIR)) {
                console.log(gray("\nBeschikbare templates:"));
                const folders = fs.readdirSync(TEMPLATE_DIR);
                folders.forEach(f => console.log(gray("  - ") + white(f)));
            }
            return;
        }
        await composeTool({ INSTALL_DIR, TEMPLATE_DIR, templateName, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange, white });
        return;
    }

    if (!command) {
        console.log(white("Gebruik: ") + blue("dinsum <template>") + gray(" | ") + orange("update") + gray(" | ") + orange("uninstall") + gray(" | ") + orange("compose <template>"));
        if (fs.existsSync(TEMPLATE_DIR)) {
            const folders = fs.readdirSync(TEMPLATE_DIR);
            folders.forEach(f => console.log(gray(" - ") + white(f)));
        }
        return;
    }

    const source = path.join(TEMPLATE_DIR, command);
    if (fs.existsSync(source)) {
        await fs.copy(source, targetDir);
        console.log(boldGreen("✅ Template ") + blue(command) + boldGreen(" staat klaar!"));
    } else {
        console.log(boldRed(`❌ Fout: Template "${command}" niet gevonden.`));
    }
}

run();