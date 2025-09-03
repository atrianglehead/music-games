const INTERVAL_SETS = {
    easy: [0, 5, 7, 12],
    medium: [0, 5, 7, 12, 2, 3, 4, 6],
    hard: Array.from({length:12},(_,i)=>i),
    expert: Array.from({length:12},(_,i)=>i)
};

const INTERVAL_NAMES = {
    0: 'Unison',
    1: 'm2',
    2: 'M2',
    3: 'm3',
    4: 'M3',
    5: 'P4',
    6: 'Tritone',
    7: 'P5',
    8: 'm6',
    9: 'M6',
    10: 'm7',
    11: 'M7',
    12: 'Octave'
};

const GRID_SIZES = {
    easy: [2,2],
    medium: [3,2],
    hard: [4,3],
    expert: [4,4]
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let timerInterval, startTime;

function setBoardSize(cols, rows){
    const gap = 10; // match CSS gap
    const header = document.querySelector('h1').offsetHeight;
    const controls = document.getElementById('controls').offsetHeight;
    const timer = document.getElementById('timer').offsetHeight;
    const availableWidth = window.innerWidth - 20; // small margin
    const availableHeight = window.innerHeight - header - controls - timer - 20;
    const tileSize = Math.min(
        (availableWidth - gap * (cols - 1)) / cols,
        (availableHeight - gap * (rows - 1)) / rows
    );
    const board = document.getElementById('game');
    board.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}px)`;
    board.style.gridAutoRows = `${tileSize}px`;
}

function midiToFreq(m){
    return 440 * Math.pow(2, (m-69)/12);
}

function randomRoot(){
    return 48 + Math.floor(Math.random()*25); // between C3 and C5
}

function playInterval(root, semitones, mode){
    const now = audioCtx.currentTime;
    const freq1 = midiToFreq(root);
    const freq2 = midiToFreq(root + semitones);

    const osc1 = audioCtx.createOscillator();
    osc1.frequency.value = freq1;
    osc1.type = 'sine';
    osc1.connect(audioCtx.destination);

    const osc2 = audioCtx.createOscillator();
    osc2.frequency.value = freq2;
    osc2.type = 'sine';
    osc2.connect(audioCtx.destination);

    if(mode === 'harmonic'){
        osc1.start(now); osc2.start(now);
        osc1.stop(now+1); osc2.stop(now+1);
    } else if(mode === 'melodic-asc'){
        osc1.start(now); osc1.stop(now+0.5);
        osc2.start(now+0.5); osc2.stop(now+1);
    } else { // melodic-desc
        osc2.start(now); osc2.stop(now+0.5);
        osc1.start(now+0.5); osc1.stop(now+1);
    }
}

function playFeedback(freq){
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now+0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now+0.4);
}

function generateTiles(diff){
    const [cols, rows] = GRID_SIZES[diff];
    const pairCount = (cols*rows)/2;
    const intervals = [...INTERVAL_SETS[diff]];
    const tiles = [];

    for(let i=0;i<pairCount;i++){
        const idx = Math.floor(Math.random()*intervals.length);
        const interval = intervals.splice(idx,1)[0];
        if(diff === 'expert'){
            tiles.push({interval, root: randomRoot()});
            tiles.push({interval, root: randomRoot()});
        } else {
            const root = randomRoot();
            tiles.push({interval, root});
            tiles.push({interval, root});
        }
    }
    // shuffle
    for(let i=tiles.length-1;i>0;i--){
        const j = Math.floor(Math.random()* (i+1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return {tiles, cols, rows};
}

function buildBoard(diff){
    const board = document.getElementById('game');
    board.innerHTML='';
    const {tiles, cols, rows} = generateTiles(diff);
    setBoardSize(cols, rows);
    tiles.forEach((t,i)=>{
        const div = document.createElement('div');
        div.className = 'tile';
        div.textContent = '\u266A';
        div.dataset.interval = t.interval;
        div.dataset.root = t.root;
        board.appendChild(div);
    });
}

function startTimer(){
    startTime = performance.now();
    const timeSpan = document.getElementById('time');
    timerInterval = setInterval(()=>{
        const diff = (performance.now()-startTime)/1000;
        timeSpan.textContent = diff.toFixed(1);
    },100);
    document.getElementById('timer').classList.remove('hidden');
}

function stopTimer(){
    clearInterval(timerInterval);
}

function initGame(){
    const practice = document.getElementById('practice-toggle').checked;
    const diff = document.getElementById('difficulty').value;
    const playback = document.getElementById('playback').value;
    const timed = document.getElementById('timed').checked;
    const board = document.getElementById('game');
    board.innerHTML='';
    board.classList.add('hidden');
    document.getElementById('timer').classList.add('hidden');

    if(practice){
        const intervals = INTERVAL_SETS[diff];
        const cols = Math.ceil(Math.sqrt(intervals.length));
        const rows = Math.ceil(intervals.length/cols);
        setBoardSize(cols, rows);
        intervals.forEach(interval => {
            const div = document.createElement('div');
            div.className = 'tile revealed';
            div.dataset.interval = interval;
            div.dataset.root = randomRoot();
            div.textContent = INTERVAL_NAMES[interval];
            board.appendChild(div);
            div.addEventListener('click', ()=>{
                playInterval(parseInt(div.dataset.root), parseInt(div.dataset.interval), playback);
            });
        });
        board.classList.remove('hidden');
    } else {
        buildBoard(diff);
        board.classList.remove('hidden');
        const tiles = Array.from(document.querySelectorAll('.tile'));
        let first=null, lock=false, matches=0;
        const totalPairs = tiles.length/2;

        tiles.forEach(tile=>{
            tile.addEventListener('click', ()=>{
                const root = parseInt(tile.dataset.root);
                const interval = parseInt(tile.dataset.interval);
                if(tile.classList.contains('revealed') || tile.classList.contains('matched')){
                    playInterval(root, interval, playback);
                    return;
                }
                if(lock) return;
                playInterval(root, interval, playback);
                tile.classList.add('revealed');
                tile.textContent='';
                if(!first){
                    first=tile;
                } else {
                    lock=true;
                    const match = (diff==='expert') ?
                        (first.dataset.interval === tile.dataset.interval) :
                        (first.dataset.interval === tile.dataset.interval && first.dataset.root === tile.dataset.root);
                    if(match){
                        first.classList.add('matched');
                        tile.classList.add('matched');
                        playFeedback(880); // chime
                        matches++;
                        if(matches===totalPairs){
                            if(timed) stopTimer();
                            alert('All pairs matched!');
                        }
                        first=null; lock=false;
                    } else {
                        first.classList.add('wrong');
                        tile.classList.add('wrong');
                        playFeedback(110); // thud
                        setTimeout(()=>{
                            first.classList.remove('revealed','wrong');
                            tile.classList.remove('revealed','wrong');
                            first.textContent='\u266A';
                            tile.textContent='\u266A';
                            first=null; lock=false;
                        },800);
                    }
                }
            });
        });
        if(timed) startTimer();
    }
    adjustBoard();
}

document.getElementById('start').addEventListener('click', initGame);

function adjustBoard(){
    const board = document.getElementById('game');
    if(board.classList.contains('hidden')) return;
    const diff = document.getElementById('difficulty').value;
    let cols, rows;
    if(document.getElementById('practice-toggle').checked){
        const intervals = INTERVAL_SETS[diff];
        cols = Math.ceil(Math.sqrt(intervals.length));
        rows = Math.ceil(intervals.length/cols);
    } else {
        [cols, rows] = GRID_SIZES[diff];
    }
    setBoardSize(cols, rows);
}

window.addEventListener('resize', adjustBoard);
