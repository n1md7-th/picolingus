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

export const Randomizer = (content: readonly string[]) => {
  return {
    getRandom() {
      return content[randIntId(content.length)];
    },
  };
};
