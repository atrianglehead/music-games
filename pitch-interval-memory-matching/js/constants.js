export const INTERVALS = {
  0: "P1", 1: "m2", 2: "M2", 3: "m3", 4: "M3", 5: "P4",
  6: "TT", 7: "P5", 8: "m6", 9: "M6", 10: "m7", 11: "M7", 12: "P8",
  13: "m9", 14: "M9", 15: "m10", 16: "M10", 17: "P11", 18: "TT",
  19: "P12", 20: "m13", 21: "M13", 22: "m14", 23: "M14", 24: "P15"
};

export const SETS = {
  tetrachord: [0, 2, 4, 5],
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor_tt: [0, 1, 3, 6, 7, 8, 10, 12],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  chromatic2oct: Array.from({ length: 25 }, (_, i) => i),
};
