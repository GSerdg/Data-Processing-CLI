// @ts-check
import { createDecipheriv, scrypt } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

const scryptAsync = promisify(scrypt);

export const decrypt = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (
    !Object.hasOwn(args, "input") ||
    !Object.hasOwn(args, "output") ||
    !Object.hasOwn(args, "password")
  ) {
    console.error("Operation failed: wrong arguments");

    return;
  }
  const inputPath = resolve(workDir.get(), args.input);
  const outputPath = resolve(workDir.get(), args.output);

  const readStream = createReadStream(inputPath);
  const writeStream = createWriteStream(outputPath);

  let buffer = Buffer.alloc(0);
  const HEADER_SIZE = 28;
  const TAG_SIZE = 16;
  let salt, iv, decipher;

  const transform = new Transform({
    async transform(chunk, _, callback) {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        if (!decipher && buffer.length >= HEADER_SIZE) {
          salt = buffer.subarray(0, 16);
          iv = buffer.subarray(16, 28);
          const key = await scryptAsync(args.password, salt, 32);

          decipher = createDecipheriv("aes-256-gcm", key, iv);

          buffer = buffer.subarray(HEADER_SIZE);
        }

        if (decipher && buffer.length > TAG_SIZE) {
          const dataForDecrypt = buffer.subarray(0, buffer.length - TAG_SIZE);
          buffer = buffer.subarray(buffer.length - TAG_SIZE);

          const decryptData = decipher.update(dataForDecrypt);
          this.push(decryptData);
        }

        callback();
      } catch (error) {
        callback(new Error("Operation failed"));
      }
    },

    flush(callback) {
      try {
        if (!decipher || buffer.length !== TAG_SIZE) {
          throw new Error("Invalid file format");
        }

        decipher.setAuthTag(buffer);
        const finalDecipherData = decipher.final();
        this.push(finalDecipherData);

        callback();
      } catch (error) {
        callback(new Error("Operation failed"));
      }
    },
  });

  try {
    await pipeline(readStream, transform, writeStream);

    console.log(getCurrentlyDirMessage());
  } catch (err) {
    console.error("Operation failed\n");
  }
};
