// @ts-check

import { createReadStream, createWriteStream } from "node:fs";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

export const csvToJson = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input") || !Object.hasOwn(args, "output")) {
    console.error("Operation failed: wrong arguments");

    return;
  }

  const inputPath = args.input;
  const outputPath = args.output;

  const csvPath = resolve(workDir.get(), inputPath);
  const jsonPath = resolve(workDir.get(), outputPath);

  let buffer = "";
  let header = [];
  let isFirstChunk = true;

  const transform = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();

      const lines = buffer.split("\n").filter((line) => line !== "");
      buffer = lines.pop();

      if (isFirstChunk) {
        header.push(lines.splice(0, 1)[0]);
        header = header[0].split(",");
      }

      for (const line of lines) {
        const resultObject = {};

        for (let i = 0; i < header.length; i++) {
          const lineArray = line.split(",");
          resultObject[header[i]] = lineArray[i];
        }

        this.push(
          `  ${JSON.stringify(resultObject)},\n`
            .replace("{", "{ ")
            .replace("}", " }")
            .replaceAll('":', '": ')
            .replaceAll(',"', ', "'),
        );
      }

      isFirstChunk = false;
      callback();
    },

    flush(callback) {
      if (buffer) {
        const resultObject = {};

        for (let i = 0; i < header.length; i++) {
          const lineArray = buffer.split(",");
          resultObject[header[i]] = lineArray[i];
        }

        this.push(
          `  ${JSON.stringify(resultObject)}\n`
            .replace("{", "{ ")
            .replace("}", " }")
            .replaceAll('":', '": ')
            .replaceAll(',"', ', "'),
        );
      }
      callback();
    },
  });

  const fileStream = createWriteStream(jsonPath);

  const writable = new Writable({
    construct(callback) {
      fileStream.write("[\n", callback);
    },
    write(chunk, _, callback) {
      fileStream.write(chunk, callback);
    },
    final(callback) {
      fileStream.end("]", callback);
    },
  });

  try {
    const readStream = createReadStream(csvPath);

    await pipeline(readStream, transform, writable);
    
    console.log(getCurrentlyDirMessage());
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Operation failed");
    } else {
      throw err;
    }
  }

};
