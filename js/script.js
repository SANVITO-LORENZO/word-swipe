/* ==========================================================================
   WORD SWIPE — DAILY PUZZLE ENGINE
   Author: Lorenzo Sanvito (https://github.com/SANVITO-LORENZO)
   Notice: Proprietary source code. Unauthorized reproduction is prohibited.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {

    /* ---------------------------------------------------------------------- */
    /*  01. SOURCE PROTECTION & ANTI-CLONE GUARD                              */
    /* ---------------------------------------------------------------------- */
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
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

    let puzzleDB = [];
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
        boardArea: document.getElementById('board-area'),
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
    /*  03. LEVEL LOADER & DAILY PERSISTENCE                                  */
    /* ---------------------------------------------------------------------- */
    const setupPuzzleData = (puzzle) => {
        currentPuzzle = puzzle;
        levelLetters = [...puzzle.letters];
        // Deduplicate and sanitize target words
        targetWords = [...new Set(puzzle.words.map((w) => w.trim().toUpperCase()))];
        bonusWordsPool = [...new Set((puzzle.bonus || []).map((w) => w.trim().toUpperCase()))];

        const total = targetWords.length;
        starThresholds = [
            Math.max(1, Math.ceil(total * 0.35)),
            Math.max(2, Math.ceil(total * 0.7)),
            total
        ];

        elements.levelIdDisplay.textContent = puzzle.id;
        elements.startTotal.textContent = total;
        elements.wordsTotalTxt.textContent = total;
    };

    try {
        const response = await fetch('puzzles.json');
        puzzleDB = await response.json();

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
            localStorage.removeItem('ws_bonus_count');
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
    } catch (err) {
        console.error('Failed to load puzzles.json:', err);
        elements.btnStart.textContent = 'Errore DB';
    }

    /* ---------------------------------------------------------------------- */
    /*  04. GAME LOOP & TIMER                                                 */
    /* ---------------------------------------------------------------------- */
    function showToast(msg, isBonus = false) {
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
        elements.timerBadge.classList.toggle('warning', timeLeft <= 15);
    }

    function startGame(practice = false) {
        isPracticeMode = practice;
        foundWords = [];
        foundBonusWords = [];
        hintsLeft = MAX_HINTS;
        timeLeft = GAME_TIME_SECONDS;

        elements.wordsFoundTxt.textContent = '0';
        elements.progressBar.style.width = '0%';
        elements.bonusCount.textContent = '0';
        elements.hintCount.textContent = String(hintsLeft);
        elements.btnHint.disabled = false;
        elements.stars.forEach((s) => s.classList.remove('filled'));
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

    // Hint system: reveals a single unrevealed letter box
    elements.btnHint.addEventListener('click', () => {
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
        elements.hintCount.textContent = String(hintsLeft);
        if (hintsLeft <= 0) elements.btnHint.disabled = true;

        // Auto-complete word if all letters in that slot were revealed via hints
        if (slot.querySelectorAll('.letter-box:not(.hinted)').length === 0) {
            registerFoundWord(targetWord);
        }
    });

    function showEndScreen(isWin, wordsCount, starsCount) {
        screens.end.classList.add('active');
        elements.endLevelTag.textContent = isPracticeMode
            ? `MODALITÀ EXTRA • #${currentPuzzle.id}`
            : `SFIDA GIORNALIERA • #${currentPuzzle.id}`;

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

    // Play another random level in Practice Mode
    elements.btnPlayRandom.addEventListener('click', () => {
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

    elements.btnShuffle.addEventListener('click', () => {
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
                // Backtrack: if user drags back to the second-to-last node, undo the last node
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

    elements.boardArea.addEventListener('touchstart', (e) => {
        if (!e.target.closest('button')) e.preventDefault();
    }, { passive: false });

    elements.boardArea.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        pointerX = e.clientX;
        pointerY = e.clientY;
        checkIntersection(pointerX, pointerY);
    });

    elements.boardArea.addEventListener('pointermove', (e) => {
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

    // Desktop keyboard support for accessibility & speed
    window.addEventListener('keydown', (e) => {
        if (!screens.game.classList.contains('active')) return;
        const key = e.key.toUpperCase();

        if (e.key === 'Backspace') {
            const popped = selectedNodes.pop();
            if (popped) popped.classList.remove('selected');
            currentWord = selectedNodes.map((n) => n.dataset.letter).join('');
            elements.wordDisplay.textContent = currentWord;
            drawLines();
        } else if (e.key === 'Enter') {
            validateWord();
            resetSelection();
        } else if (e.key === ' ') {
            e.preventDefault();
            elements.btnShuffle.click();
        } else if (/^[A-Z]$/.test(key)) {
            const availableNode = [...document.querySelectorAll('.letter-node')].find(
                (n) => n.dataset.letter === key && !selectedNodes.includes(n)
            );
            if (availableNode) {
                selectedNodes.push(availableNode);
                availableNode.classList.add('selected');
                currentWord += key;
                elements.wordDisplay.textContent = currentWord;
                drawLines();
            }
        }
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
                elements.stars[i].classList.add('filled');
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
            elements.bonusCount.textContent = String(foundBonusWords.length);
            showToast(`✨ Parola Bonus! +5s`, true);
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