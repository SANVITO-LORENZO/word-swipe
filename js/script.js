document.addEventListener('DOMContentLoaded', async () => {
    
    // ==========================================
    // 1. VARIABILI GLOBALI E SETTINGS
    // ==========================================
    let levelLetters = [];
    let targetWords = [];
    let STAR_THRESHOLDS = [];
    const GAME_TIME_SECONDS = 180; // 3 minuti esatti
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    const screens = { start: document.getElementById('start-screen'), game: document.getElementById('game-screen'), end: document.getElementById('end-screen') };
    const elements = {
        btnStart: document.getElementById('btn-start'),
        startTotal: document.getElementById('start-total'),
        levelIdDisplay: document.getElementById('level-id-display'),
        timerDisplay: document.getElementById('timer-display'),
        progressBar: document.getElementById('progress-bar'),
        wordsFoundTxt: document.getElementById('words-found'),
        wordsTotalTxt: document.getElementById('words-total'),
        wordsGrid: document.getElementById('words-grid'),
        wordDisplay: document.getElementById('word-display'),
        board: document.getElementById('board'),
        stars: [document.getElementById('star-1'), document.getElementById('star-2'), document.getElementById('star-3')],
        boardArea: document.querySelector('.board-area'),
        btnShuffle: document.getElementById('btn-shuffle')
    };

    // ==========================================
    // 2. ESTRAZIONE CASUALE DAL DATABASE JSON
    // ==========================================
    try {
        const response = await fetch('puzzles.json');
        const puzzleDB = await response.json(); // Array di centinaia di oggetti
        
        // Controllo Anti-Cheat: Legge i dati salvati per la giornata di oggi
        let savedDate = localStorage.getItem('ws_date');
        let savedPuzzleId = localStorage.getItem('ws_puzzle_id');
        let savedStatus = localStorage.getItem('ws_status'); // 'ready' o 'completed'

        // Se è un giorno nuovo, estrai un ID a caso dal database e salvalo!
        if (savedDate !== todayStr) {
            localStorage.setItem('ws_date', todayStr);
            localStorage.setItem('ws_status', 'ready');
            
            // Estrazione randomica
            const randomIndex = Math.floor(Math.random() * puzzleDB.length);
            savedPuzzleId = puzzleDB[randomIndex].id;
            localStorage.setItem('ws_puzzle_id', savedPuzzleId);
            
            savedStatus = 'ready';
        }

        // Trova il puzzle corrispondente all'ID salvato (o prendi il primo di default se c'è un errore)
        const todayPuzzle = puzzleDB.find(p => p.id == savedPuzzleId) || puzzleDB[0];
        
        levelLetters = todayPuzzle.letters;
        targetWords = todayPuzzle.words;
        
        const totalW = targetWords.length;
        STAR_THRESHOLDS = [Math.ceil(totalW * 0.3), Math.ceil(totalW * 0.6), totalW];

        elements.levelIdDisplay.innerText = todayPuzzle.id;

        // Se l'ha già completato oggi, mostragli subito il risultato
        if (savedStatus === 'completed') {
            const savedFoundCount = parseInt(localStorage.getItem('ws_found_count') || 0);
            const savedStars = parseInt(localStorage.getItem('ws_stars') || 0);
            screens.start.classList.remove('active');
            showEndScreen(savedFoundCount === targetWords.length, savedFoundCount, savedStars);
        } else {
            // Altrimenti abilita il gioco
            elements.startTotal.innerText = targetWords.length;
            elements.wordsTotalTxt.innerText = targetWords.length;
            elements.btnStart.innerText = "Gioca Ora";
            elements.btnStart.disabled = false;
            elements.btnStart.addEventListener('click', startGame);
        }

    } catch (error) {
        console.error("Errore nel caricamento del DB JSON:", error);
        elements.btnStart.innerText = "Errore DB";
    }

    // ==========================================
    // 3. STATO E TIMER DEL GIOCO
    // ==========================================
    let foundWords = [];
    let timeLeft = GAME_TIME_SECONDS;
    let timerInterval = null;
    let isDragging = false;
    let currentWord = "";
    let selectedNodes = [];
    let pointerX = 0, pointerY = 0;

    function startGame() {
        screens.start.classList.remove('active');
        screens.game.classList.add('active');
        
        buildWordSlots();
        renderBoard();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        elements.timerDisplay.innerText = `${m}:${s}`;

        if (timeLeft <= 10) elements.timerDisplay.classList.add('warning');

        if (timeLeft <= 0) {
            handleGameOver(false);
        }
    }

    function handleGameOver(isWin) {
        clearInterval(timerInterval);
        
        let starsWon = 0;
        for (let i = 0; i < 3; i++) {
            if (foundWords.length >= STAR_THRESHOLDS[i]) starsWon++;
        }

        // Blocca il giocatore per oggi salvando lo status "completed"
        localStorage.setItem('ws_status', 'completed');
        localStorage.setItem('ws_found_count', foundWords.length);
        localStorage.setItem('ws_stars', starsWon);

        screens.game.classList.remove('active');
        showEndScreen(isWin, foundWords.length, starsWon);
    }

    // ==========================================
    // 4. ANIMAZIONE END SCREEN E SLOT
    // ==========================================
    function showEndScreen(isWin, wordsCount, starsCount) {
        screens.end.classList.add('active');
        document.getElementById('end-title').innerText = isWin ? "Completato!" : "Tempo Scaduto!";
        document.getElementById('end-subtitle').innerText = `Hai trovato ${wordsCount} parole su ${targetWords.length}.`;

        const finalStarsContainer = document.getElementById('final-stars');
        finalStarsContainer.innerHTML = ''; 

        for (let i = 0; i < 3; i++) {
            const starIcon = document.createElement('i');
            starIcon.className = `fa-solid fa-star candy-star`;
            finalStarsContainer.appendChild(starIcon);
            
            setTimeout(() => {
                if (i < starsCount) starIcon.classList.add('animate-win');
                else starIcon.classList.add('animate-lose');
            }, 300 + (i * 400)); 
        }

        // === INIZIO NUOVA LOGICA: LISTA PAROLE FINALI ===
        const wordsResultContainer = document.getElementById('final-words-list');
        if (wordsResultContainer) {
            wordsResultContainer.innerHTML = ''; // Svuotiamo eventuali duplicati
            
            // Ordiniamo le parole dalla più lunga alla più corta (opzionale, per stile)
            const sortedFinalWords = [...targetWords].sort((a, b) => b.length - a.length);

            sortedFinalWords.forEach(word => {
                const wordEl = document.createElement('div');
                wordEl.className = 'final-word-item';

                if (foundWords.includes(word)) {
                    // Parola trovata: Spunta verde
                    wordEl.innerHTML = `<span>${word}</span> <i class="fa-solid fa-check" style="color: #10b981;"></i>`;
                    wordEl.classList.add('word-found');
                } else {
                    // Parola mancata: X rossa
                    wordEl.innerHTML = `<span>${word}</span> <i class="fa-solid fa-xmark" style="color: #ef4444;"></i>`;
                    wordEl.classList.add('word-missed');
                }

                wordsResultContainer.appendChild(wordEl);
            });
        }
        // === FINE NUOVA LOGICA ===
    }

    function buildWordSlots() {
        elements.wordsGrid.innerHTML = '';
        const sortedWords = [...targetWords].sort((a, b) => a.length - b.length);
        
        sortedWords.forEach(word => {
            const slot = document.createElement('div');
            slot.classList.add('word-slot');
            slot.id = `slot-${word}`;

            for (let i = 0; i < word.length; i++) {
                const box = document.createElement('div');
                box.classList.add('letter-box');
                box.innerText = word[i];
                slot.appendChild(box);
            }
            elements.wordsGrid.appendChild(slot);
        });
    }

    // ==========================================
    // 5. BOARD E PULSANTE SHUFFLE
    // ==========================================
    let canvas, ctx;
    
    function resizeCanvas() {
        if(!canvas) return;
        const rect = elements.board.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    window.addEventListener('resize', () => { resizeCanvas(); if(!isDragging) drawLines(); });

    function renderBoard() {
        document.querySelectorAll('.letter-node').forEach(e => e.remove());
        
        if (!document.getElementById('swipe-canvas')) {
            elements.board.innerHTML += '<canvas id="swipe-canvas"></canvas>';
        }
        canvas = document.getElementById('swipe-canvas');
        ctx = canvas.getContext('2d');
        
        levelLetters.forEach((letter) => {
            const node = document.createElement('div');
            node.classList.add('letter-node');
            node.innerText = letter;
            node.dataset.letter = letter;
            elements.board.appendChild(node);
        });
        
        positionLetters();
        resizeCanvas();
    }

    function positionLetters() {
        const nodes = document.querySelectorAll('.letter-node');
        nodes.forEach((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2 - (Math.PI / 2);
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
        if (navigator.vibrate) navigator.vibrate(20); 
    });

    // ==========================================
    // 6. GESTIONE SWIPE
    // ==========================================
    function getCenterCoords(node) {
        const nodeRect = node.getBoundingClientRect();
        const boardRect = elements.board.getBoundingClientRect();
        return { x: (nodeRect.left - boardRect.left) + nodeRect.width / 2, y: (nodeRect.top - boardRect.top) + nodeRect.height / 2 };
    }

    function drawLines() {
        if(!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (selectedNodes.length === 0) return;

        ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; 

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
    }

    elements.boardArea.addEventListener('touchstart', (e) => {
        if(e.target !== elements.btnShuffle && e.target.parentNode !== elements.btnShuffle) {
            e.preventDefault();
        }
    }, { passive: false });

    elements.boardArea.addEventListener('pointerdown', (e) => {
        if(e.target === elements.btnShuffle || e.target.parentNode === elements.btnShuffle) return;
        isDragging = true;
        pointerX = e.clientX; pointerY = e.clientY;
        checkIntersection(pointerX, pointerY);
    });

    elements.boardArea.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        pointerX = e.clientX; pointerY = e.clientY;
        checkIntersection(pointerX, pointerY);
        drawLines();
    });

    window.addEventListener('pointerup', () => {
        if (isDragging) {
            isDragging = false;
            drawLines();
            validateWord();
            resetSelection();
        }
    });

    function checkIntersection(x, y) {
        const el = document.elementFromPoint(x, y);
        if (el && el.classList.contains('letter-node') && !selectedNodes.includes(el)) {
            selectedNodes.push(el);
            el.classList.add('selected');
            currentWord += el.dataset.letter;
            elements.wordDisplay.innerText = currentWord;
            if (navigator.vibrate) navigator.vibrate(15);
            drawLines();
        }
    }

    // ==========================================
    // 7. VALIDAZIONE LOGICA E PUNTEGGIO
    // ==========================================
    function validateWord() {
        if (currentWord.length < 3) return;

        if (foundWords.includes(currentWord) || !targetWords.includes(currentWord)) {
            elements.wordDisplay.classList.remove('shake');
            void elements.wordDisplay.offsetWidth;
            elements.wordDisplay.classList.add('shake');
            return;
        }

        foundWords.push(currentWord);
        
        const slot = document.getElementById(`slot-${currentWord}`);
        if(slot) slot.classList.add('found');

        elements.wordsFoundTxt.innerText = foundWords.length;
        const progressPercentage = (foundWords.length / targetWords.length) * 100;
        elements.progressBar.style.width = `${progressPercentage}%`;

        for (let i = 0; i < 3; i++) {
            if (foundWords.length >= STAR_THRESHOLDS[i]) {
                elements.stars[i].classList.add('filled');
            }
        }

        if (foundWords.length === targetWords.length) {
            setTimeout(() => handleGameOver(true), 800); 
        }
    }

    function resetSelection() {
        selectedNodes.forEach(n => n.classList.remove('selected'));
        selectedNodes = [];
        drawLines();
        setTimeout(() => {
            if (!isDragging) { currentWord = ""; elements.wordDisplay.innerText = ""; }
        }, 200);
    }
});