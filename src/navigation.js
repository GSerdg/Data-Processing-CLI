// @ts-check

import { join, parse } from "node:path";
import { homedir } from "node:os";

const __dirname = import.meta.dirname;
const rootPath = parse(homedir()).root;
console.log('rootPath', rootPath)

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

export const up = () => {
  if (workDir.get() === rootPath) return;
  
  workDir.set('..');
}
