export const randIntId = (max: number) => {
  return Math.floor(Math.random() * max);
};

export const Counter = (start = 0) => {
  let count = start;

  return {
    inc: () => count++,
    val: () => count,
    add: (val: number) => (count += val),
  };
};

export const Emoji = (emojis: readonly string[]) => {
  return {
    getRandom() {
      return emojis[randIntId(emojis.length)];
    },
  };
};
