// @ts-check

import { createReadStream, createWriteStream } from "node:fs";
import { Transform, Writable, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { workDir } from "../navigation.js";

export const csvToJson = async (lineArgs) => {
  const inputIdx = lineArgs.indexOf("--input");
  const outputIdx = lineArgs.indexOf("--output");

  if (
    inputIdx === -1 ||
    outputIdx === -1 ||
    !lineArgs[inputIdx + 1] ||
    !lineArgs[outputIdx + 1]
  ) {
    throw new Error("wrong arguments");
  }

  const inputPath = lineArgs[inputIdx + 1];
  const outputPath = lineArgs[outputIdx + 1];
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
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Operation failed");
    } else {
      throw err;
    }
  }
};
