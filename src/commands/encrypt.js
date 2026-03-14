// @ts-check
import { createCipheriv, randomBytes, scrypt } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const encrypt = async (lineArgs) => {
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

  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await scryptAsync(args.password, salt, 32);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const readStream = createReadStream(inputPath);
  const writeStream = createWriteStream(outputPath);

  try {
    writeStream.write(salt);
    writeStream.write(iv);

    await pipeline(readStream, cipher, writeStream, { end: false });

    const authTag = cipher.getAuthTag();
    writeStream.write(authTag);

    console.log(getCurrentlyDirMessage());
  } catch (err) {
    console.error("Operation failed");
  }
};
