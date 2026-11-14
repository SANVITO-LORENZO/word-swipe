/* ==========================================================================
   WORD SWIPE — ITALIAN LEVEL GENERATOR & LEXICAL SANITIZER
   Usage: node generatore.js
   ========================================================================== */

const fs = require('fs');

console.log('🚀 Starting sanitized level generation...');

// 01. Whitelist of valid Italian consonant-ending words (3-4 letters)
const VALID_CONSONANT_WORDS = new Set([
    'BAR', 'BIS', 'BLU', 'BUS', 'CON', 'EST', 'GAS', 'GOL',
    'NON', 'NORD', 'PER', 'SOL', 'SUB', 'SUD', 'TRAM', 'TRE'
]);

// 02. Blacklist of truncated stems and archaic/broken fragments in dizionario.txt
const BROKEN_FRAGMENTS = new Set([
    'AGI', 'ANI', 'ARI', 'ARO', 'BUI', 'CIO', 'CIOE', 'COL', 'CUI',
    'DALL', 'DELL', 'DFG', 'DIR', 'ECC', 'ERE', 'ETA', 'FLUI', 'GAI',
    'GIA', 'GILE', 'GIU', 'IRE', 'IVI', 'MEI', 'NEG', 'NEI', 'NELL',
    'NOI', 'NOT', 'OBL', 'OBER', 'OFFR', 'OLI', 'ONOR', 'OPER', 'OPIN',
    'OPT', 'ORD', 'ORL', 'ORN', 'OSA', 'OSI', 'OSO', 'OVE', 'OZI',
    'PAG', 'PALP', 'PAR', 'PARL', 'PASS', 'PECC', 'PEL', 'PEN', 'PEND',
    'PENS', 'PES', 'PESC', 'PIA', 'PIE', 'PIET', 'PII', 'PIO', 'PIU',
    'POMP', 'PORT', 'POS', 'POT', 'POTR', 'PRED', 'PREG', 'PREM', 'PRO',
    'PROV', 'PUL', 'PULS', 'PUNT', 'PUO', 'PUR', 'PURG', 'QUEL', 'QUOT',
    'RAG', 'RAP', 'RASP', 'REA', 'REC', 'REE', 'REGN', 'REI', 'REM',
    'REO', 'REST', 'RIAV', 'RIUN', 'ROMB', 'RUB', 'SAL', 'SALP', 'SAPR',
    'SCAL', 'SED', 'SERB', 'SFIL', 'SFIN', 'SIA', 'SII', 'SITU', 'SLEG',
    'SLOG', 'SNOD', 'SOF', 'SOLC', 'SOND', 'SOP', 'SPAR', 'SPER', 'SPES',
    'SPIR', 'STA', 'STIM', 'STIR', 'STO', 'STON', 'SUA', 'SUE', 'SUI',
    'SUL', 'SUO', 'SVI', 'TAL', 'TARD', 'TARP', 'TATU', 'TENT', 'TIEN',
    'TIR', 'TORN', 'TOS', 'TRA', 'TRAD', 'TREM', 'TRIT', 'TRO', 'TUA',
    'TUB', 'TUE', 'TUO', 'TUON', 'TUR', 'UDIR', 'UNA', 'UNO', 'USA',
    'USI', 'USO', 'UVA', 'UVE', 'VAL', 'VIEN', 'VOL', 'VUOT', 'ZIA', 'ZIE', 'ZII'
]);

function isValidItalianWord(word) {
    // Only strict uppercase A-Z between 3 and 5 chars (no apostrophes or symbols)
    if (!/^[A-Z]{3,5}$/.test(word)) return false;
    if (BROKEN_FRAGMENTS.has(word)) return false;

    // Must contain at least one vowel and no 3 identical consecutive letters
    if (!/[AEIOU]/.test(word) || /(.)\1\1/.test(word)) return false;

    // In Italian, valid words end in a vowel unless in the explicit whitelist
    const endsWithVowel = /[AEIOU]$/.test(word);
    if (!endsWithVowel && !VALID_CONSONANT_WORDS.has(word)) return false;

    return true;
}

function canFormWord(subWord, masterWord) {
    const pool = masterWord.split('');
    for (const ch of subWord) {
        const idx = pool.indexOf(ch);
        if (idx === -1) return false;
        pool.splice(idx, 1);
    }
    return true;
}

let dictionary = [];
try {
    const rawData = fs.readFileSync('dizionario.txt', 'utf-8');
    const uniqueWords = new Set(
        rawData
            .split(/\r?\n/)
            .map((w) => w.trim().toUpperCase())
            .filter(isValidItalianWord)
    );
    dictionary = [...uniqueWords];
} catch (err) {
    console.error("❌ Error: 'dizionario.txt' not found.");
    process.exit(1);
}

const masterWords = dictionary.filter((w) => w.length === 5);
const levels = [];
const seenSignatures = new Set();
let idCounter = 1001;

for (const master of masterWords) {
    const signature = master.split('').sort().join('');
    if (seenSignatures.has(signature)) continue;

    const allValid = dictionary
        .filter((w) => canFormWord(w, master))
        .sort((a, b) => b.length - a.length || a.localeCompare(b));

    const longWords = allValid.filter((w) => w.length >= 4);

    // Require at least 3 words of 4-5 letters and at least 5 total words
    if (longWords.length >= 3 && allValid.length >= 5) {
        seenSignatures.add(signature);

        const targetWords = allValid.slice(0, 8);
        const bonusWords = allValid.slice(8);

        levels.push({
            id: idCounter++,
            letters: master.split('').sort(() => Math.random() - 0.5),
            words: targetWords,
            bonus: bonusWords
        });
    }
}

fs.writeFileSync('puzzles.json', JSON.stringify(levels, null, 4));
console.log(`✅ Generated ${levels.length} clean, verified Italian levels in 'puzzles.json'.`);