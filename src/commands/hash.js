import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

export const hash = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input")) {
    console.error("Operation failed: wrong arguments");

    return;
  }

  const knownAlg = ["sha256", "md5", "sha512"];
  const filePath = resolve(workDir.get(), args.input);
  const hasAlgorithmArg = Object.hasOwn(args, "algorithm");
  const hasSaveArg = Object.hasOwn(args, "save");
  const algorithm = hasAlgorithmArg ? args.algorithm : "sha256";

  try {
    if (hasAlgorithmArg && !knownAlg.includes(args.algorithm)) {
      throw new Error("Operation failed");
    }

    const readStream = createReadStream(filePath);
    const hash = createHash(algorithm);

    await pipeline(readStream, hash);

    const finalHash = hash.digest("hex");
    const hashData = `${algorithm}: ${finalHash}\n`;

    hasSaveArg
      ? await writeFile(`${filePath}.${algorithm}`, hashData)
      : console.log(hashData);

    console.log(getCurrentlyDirMessage());
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("Operation failed");
    } else {
      console.error(err.message);
    }
  }
};
