import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { runComposeWizard } from './compose_wizard.js';

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
 * Hoofdfunctie voor het genereren van compose bestanden
 * Gebruikt kleuren volgens COLOR_SCHEME.md
 */
export async function composeTool({ INSTALL_DIR, TEMPLATE_DIR, templateName, blue, boldBlue, gray, green, boldGreen, red, boldRed, orange, boldOrange, white }) {
    // Gebruik doorgegeven kleuren of fallback naar defaults
    const statusBlue = boldBlue || defaultBoldBlue;
    const commentGray = gray || defaultGray;
    const successGreen = boldGreen || defaultBoldGreen;
    const failRed = boldRed || defaultBoldRed;
    const accentOrange = boldOrange || defaultBoldOrange;
    const textWhite = white || defaultWhite;
    
    const colors = { statusBlue, commentGray, successGreen, failRed, accentOrange, textWhite };
    
    console.log(statusBlue("\n--- DINSUM COMPOSE ---\n"));
    
    try {
        // Controleer of template bestaat
        const templatePath = path.join(TEMPLATE_DIR, templateName);
        
        if (!await fs.pathExists(templatePath)) {
            console.log(failRed(`❌ Fout: Template "${templateName}" niet gevonden.`));
            console.log(commentGray("\nBeschikbare templates:"));
            if (await fs.pathExists(TEMPLATE_DIR)) {
                const folders = await fs.readdir(TEMPLATE_DIR);
                folders.forEach(f => console.log(commentGray(`  - ${f}`)));
            }
            process.exit(1);
        }

        // Lees compose.yml
        const composeFile = path.join(templatePath, 'compose.yml');
        if (!await fs.pathExists(composeFile)) {
            console.log(failRed(`❌ Fout: compose.yml niet gevonden in template "${templateName}".`));
            process.exit(1);
        }
        
        let composeContent = await fs.readFile(composeFile, 'utf-8');
        
        console.log(textWhite(`Template "${templateName}" gevonden.`));
        
        // Start de wizard voor customization
        const result = await runComposeWizard(composeContent, colors);
        
        const targetDir = process.cwd();
        
        // Schrijf compose.yml
        const outputFile = path.join(targetDir, 'compose.yml');
        await fs.writeFile(outputFile, result.yaml, 'utf-8');

        // Schrijf .env
        const envFile = path.join(targetDir, '.env');
        await fs.writeFile(envFile, result.env, 'utf-8');
        
        console.log(successGreen(`\n✅ compose.yml en .env zijn aangemaakt!`));
        console.log(commentGray(`   Gebruik: ${accentOrange("docker compose up -d")} om te starten.\n`));
        
    } catch (error) {
        console.log(failRed(`\n❌ Fout tijdens compose: ${error.message}\n`));
        if (error.stack) {
            console.log(commentGray(error.stack));
        }
        process.exit(1);
    }
}
