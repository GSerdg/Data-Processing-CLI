import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { count } from "./commands/count.js";
import { csvToJson } from "./commands/csvToJson.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { cd, getCurrentlyDirMessage, ls, up } from "./navigation.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";
import { logStats } from "./commands/logStats.js";

const __dirname = import.meta.dirname;

const main = async () => {
  const rl = createInterface({ input, output });

  console.log("Welcome to Data Processing CLI!");
  console.log(getCurrentlyDirMessage());

  rl.prompt();

  rl.on("line", async (line) => {
    const lineDestructure = line.trim().split(" ");
    const lineCommand = lineDestructure.splice(0, 1)[0];
    const lineArgs = lineDestructure;

    switch (lineCommand) {
      case "":
        rl.prompt();
        break;
      case "up":
        await up();
        rl.prompt();
        break;
      case "cd":
        await cd(lineArgs[0]);
        rl.prompt();
        break;
      case "ls":
        await ls();
        rl.prompt();
        break;
      case ".exit":
        rl.close();
        break;

      case "csv-to-json":
        await csvToJson(lineArgs);
        rl.prompt();
        break;
      case "json-to-csv":
        await jsonToCsv(lineArgs);
        rl.prompt();
        break;
      case "count":
        await count(lineArgs);
        rl.prompt();
        break;
      case "hash":
        await hash(lineArgs);
        rl.prompt();
        break;
      case "hash-compare":
        await hashCompare(lineArgs);
        rl.prompt();
        break;
      case "encrypt":
        await encrypt(lineArgs);
        rl.prompt();
        break;
      case "decrypt":
        await decrypt(lineArgs);
        rl.prompt();
        break;
      case "log-stats":
        await logStats(lineArgs);
        rl.prompt();
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
