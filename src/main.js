// @ts-check
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { up, workDir } from "./navigation.js";

const __dirname = import.meta.dirname;

const main = async () => {
  const rl = createInterface({ input, output });

  rl.write("Welcome to Data Processing CLI!\n");
  rl.write(`You are currently in ${workDir.get()}\n`);
  rl.prompt();

  rl.on("line", (line) => {
    if (line === "") rl.prompt();
    switch (line) {
      case "":
        rl.prompt();
        break;
      case "up":
        up();
        console.log(`You are currently in ${workDir.get()}\n`);
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
