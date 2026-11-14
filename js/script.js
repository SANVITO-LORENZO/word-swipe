/* ==========================================================================
   WORD SWIPE — DAILY PUZZLE ENGINE (WITH BUILT-IN FALLBACK DB)
   Author: Lorenzo Sanvito (https://github.com/SANVITO-LORENZO)
   Notice: Proprietary source code. Unauthorized reproduction is prohibited.
   ========================================================================== */

const FALLBACK_PUZZLES = [
    { id: 1001, letters: ["A", "M", "O", "R", "E"], words: ["AMORE", "MARE", "MORA", "MORE", "ORMA", "ORME", "RAME", "RAMO"], bonus: ["REMO", "ROMA", "AMO", "ORA"] },
    { id: 1002, letters: ["P", "A", "R", "T", "E"], words: ["PARTE", "ARTE", "APRE", "PARE", "PERA", "RATE", "TARE", "TRE"], bonus: ["APE", "PER"] },
    { id: 1003, letters: ["C", "A", "R", "T", "E"], words: ["CARTE", "CERTA", "CRETA", "ARTE", "CARE", "CERA", "CREA", "TACE"], bonus: ["RATE", "TARE", "TRE"] },
    { id: 1004, letters: ["S", "A", "L", "T", "O"], words: ["SALTO", "STOLA", "ALTO", "LATO", "SOLA", "TOSA", "SALA"], bonus: ["SALO", "SOL"] },
    { id: 1005, letters: ["F", "I", "O", "R", "E"], words: ["FIORE", "FIERO", "FERI", "EROI", "FORI", "IRE", "ORE"], bonus: ["REO", "REI"] },
    { id: 1006, letters: ["P", "I", "A", "N", "O"], words: ["PIANO", "NOIA", "PAIO", "PANI", "PINO", "ANO", "API"], bonus: ["NOI", "POI"] },
    { id: 1007, letters: ["C", "O", "R", "S", "A"], words: ["CORSA", "SACRO", "ARCO", "CARO", "CASO", "COSA", "ORSA", "ROSA"], bonus: ["CAOS", "RASO", "OCA", "ORA"] },
    { id: 1008, letters: ["V", "E", "N", "T", "O"], words: ["VENTO", "NOTE", "NOVE", "VETO", "NEO", "OVE"], bonus: ["VOI"] },
    { id: 1009, letters: ["S", "P", "E", "R", "A"], words: ["SPERA", "PRESA", "PERSA", "ASPRE", "APRE", "PARE", "PERA", "SERA"], bonus: ["PESA", "RESA", "APE", "PER"] },
    { id: 1010, letters: ["C", "O", "N", "T", "A"], words: ["CONTA", "CANTO", "NATO", "NOTA", "TANA", "CON", "OCA"], bonus: ["ANO"] },
    { id: 1011, letters: ["M", "O", "N", "T", "E"], words: ["MONTE", "MENTO", "MENO", "NOME", "NOTE", "NEO"], bonus: ["NON"] },
    { id: 1012, letters: ["P", "O", "R", "T", "A"], words: ["PORTA", "PARTO", "PRATO", "APRO", "ARTO", "OPTA", "RAPO", "ORA"], bonus: ["ARO"] },
    { id: 1013, letters: ["G", "R", "A", "N", "O"], words: ["GRANO", "RAGNO", "RANGO", "GARA", "ORNA", "RANA", "AGO", "ORA"], bonus: ["ANO", "ARA"] },
    { id: 1014, letters: ["S", "C", "E", "N", "A"], words: ["SCENA", "NASCE", "CANE", "CASE", "CENA", "ESCA", "SANE", "ASCE"], bonus: ["SAN"] },
    { id: 1015, letters: ["T", "R", "E", "N", "O"], words: ["TRENO", "ENTRO", "TERNO", "NERO", "NOTE", "OTRE", "ORE", "TRE"], bonus: ["NEO", "REO"] },
    { id: 1016, letters: ["F", "E", "S", "T", "A"], words: ["FESTA", "FASE", "FATE", "SETA", "TESA", "EST", "STA"], bonus: ["FESA"] },
    { id: 1017, letters: ["L", "E", "N", "T", "A"], words: ["LENTA", "ALTE", "ANTE", "LANE", "NATE", "TALE", "TANE", "TELA"], bonus: ["ALE"] },
    { id: 1018, letters: ["M", "A", "D", "R", "E"], words: ["MADRE", "DAME", "DARE", "MARE", "RADE", "RAME", "REMA", "ERA"], bonus: ["DEA", "REA"] },
    { id: 1019, letters: ["P", "A", "D", "R", "E"], words: ["PADRE", "PREDA", "APRE", "DARE", "PARE", "PERA", "RADE", "RAPE"], bonus: ["ARPE", "APE", "PER"] },
    { id: 1020, letters: ["V", "I", "O", "L", "A"], words: ["VIOLA", "OLIVA", "OVALI", "VOLAI", "LAVI", "LAVO", "VOLA", "VOLI"], bonus: ["OLIA", "ALI", "VIA", "VOI"] },
    { id: 1021, letters: ["C", "U", "O", "R", "E"], words: ["CUORE", "CERO", "CREO", "CURE", "CURO", "RECO", "ECO", "ORE"], bonus: ["REO"] },
    { id: 1022, letters: ["P", "E", "R", "L", "A"], words: ["PERLA", "APRE", "ARPE", "PALE", "PARE", "PELA", "PERA", "RAPE"], bonus: ["APE", "PER"] },
    { id: 1023, letters: ["B", "O", "R", "S", "A"], words: ["BORSA", "BARO", "BASO", "ORSA", "RASO", "ROSA", "BAR", "ORA"], bonus: ["ARO", "OSA"] },
    { id: 1024, letters: ["C", "I", "E", "L", "O"], words: ["CIELO", "LICEO", "CELI", "CELO", "COLI", "ECO", "LEI"], bonus: ["OLI"] },
    { id: 1025, letters: ["D", "O", "L", "C", "E"], words: ["DOLCE", "CELO", "CODE", "LEDO", "LODE", "ECO", "ODE"], bonus: ["DEL"] },
    { id: 1026, letters: ["F", "R", "A", "S", "E"], words: ["FRASE", "SFERA", "FARE", "FASE", "RASE", "RESA", "SERA", "ERA"], bonus: ["FESA", "FRA"] },
    { id: 1027, letters: ["M", "E", "T", "R", "O"], words: ["METRO", "MORTE", "TREMO", "MORE", "ORME", "OTRE", "REMO", "TRE"], bonus: ["ORE", "REO"] },
    { id: 1028, letters: ["N", "O", "R", "M", "A"], words: ["NORMA", "ARMO", "MANO", "MORA", "ORMA", "ORNA", "RAMO", "ROMA"], bonus: ["AMO", "ANO", "ORA"] },
    { id: 1029, letters: ["R", "I", "T", "M", "O"], words: ["RITMO", "MORTI", "MIRO", "MITO", "MORI", "ORTI", "RITO", "TIRO"], bonus: ["OTRI", "TORI", "MIO"] },
    { id: 1030, letters: ["S", "C", "A", "L", "O"], words: ["SCALO", "LOSCA", "SOLCA", "CALO", "CASO", "COLA", "COSA", "SOLA"], bonus: ["CAOS", "SALO", "OCA"] }
];

