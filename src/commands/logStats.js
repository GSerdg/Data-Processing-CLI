import { open, stat, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
import { join, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { getCurrentlyDirMessage, workDir } from "../navigation.js";
import { getArgs } from "../utils/argParser.js";

const __dirname = import.meta.dirname;

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(join(__dirname, "../workers/logWorker.js"), {
      workerData,
    });

    worker.on("message", (result) => {
      worker.terminate();
      resolve(result);
    });

    worker.on("error", (err) => {
      worker.terminate();
      reject(err);
    });
  });
}

export const finalizeStatsOutput = (stats) => {
  let finalStats;

  for (let i = 0; i < stats.length; i++) {
    const workerStatistic = stats[i];

    if (i === 0) {
      finalStats = { ...workerStatistic };

      continue;
    }

    finalStats.total += workerStatistic.total;
    finalStats.avgResponseTimeMs += workerStatistic.avgResponseTimeMs;

    Object.entries(workerStatistic.levels).forEach(([level, count]) => {
      finalStats.levels[level] += count;
    });
    Object.entries(workerStatistic.status).forEach(([statusCode, count]) => {
      finalStats.status[statusCode] += count;
    });

    for (const pathObj of workerStatistic.topPaths) {
      const pathIndex = finalStats.topPaths.findIndex(
        ({ path, _ }) => path === pathObj.path,
      );

      if (pathIndex === -1) {
        finalStats.topPaths.push({ ...pathObj });
      } else {
        const finalPathObj = finalStats.topPaths[pathIndex];
        finalPathObj.count += pathObj.count;
      }
    }
  }

  const time =
    finalStats.total === 0
      ? 0
      : (finalStats.avgResponseTimeMs / finalStats.total).toFixed(2);
  finalStats.avgResponseTimeMs = +time;
  finalStats.topPaths.sort((a, b) => b.count - a.count);

  return JSON.stringify(finalStats, null, 2);
};

export const logStats = async (lineArgs) => {
  const args = getArgs(lineArgs);

  if (!Object.hasOwn(args, "input") || !Object.hasOwn(args, "output")) {
    console.error("Operation failed: wrong arguments");

    return;
  }
  const inputPath = resolve(workDir.get(), args.input);
  const outputPath = resolve(workDir.get(), args.output);

  try {
    const fd = await open(inputPath, "r");

    const cpuCount = cpus().length;
    const fileSize = (await stat(inputPath)).size;
    const chunkSize = Math.floor(fileSize / cpuCount);
    
    try {
      let start = 0;
      const resultArrayPromises = [];

      for (let i = 0; i < cpuCount; i++) {
        let end = start + chunkSize;

        // это не последний фрагмент
        if (i < cpuCount - 1) {
          const buffer = Buffer.alloc(1024);

          let isFound = false;
          let offset = end;

          // поиск позиции переноса строки
          while (!isFound && offset < fileSize) {
            const { bytesRead } = await fd.read(buffer, 0, 1024, offset);

            const endOfLineIndex = buffer.subarray(0, bytesRead).indexOf("\n");

            if (endOfLineIndex === -1) {
              offset += bytesRead;
            } else {
              end = offset + endOfLineIndex;
              isFound = true;
            }
          }
        } else {
          end = fileSize;
        }

        resultArrayPromises.push(runWorker({ inputPath, start, end }));

        start = end + 1;
      }

      const workerResults = await Promise.all(resultArrayPromises);

      const resultStats = finalizeStatsOutput(workerResults);

      await writeFile(outputPath, resultStats);

      console.log(getCurrentlyDirMessage());
    } finally {
      await fd.close();
    }
  } catch (error) {
    console.error("Operation failed");
  }
};
