import readline from 'readline';

/**
 * Maakt een readline interface aan
 */
export function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Stelt een vraag en retourneert het antwoord
 */
export function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

/**
 * Vraagt om bevestiging (y/n)
 */
export function askConfirmation(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            const normalized = answer.toLowerCase().trim();
            resolve(normalized === 'y' || normalized === 'yes');
        });
    });
}

export function closeInterface(rl) {
    rl.close();
}