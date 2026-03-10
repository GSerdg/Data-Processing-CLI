// @ts-check
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { cd, getCurrentlyDirMessage, ls, up } from "./navigation.js";

const __dirname = import.meta.dirname;

const main = async () => {
  const rl = createInterface({ input, output });

  console.log("Welcome to Data Processing CLI!");
  console.log(getCurrentlyDirMessage());

  rl.prompt();

  rl.on("line", async (line) => {
    const lineDestructure = line.split(" ");
    const lineCommand = lineDestructure[0];
    const lineArgs = lineDestructure[1];

    switch (lineCommand) {
      case "":
        rl.prompt();
        break;
      case "up":
        await up();
        rl.prompt();
        break;
      case "cd":
        await cd(lineArgs);
        rl.prompt();
        break;
      case "ls":
        await ls();
        rl.prompt();
        break;
      case ".exit":
        rl.close();
        break;

      default:
        console.error("Invalid input\n");
        rl.prompt();
        break;
    }
  });

  rl.on("close", () => {
    console.log("\nThank you for using Data Processing CLI!\n");
  });
};

main();
