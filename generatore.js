const fs = require('fs');

console.log("🚀 Inizio generazione dei livelli...");

// 1. Legge il file del dizionario
let dictionary = [];
try {
    const rawData = fs.readFileSync('dizionario.txt', 'utf-8');
    // Pulisce le parole, le mette in maiuscolo e tiene solo quelle da 3 a 5 lettere
    dictionary = rawData.split('\n')
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length >= 3 && w.length <= 5);
} catch (e) {
    console.error("❌ Errore: Crea un file 'dizionario.txt' con una parola per riga!");
    process.exit(1);
}

// 2. Seleziona le "Parole Madri" (Esattamente 5 lettere)
const masterWords = dictionary.filter(w => w.length === 5);

// Funzione helper: Controlla se 'subWord' si può scrivere usando le lettere di 'masterWord'
function canFormWord(subWord, masterWord) {
    let masterLetters = masterWord.split('');
    for (let char of subWord) {
        const index = masterLetters.indexOf(char);
        if (index === -1) return false; // Lettera mancante
        masterLetters.splice(index, 1); // Rimuove la lettera usata (gestisce correttamente le doppie)
    }
    return true;
}

const levels = [];
const seenSignatures = new Set(); // Per evitare livelli doppioni (es. ROMA e MORA)
let idCounter = 1001;

// 3. Motore di Generazione
for (let master of masterWords) {
    // Crea una "firma" alfabetica delle lettere per evitare doppioni
    const signature = master.split('').sort().join('');
    if (seenSignatures.has(signature)) continue; 
    
    // Trova tutte le parole nel dizionario formabili con queste 5 lettere
    const validWords = dictionary.filter(w => canFormWord(w, master));

    // Un livello è bello da giocare se ha la parola da 5 lettere e almeno altre 3 parole più corte
    if (validWords.length >= 4) {
        seenSignatures.add(signature);
        
        levels.push({
            id: idCounter++,
            // Mischia l'ordine delle 5 lettere per la UI del cerchio
            letters: master.split('').sort(() => Math.random() - 0.5),
            // Ordina le parole da trovare dalla più lunga alla più corta
            words: validWords.sort((a, b) => b.length - a.length) 
        });
    }
}

// 4. Scrive fisicamente il file puzzles.json
fs.writeFileSync('puzzles.json', JSON.stringify(levels, null, 4));

console.log(`✅ Finito! Ho generato ${levels.length} livelli unici e perfetti in 'puzzles.json'.`);