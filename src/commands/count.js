import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { stdout } from "node:process";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

export const count = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input")) {
    console.error("Operation failed: wrong arguments");

    return;
  }

  const filePath = resolve(workDir.get(), args.input);

  const result = {
    lines: 0,
    words: 0,
    characters: 0,
  };

  let buffer = "";

  const transform = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();

      const linesArray = buffer.split("\n");
      buffer = linesArray.pop() || '';
      console.log('BUFFER!!!!!!!!!!!!!!!!          ', buffer);

      result.lines += linesArray.length;

      for (const line of linesArray) {
        result.characters += line.length + 1;
        result.words += line.trim().split(/\s+/).filter(Boolean).length;
      }

      callback();
    },

    flush(callback) {
      if (buffer) {
        result.lines += 1;
        result.characters += buffer.length;
        result.words += buffer.trim().split(/\s+/).filter(Boolean).length;
      }

      this.push(
        `Lines: ${result.lines}\nWords: ${result.words}\nCharacters ${result.characters}\n\n`,
      );
      callback();
    },
  });

  try {
    await pipeline(createReadStream(filePath), transform, stdout, { end: false });

    console.log(getCurrentlyDirMessage());
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Operation failed");
    } else {
      throw err;
    }
  }
};
