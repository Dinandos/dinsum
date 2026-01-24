import { createInterface, askQuestion, closeInterface } from '../utils/io.js';

export async function runComposeWizard(envContent, colors) {
    const { accentOrange, textWhite, commentGray } = colors;
    const rl = createInterface();
    
    console.log(textWhite("\nConfigureren van variabelen (.env):\n"));

    const lines = envContent.split('\n');
    const newLines = [];

    for (let line of lines) {
        const trimmed = line.trim();
        
        // Sla comments en lege regels over (behoud ze wel in output)
        if (!trimmed || trimmed.startsWith('#')) {
            newLines.push(line);
            continue;
        }

        // Check voor KEY=VALUE
        const eqIndex = line.indexOf('=');
        if (eqIndex !== -1) {
            const key = line.substring(0, eqIndex).trim();
            const defaultValue = line.substring(eqIndex + 1).trim();
            
            const answer = await askQuestion(rl, accentOrange(`Wat wil je dat ${key} wordt? [${defaultValue}]: `));
            const finalValue = answer !== '' ? answer : defaultValue;
            
            newLines.push(`${key}=${finalValue}`);
        } else {
            newLines.push(line);
        }
    }

    closeInterface(rl);

    return newLines.join('\n');
}
