// @ts-check

import { createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

export const jsonToCsv = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input") || !Object.hasOwn(args, "output")) {
    console.error("Operation failed: wrong arguments");

    return;
  }

  const inputPath = args.input;
  const outputPath = args.output;

  const jsonPath = resolve(workDir.get(), inputPath);
  const csvPath = resolve(workDir.get(), outputPath);

  let buffer = "";

  const transform = new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();

      callback();
    },

    flush(callback) {
      if (buffer) {
        try {
          const parsed = JSON.parse(buffer);
          let isFirst = true;

          for (const obj of parsed) {
            if (isFirst) {
              this.push(
                `${Object.keys(obj).reduce((str, key) => (str === "" ? key : `${str},${key}`), "")}\n`,
              );

              isFirst = false;
            }

            this.push(
              `${Object.values(obj).reduce((str, value) => (str === "" ? value : `${str},${value}`), "")}\n`,
            );
          }
        } catch (error) {
          throw new Error("Operation failed");
        }
      }
      callback();
    },
  });
  try {
    const readStream = createReadStream(jsonPath);

    await pipeline(readStream, transform, createWriteStream(csvPath));

    console.log(getCurrentlyDirMessage());
  } catch (err) {
    console.error("Operation failed");
  }
};
