import { INTERVALS, SETS } from './constants.js';
import { ensureAudio, playInterval, synth, midiToFreq } from './audio.js';
import { el, randInt, shuffle } from './utils.js';

const grid = el('grid');
const modeSel = el('mode');
const pairsInput = el('pairs');
const pairsVal = el('pairsVal');
const intervalSetSel = el('intervalSet');
const rootMin = el('rootMin');
const rootMax = el('rootMax');
const newGameBtn = el('newGame');
const replayAllBtn = el('replayAll');
const scoreEl = el('score');
const roundEl = el('round');

let tiles = [];
let firstPick = null;
let lock = false;
let score = 0;
let round = 1;

function makeDeck(pairCount) {
  const chosenSet = SETS[intervalSetSel.value].slice();
  if (pairCount > chosenSet.length) {
    while (chosenSet.length < pairCount) {
      chosenSet.push(...SETS[intervalSetSel.value]);
    }
  }
  const picks = shuffle(chosenSet).slice(0, pairCount);

  const deck = [];
  let uid = 0;
  for (const semis of picks) {
    const label = INTERVALS[semis] ?? `${semis}`;
    const rMin = parseInt(rootMin.value, 10);
    const rMax = parseInt(rootMax.value, 10);
    const root = randInt(rMin, rMax - semis);
    deck.push({ id: uid++, intervalSemis: semis, label, root, matched: false, faceUp: false });
    deck.push({ id: uid++, intervalSemis: semis, label, root, matched: false, faceUp: false });
  }
  return shuffle(deck);
}

function drawGrid() {
  grid.innerHTML = '';
  const cols = (tiles.length <= 12) ? 4 : 6;
  grid.className = `grid grid-cols-${cols} gap-3`;
  tiles.forEach((t, idx) => {
    const card = document.createElement('button');
    card.className = "card group relative aspect-square rounded-xl bg-neutral-900 ring-1 ring-neutral-800 hover:ring-neutral-700 focus:outline-none";
    card.setAttribute('aria-label', 'memory tile');
    const front = document.createElement('div');
    front.className = "face absolute inset-0 flex items-center justify-center text-2xl text-neutral-400";
    front.innerHTML = "？";
    const back = document.createElement('div');
    back.className = "face back absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-700/30 text-emerald-300 font-semibold select-none";
    back.innerText = t.label;
    card.appendChild(front);
    card.appendChild(back);

    if (t.faceUp || t.matched) card.classList.add('flip');
    if (t.matched) card.classList.add('ring-emerald-500');

    card.addEventListener('click', async () => {
      if (lock || t.matched || t.faceUp) {
        await ensureAudio();
        playInterval(t.root, t.intervalSemis, modeSel.value);
        return;
      }
      await ensureAudio();
      t.faceUp = true;
      card.classList.add('flip');
      playInterval(t.root, t.intervalSemis, modeSel.value);

      if (firstPick === null) {
        firstPick = idx;
      } else {
        lock = true;
        const a = tiles[firstPick];
        const b = t;
        if (a.intervalSemis === b.intervalSemis) {
          a.matched = b.matched = true;
          score += 100;
          updateScore();
          setTimeout(() => {
            lock = false;
            firstPick = null;
            checkWin();
          }, 280);
        } else {
          score -= 10;
          updateScore();
          setTimeout(() => {
            a.faceUp = false; b.faceUp = false;
            drawGrid();
            lock = false;
            firstPick = null;
          }, 700);
        }
      }
    });

    grid.appendChild(card);
  });
}

function updateScore() {
  scoreEl.textContent = score;
}

function checkWin() {
  if (tiles.every(t => t.matched)) {
    round += 1;
    roundEl.textContent = round;
    const root = randInt(52, 64);
    const now = Tone.now() + 0.05;
    synth.triggerAttackRelease([
      midiToFreq(root),
      midiToFreq(root + 4),
      midiToFreq(root + 7)
    ], 0.5, now);
    setTimeout(newGame, 650);
  }
}

export function newGame() {
  score = 0;
  updateScore();
  firstPick = null;
  lock = false;
  const pairCount = parseInt(pairsInput.value, 10);
  tiles = makeDeck(pairCount);
  drawGrid();
}

export function setupControls() {
  pairsInput.addEventListener('input', e => { pairsVal.textContent = e.target.value; });
  newGameBtn.addEventListener('click', () => { round = 1; roundEl.textContent = round; newGame(); });
  replayAllBtn.addEventListener('click', async () => {
    await ensureAudio();
    let t = 0;
    const mode = modeSel.value;
    tiles.forEach(tile => {
      Tone.Transport.scheduleOnce(() => playInterval(tile.root, tile.intervalSemis, mode), `+${t}`);
      t += 0.35;
    });
    Tone.Transport.start();
    Tone.Transport.stop(`+${t + 0.01}`);
  });

  window.addEventListener('keydown', async (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      await ensureAudio();
      const set = SETS[intervalSetSel.value];
      const semis = set[randInt(0, set.length - 1)];
      const root = randInt(parseInt(rootMin.value, 10), parseInt(rootMax.value, 10) - semis);
      playInterval(root, semis, modeSel.value);
    }
  });
}

export function init() {
  pairsVal.textContent = pairsInput.value;
  newGame();
}
