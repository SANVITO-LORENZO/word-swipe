const fs = require('fs');

console.log("🚀 Inizio generazione dei livelli...");

// 1. Legge il file del dizionario
let dictionary = [];
try {
    const rawData = fs.readFileSync('dizionario.txt', 'utf-8');
    dictionary = rawData.split('\n')
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length >= 3 && w.length <= 5);
} catch (e) {
    console.error("❌ Errore: Crea un file 'dizionario.txt' con una parola per riga!");
    process.exit(1);
}

// 2. Seleziona le "Parole Madri" (Esattamente 5 lettere)
const masterWords = dictionary.filter(w => w.length === 5);

// Funzione helper
function canFormWord(subWord, masterWord) {
    let masterLetters = masterWord.split('');
    for (let char of subWord) {
        const index = masterLetters.indexOf(char);
        if (index === -1) return false;
        masterLetters.splice(index, 1); 
    }
    return true;
}

const levels = [];
const seenSignatures = new Set();
let idCounter = 1001;

// 3. Motore di Generazione
for (let master of masterWords) {
    const signature = master.split('').sort().join('');
    if (seenSignatures.has(signature)) continue; 
    
    let validWords = dictionary.filter(w => canFormWord(w, master));

    if (validWords.length >= 4) {
        seenSignatures.add(signature);
        
        // Ordina le parole in modo che le più corte vengano mostrate prima (UX migliore)
        validWords.sort((a, b) => a.length - b.length);

        levels.push({
            id: idCounter++,
            letters: master.split('').sort(() => Math.random() - 0.5),
            words: validWords 
        });
    }
}

// 4. Scrive il file
fs.writeFileSync('puzzles.json', JSON.stringify(levels, null, 4));

console.log(`✅ Finito! Ho generato ${levels.length} livelli e il file JSON è ora strutturato perfettamente per lo script.js.`);