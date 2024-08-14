export const randIntId = (max: number) => {
  return Math.floor(Math.random() * max);
};

export const Counter = (start = 0) => {
  let count = start;

  return {
    inc: () => count++,
    val: () => count,
  };
};
