// @ts-check

import { join, parse } from "node:path";
import { homedir } from "node:os";

const __dirname = import.meta.dirname;
const rootPath = parse(homedir()).root;

export const workDir = {
  _path: join(homedir(), "home"),
  get() {
    return this._path;
  },
  set(target) {
    if (target) {
      this._path =
        target?.[0] === "." ? join(this._path, target) : join(target);
    }
  },
};
export const getCurrentlyDirMessage = () => `You are currently in ${workDir.get()}\n`;

export const up = () => {
  if (workDir.get() === rootPath) {
    console.log(getCurrentlyDirMessage());
    return;
  }

  workDir.set("..");
  console.log(getCurrentlyDirMessage());
};

export const cd = (path) => {
  workDir.set(path);
  console.log(getCurrentlyDirMessage());
};
