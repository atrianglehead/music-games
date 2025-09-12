export const el = id => document.getElementById(id);

export function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
