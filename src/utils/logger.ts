export const Logger = () => {
  const template = (level: string, message: string) => {
    return `[${level.toUpperCase()}][${new Date().toISOString()}] ${message}`;
  };

  return {
    info(message: string) {
      console.log(template("info", message));
    },
    warn(message: string) {
      console.warn(template("warn", message));
    },
    error(message: string, error?: unknown) {
      console.error(template("error", message), error);
    },
  };
};
