import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { parse, resolve } from "node:path";

const rootPath = parse(homedir()).root;

export const workDir = {
  _path: homedir(),
  get() {
    return this._path;
  },
  async set(target) {
    if (target) {
      try {
        const targetPath = resolve(this._path, target);
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

export const ls = async () => {
  const dirents = await readdir(workDir.get(), { withFileTypes: true });
  const files = [];
  const folders = [];

  let longName = 0;

  for (const dirent of dirents) {
    dirent.isDirectory() ? folders.push(dirent.name) : files.push(dirent.name);
    longName = Math.max(dirent.name.length, longName);
  }

  folders.sort((a, b) => a.localeCompare(b));
  files.sort((a, b) => a.localeCompare(b));

  folders.forEach((folder) => {
    console.log(`${folder}${' '.repeat(longName - folder.length + 1)}[folder]`);
  });
  files.forEach((file) => {
    console.log(`${file}${' '.repeat(longName - file.length + 1)}[file]`);
  });
};
