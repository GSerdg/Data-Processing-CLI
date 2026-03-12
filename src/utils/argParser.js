export const getArgs = (lineArgs) => {
  const args = {};
  for (let i = 0; i < lineArgs.length; i++) {
    const argName = lineArgs[i];

    if (argName.startsWith("--")) {
      args[argName.slice(2)] =
        lineArgs[i + 1] && !lineArgs[i + 1].startsWith("--")
          ? lineArgs[i + 1]
          : null;
    }
  }

  return args;
};
