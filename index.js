#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Functies importeren uit losse bestanden in ./features
import { updateTool } from './features/update.js';
import { uninstallTool } from './features/uninstall.js';

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
const green = chalk.bold.green;

async function run() {
    console.log(blue("\n--- DINSUM CLI TOOL ---"));

    if (command === 'update') {
        await updateTool({ INSTALL_DIR, blue, gray, green, red });
        return;
    }

    if (command === 'uninstall') {
        await uninstallTool({ INSTALL_DIR, orange, red, white });
        return;
    }

    if (!command) {
        console.log(white("Gebruik: ") + blue("dinsum <template>") + gray(" | ") + orange("update") + gray(" | ") + red("uninstall"));
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