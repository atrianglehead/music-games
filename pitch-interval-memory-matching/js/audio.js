let audioArmed = false;
const limiter = new Tone.Limiter(-1).toDestination();
const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.1 }).connect(limiter);
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.003, decay: 0.15, sustain: 0, release: 0.08 }
}).connect(reverb);

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export async function ensureAudio() {
  if (audioArmed) return;
  await Tone.start();
  audioArmed = true;
}

export function playInterval(rootMidi, semis, mode) {
  const f1 = midiToFreq(rootMidi);
  const f2 = midiToFreq(rootMidi + semis);
  const now = Tone.now();

  switch (mode) {
    case 'mel_up':
      synth.triggerAttackRelease(f1, 0.25, now);
      synth.triggerAttackRelease(f2, 0.25, now + 0.3);
      break;
    case 'mel_down':
      synth.triggerAttackRelease(f2, 0.25, now);
      synth.triggerAttackRelease(f1, 0.25, now + 0.3);
      break;
    default:
      synth.triggerAttackRelease([f1, f2], 0.35, now);
  }
}

export { synth };
