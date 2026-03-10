// @ts-check

import { join, parse, dirname } from "node:path";
import { homedir } from "node:os";
import { readdir, writeFile, stat, readFile } from "node:fs/promises";

const rootPath = parse(homedir()).root;

export const workDir = {
  _path: join(homedir(), "home"),
  get() {
    return this._path;
  },
  async set(target) {
    if (target) {
      try {
        const targetPath =
          target?.[0] === "." ? join(this._path, target) : join(target);
        await readdir(targetPath);

        this._path = targetPath;
        console.log(getCurrentlyDirMessage());
      } catch (err) {
        if (["ENOTDIR", "ENOENT"].includes(err.code)) {
          console.error("Operation failed\n");
        } else {
          throw err;
        }
      }
    }
  },
};
export const getCurrentlyDirMessage = () =>
  `You are currently in ${workDir.get()}\n`;

export const up = async () => {
  if (workDir.get() === rootPath) {
    console.log(getCurrentlyDirMessage());
    return;
  }

  await workDir.set("..");
};

export const cd = async (path) => {
  await workDir.set(path);
};
