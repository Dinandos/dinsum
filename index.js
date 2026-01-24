#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Het pad waar de tool wordt geïnstalleerd op Linux
const TEMPLATE_DIR = path.join(__dirname, 'templates');
const serviceName = process.argv[2];
const targetDir = process.cwd();

async function run() {
    if (!serviceName) {
        console.log("❌ Gebruik: boilerplate <naam>");
        const folders = fs.readdirSync(TEMPLATE_DIR);
        console.log("Beschikbare templates:", folders.join(", "));
        return;
    }

    const source = path.join(TEMPLATE_DIR, serviceName);

    if (fs.existsSync(source)) {
        try {
            await fs.copy(source, targetDir);
            console.log(`✅ Succes! ${serviceName} is naar deze map gekopieerd.`);
        } catch (err) {
            console.error("❌ Fout bij kopiëren:", err);
        }
    } else {
        console.log(`⚠️ Template "${serviceName}" niet gevonden in ${TEMPLATE_DIR}`);
    }
}

run();