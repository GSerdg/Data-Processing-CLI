// @ts-check

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

export const hashCompare = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input") || !Object.hasOwn(args, "hash")) {
    console.error("Operation failed: wrong arguments");

    return;
  }

  const knownAlg = ["sha256", "md5", "sha512"];
  const hasAlgorithmArg = Object.hasOwn(args, "algorithm");
  const filePath = resolve(workDir.get(), args.input);
  const hashPath = resolve(workDir.get(), args.hash);
  const algorithm = hasAlgorithmArg ? args.algorithm : "sha256";

  try {
    if (hasAlgorithmArg && !knownAlg.includes(args.algorithm)) {
      throw new Error("Operation failed");
    }

    const readStream = createReadStream(filePath);
    const hash = createHash(algorithm);

    await pipeline(readStream, hash);

    const finalHash = hash.digest("hex");

    const hashFileData = await readFile(hashPath);
    const checksum = hashFileData.toString().split("\n")[0].split(" ").pop();

    console.log(finalHash.toUpperCase() === checksum.toUpperCase() ? "OK\n" : "MISMATCH\n");
    console.log(getCurrentlyDirMessage());
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Operation failed");
    } else {
      console.error(err.message);
    }
  }
};