document.addEventListener('DOMContentLoaded', async () => {

    /* ---------------------------------------------------------------------- */
    /*  01. SOURCE PROTECTION & ANTI-CLONE GUARD                              */
    /* ---------------------------------------------------------------------- */
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        const key = (e.key || '').toLowerCase();
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
            (e.ctrlKey && ['u', 's'].includes(key))
        ) {
            e.preventDefault();
            return false;
        }
    });

    /* ---------------------------------------------------------------------- */
    /*  02. STATE & DOM REFERENCES                                            */
    /* ---------------------------------------------------------------------- */
    const GAME_TIME_SECONDS = 180;
    const MAX_HINTS = 3;
    const todayStr = new Date().toISOString().split('T')[0];

    let puzzleDB = [...FALLBACK_PUZZLES];
    let currentPuzzle = null;
    let levelLetters = [];
    let targetWords = [];
    let bonusWordsPool = [];
    let starThresholds = [];

    let foundWords = [];
    let foundBonusWords = [];
    let hintsLeft = MAX_HINTS;
    let timeLeft = GAME_TIME_SECONDS;
    let timerInterval = null;
    let isPracticeMode = false;

    let isDragging = false;
    let currentWord = '';
    let selectedNodes = [];
    let pointerX = 0;
    let pointerY = 0;
    let toastTimeout = null;

    const screens = {
        start: document.getElementById('start-screen'),
        game: document.getElementById('game-screen'),
        end: document.getElementById('end-screen')
    };

    const elements = {
        btnStart: document.getElementById('btn-start'),
        btnPlayRandom: document.getElementById('btn-play-random'),
        modeBadge: document.getElementById('mode-badge'),
        endLevelTag: document.getElementById('end-level-tag'),
        startTotal: document.getElementById('start-total'),
        levelIdDisplay: document.getElementById('level-id-display'),
        timerBadge: document.getElementById('timer-badge'),
        timerDisplay: document.getElementById('timer-display'),
        progressBar: document.getElementById('progress-bar'),
        wordsFoundTxt: document.getElementById('words-found'),
        wordsTotalTxt: document.getElementById('words-total'),
        wordsGrid: document.getElementById('words-grid'),
        wordDisplay: document.getElementById('word-display'),
        toastPill: document.getElementById('toast-pill'),
        board: document.getElementById('board'),
        boardArea: document.getElementById('board-area') || document.querySelector('.board-area'),
        btnShuffle: document.getElementById('btn-shuffle'),
        btnHint: document.getElementById('btn-hint'),
        hintCount: document.getElementById('hint-count'),
        bonusCount: document.getElementById('bonus-count'),
        stars: [
            document.getElementById('star-1'),
            document.getElementById('star-2'),
            document.getElementById('star-3')
        ]
    };

    /* ---------------------------------------------------------------------- */
    /*  03. RESILIENT LEVEL LOADER (JSON + INSTANT FALLBACK)                  */
    /* ---------------------------------------------------------------------- */
    const setupPuzzleData = (puzzle) => {
        currentPuzzle = puzzle;
        levelLetters = [...puzzle.letters];
        targetWords = [...new Set(puzzle.words.map((w) => w.trim().toUpperCase()))];
        bonusWordsPool = [...new Set((puzzle.bonus || []).map((w) => w.trim().toUpperCase()))];

        const total = targetWords.length;
        starThresholds = [
            Math.max(1, Math.ceil(total * 0.35)),
            Math.max(2, Math.ceil(total * 0.7)),
            total
        ];

        if (elements.levelIdDisplay) elements.levelIdDisplay.textContent = puzzle.id;
        if (elements.startTotal) elements.startTotal.textContent = total;
        if (elements.wordsTotalTxt) elements.wordsTotalTxt.textContent = total;
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('puzzles.json?v=3', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const loaded = await response.json();
            if (Array.isArray(loaded) && loaded.length > 0 && loaded[0].words) {
                // Use external JSON only if it has clean levels (<= 10 target words)
                const cleanLevels = loaded.filter((p) => Array.isArray(p.words) && p.words.length <= 10);
                if (cleanLevels.length > 0) puzzleDB = cleanLevels;
            }
        }
    } catch (_) {
        // Silently use FALLBACK_PUZZLES if fetch fails or times out
    }

    const savedDate = localStorage.getItem('ws_date');
    let savedPuzzleId = localStorage.getItem('ws_puzzle_id');
    let savedStatus = localStorage.getItem('ws_status');

    if (savedDate !== todayStr || !savedPuzzleId) {
        const randomIndex = Math.floor(Math.random() * puzzleDB.length);
        savedPuzzleId = puzzleDB[randomIndex].id;
        savedStatus = 'ready';

        localStorage.setItem('ws_date', todayStr);
        localStorage.setItem('ws_puzzle_id', savedPuzzleId);
        localStorage.setItem('ws_status', 'ready');
        localStorage.removeItem('ws_found_words');
    }

    const todayPuzzle = puzzleDB.find((p) => p.id == savedPuzzleId) || puzzleDB[0];
    setupPuzzleData(todayPuzzle);

    if (savedStatus === 'completed') {
        const savedWords = JSON.parse(localStorage.getItem('ws_found_words') || '[]');
        const savedStars = parseInt(localStorage.getItem('ws_stars') || '0', 10);
        foundWords = savedWords;
        screens.start.classList.remove('active');
        showEndScreen(foundWords.length === targetWords.length, foundWords.length, savedStars);
    } else {
        elements.btnStart.textContent = 'Gioca Ora';
        elements.btnStart.disabled = false;
        elements.btnStart.addEventListener('click', () => startGame(false));
    }

    /* ---------------------------------------------------------------------- */
    /*  04. GAME LOOP & TIMER                                                 */
    /* ---------------------------------------------------------------------- */
    function showToast(msg, isBonus = false) {
        if (!elements.toastPill) return;
        clearTimeout(toastTimeout);
        elements.toastPill.textContent = msg;
        elements.toastPill.className = `toast-pill show${isBonus ? ' bonus' : ''}`;
        toastTimeout = setTimeout(() => {
            elements.toastPill.classList.remove('show');
        }, 1600);
    }

    function updateTimerUI() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        elements.timerDisplay.textContent = `${m}:${s}`;
        elements.timerBadge?.classList.toggle('warning', timeLeft <= 15);
    }

    function startGame(practice = false) {
        isPracticeMode = practice;
        foundWords = [];
        foundBonusWords = [];
        hintsLeft = MAX_HINTS;
        timeLeft = GAME_TIME_SECONDS;

        elements.wordsFoundTxt.textContent = '0';
        elements.progressBar.style.width = '0%';
        if (elements.bonusCount) elements.bonusCount.textContent = '0';
        if (elements.hintCount) elements.hintCount.textContent = String(hintsLeft);
        if (elements.btnHint) elements.btnHint.disabled = false;
        elements.stars.forEach((s) => s?.classList.remove('filled'));
        updateTimerUI();

        screens.start.classList.remove('active');
        screens.end.classList.remove('active');
        screens.game.classList.add('active');

        buildWordSlots();
        renderBoard();

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerUI();
            if (timeLeft <= 0) handleGameOver(false);
        }, 1000);
    }

    function handleGameOver(isWin) {
        clearInterval(timerInterval);

        let starsWon = 0;
        for (let i = 0; i < 3; i++) {
            if (foundWords.length >= starThresholds[i]) starsWon++;
        }

        if (!isPracticeMode) {
            localStorage.setItem('ws_status', 'completed');
            localStorage.setItem('ws_found_words', JSON.stringify(foundWords));
            localStorage.setItem('ws_stars', String(starsWon));
        }

        screens.game.classList.remove('active');
        showEndScreen(isWin, foundWords.length, starsWon);
    }

    /* ---------------------------------------------------------------------- */
    /*  05. SLOTS, HINTS & END SCREEN                                         */
    /* ---------------------------------------------------------------------- */
    function buildWordSlots() {
        elements.wordsGrid.innerHTML = '';
        const sorted = [...targetWords].sort((a, b) => a.length - b.length || a.localeCompare(b));

        sorted.forEach((word) => {
            const slot = document.createElement('div');
            slot.className = 'word-slot';
            slot.id = `slot-${word}`;

            for (let i = 0; i < word.length; i++) {
                const box = document.createElement('div');
                box.className = 'letter-box';
                box.textContent = word[i];
                slot.appendChild(box);
            }
            elements.wordsGrid.appendChild(slot);
        });
    }

    elements.btnHint?.addEventListener('click', () => {
        if (hintsLeft <= 0) return;
        const remainingWords = targetWords.filter((w) => !foundWords.includes(w));
        if (remainingWords.length === 0) return;

        const targetWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        const slot = document.getElementById(`slot-${targetWord}`);
        if (!slot) return;

        const hiddenBoxes = [...slot.querySelectorAll('.letter-box:not(.hinted)')];
        if (hiddenBoxes.length === 0) return;

        const randomBox = hiddenBoxes[Math.floor(Math.random() * hiddenBoxes.length)];
        randomBox.classList.add('hinted');

        hintsLeft--;
        if (elements.hintCount) elements.hintCount.textContent = String(hintsLeft);
        if (hintsLeft <= 0) elements.btnHint.disabled = true;

        if (slot.querySelectorAll('.letter-box:not(.hinted)').length === 0) {
            registerFoundWord(targetWord);
        }
    });

    function showEndScreen(isWin, wordsCount, starsCount) {
        screens.end.classList.add('active');
        if (elements.endLevelTag) {
            elements.endLevelTag.textContent = isPracticeMode
                ? `MODALITÀ EXTRA • #${currentPuzzle.id}`
                : `SFIDA GIORNALIERA • #${currentPuzzle.id}`;
        }

        document.getElementById('end-title').textContent = isWin ? 'Livello Completato!' : 'Tempo Scaduto!';
        const bonusTxt = foundBonusWords.length > 0 ? ` (+${foundBonusWords.length} bonus)` : '';
        document.getElementById('end-subtitle').textContent =
            `Hai trovato ${wordsCount} parole su ${targetWords.length}${bonusTxt}.`;

        const finalStarsContainer = document.getElementById('final-stars');
        finalStarsContainer.innerHTML = '';

        for (let i = 0; i < 3; i++) {
            const starIcon = document.createElement('i');
            starIcon.className = 'fa-solid fa-star candy-star';
            finalStarsContainer.appendChild(starIcon);

            setTimeout(() => {
                starIcon.classList.add(i < starsCount ? 'animate-win' : 'animate-lose');
            }, 220 + i * 320);
        }

        const wordsResultContainer = document.getElementById('final-words-list');
        if (wordsResultContainer) {
            wordsResultContainer.innerHTML = '';
            const sortedFinalWords = [...targetWords].sort((a, b) => b.length - a.length);
            sortedFinalWords.forEach((word) => {
                const wordEl = document.createElement('div');
                const isFound = foundWords.includes(word);
                wordEl.className = `final-word-item ${isFound ? 'word-found' : 'word-missed'}`;
                wordEl.innerHTML = isFound
                    ? `<span>${word}</span> <i class="fa-solid fa-check" style="color: #10b981;"></i>`
                    : `<span>${word}</span> <i class="fa-solid fa-xmark" style="color: #ef4444;"></i>`;
                wordsResultContainer.appendChild(wordEl);
            });
        }
    }

    elements.btnPlayRandom?.addEventListener('click', () => {
        if (!puzzleDB.length) return;
        const otherPuzzles = puzzleDB.filter((p) => p.id !== currentPuzzle?.id);
        const pool = otherPuzzles.length ? otherPuzzles : puzzleDB;
        const nextPuzzle = pool[Math.floor(Math.random() * pool.length)];
        setupPuzzleData(nextPuzzle);
        startGame(true);
    });

    /* ---------------------------------------------------------------------- */
    /*  06. WHEEL RENDERING & CANVAS TRAIL                                    */
    /* ---------------------------------------------------------------------- */
    let canvas;
    let ctx;

    function resizeCanvas() {
        if (!canvas) return;
        const rect = elements.board.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        if (!isDragging) drawLines();
    });

    function renderBoard() {
        document.querySelectorAll('.letter-node').forEach((e) => e.remove());
        canvas = document.getElementById('swipe-canvas');
        ctx = canvas.getContext('2d');

        levelLetters.forEach((letter, idx) => {
            const node = document.createElement('div');
            node.className = 'letter-node';
            node.textContent = letter;
            node.dataset.letter = letter;
            node.dataset.index = String(idx);
            elements.board.appendChild(node);
        });

        positionLetters();
        resizeCanvas();
    }

    function positionLetters() {
        const nodes = document.querySelectorAll('.letter-node');
        nodes.forEach((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + 35 * Math.cos(angle);
            const y = 50 + 35 * Math.sin(angle);
            node.style.left = `${x}%`;
            node.style.top = `${y}%`;
        });
    }

    elements.btnShuffle?.addEventListener('click', () => {
        for (let i = levelLetters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [levelLetters[i], levelLetters[j]] = [levelLetters[j], levelLetters[i]];
        }
        renderBoard();
        if (navigator.vibrate) navigator.vibrate(18);
    });

    /* ---------------------------------------------------------------------- */
    /*  07. GEOMETRIC SWIPE DETECTION, BACKTRACKING & KEYBOARD                */
    /* ---------------------------------------------------------------------- */
    function getCenterCoords(node) {
        const nodeRect = node.getBoundingClientRect();
        const boardRect = elements.board.getBoundingClientRect();
        return {
            x: nodeRect.left - boardRect.left + nodeRect.width / 2,
            y: nodeRect.top - boardRect.top + nodeRect.height / 2
        };
    }

    function drawLines() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (selectedNodes.length === 0) return;

        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        const startPos = getCenterCoords(selectedNodes[0]);
        ctx.moveTo(startPos.x, startPos.y);

        for (let i = 1; i < selectedNodes.length; i++) {
            const pos = getCenterCoords(selectedNodes[i]);
            ctx.lineTo(pos.x, pos.y);
        }

        if (isDragging) {
            const boardRect = elements.board.getBoundingClientRect();
            ctx.lineTo(pointerX - boardRect.left, pointerY - boardRect.top);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function checkIntersection(clientX, clientY) {
        const nodes = document.querySelectorAll('.letter-node');
        for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dist = Math.hypot(clientX - centerX, clientY - centerY);

            if (dist <= rect.width * 0.48) {
                if (
                    selectedNodes.length >= 2 &&
                    selectedNodes[selectedNodes.length - 2] === node
                ) {
                    const popped = selectedNodes.pop();
                    popped.classList.remove('selected');
                    currentWord = selectedNodes.map((n) => n.dataset.letter).join('');
                    elements.wordDisplay.textContent = currentWord;
                    drawLines();
                    return;
                }

                if (!selectedNodes.includes(node)) {
                    selectedNodes.push(node);
                    node.classList.add('selected');
                    currentWord += node.dataset.letter;
                    elements.wordDisplay.textContent = currentWord;
                    if (navigator.vibrate) navigator.vibrate(12);
                    drawLines();
                }
                break;
            }
        }
    }

    elements.boardArea?.addEventListener('touchstart', (e) => {
        if (!e.target.closest('button')) e.preventDefault();
    }, { passive: false });

    elements.boardArea?.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        pointerX = e.clientX;
        pointerY = e.clientY;
        checkIntersection(pointerX, pointerY);
    });

    elements.boardArea?.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        pointerX = e.clientX;
        pointerY = e.clientY;
        checkIntersection(pointerX, pointerY);
        drawLines();
    });

    window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        drawLines();
        validateWord();
        resetSelection();
    });

    /* ---------------------------------------------------------------------- */
    /*  08. WORD VALIDATION & SCORING                                         */
    /* ---------------------------------------------------------------------- */
    function triggerShake() {
        elements.wordDisplay.classList.remove('shake');
        void elements.wordDisplay.offsetWidth;
        elements.wordDisplay.classList.add('shake');
    }

    function registerFoundWord(word) {
        if (foundWords.includes(word)) return;
        foundWords.push(word);

        const slot = document.getElementById(`slot-${word}`);
        if (slot) slot.classList.add('found');

        elements.wordsFoundTxt.textContent = String(foundWords.length);
        const progressPercentage = (foundWords.length / targetWords.length) * 100;
        elements.progressBar.style.width = `${progressPercentage}%`;

        for (let i = 0; i < 3; i++) {
            if (foundWords.length >= starThresholds[i]) {
                elements.stars[i]?.classList.add('filled');
            }
        }

        if (foundWords.length === targetWords.length) {
            setTimeout(() => handleGameOver(true), 650);
        }
    }

    function validateWord() {
        if (currentWord.length < 3) return;

        if (foundWords.includes(currentWord)) {
            showToast('Parola già trovata!');
            triggerShake();
            return;
        }

        if (targetWords.includes(currentWord)) {
            registerFoundWord(currentWord);
            return;
        }

        if (bonusWordsPool.includes(currentWord)) {
            if (foundBonusWords.includes(currentWord)) {
                showToast('Bonus già riscosso!');
                triggerShake();
                return;
            }
            foundBonusWords.push(currentWord);
            timeLeft += 5;
            updateTimerUI();
            if (elements.bonusCount) elements.bonusCount.textContent = String(foundBonusWords.length);
            showToast('✨ Parola Bonus! +5s', true);
            return;
        }

        triggerShake();
    }

    function resetSelection() {
        selectedNodes.forEach((n) => n.classList.remove('selected'));
        selectedNodes = [];
        drawLines();
        setTimeout(() => {
            if (!isDragging) {
                currentWord = '';
                elements.wordDisplay.textContent = '';
            }
        }, 180);
    }
});