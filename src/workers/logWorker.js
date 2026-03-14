// @ts-check
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { parentPort, workerData } from "node:worker_threads";

const { inputPath: filePath, start, end } = workerData;

const stream = createReadStream(filePath, { start, end });
const rl = createInterface({ input: stream });

const outputStats = {
  total: 0,
  levels: { INFO: 0, WARN: 0, ERROR: 0 },
  status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  topPaths: [],
  avgResponseTimeMs: 0,
};

rl.on("line", (line) => {
  const lineArray = line.split(" ");

  if (lineArray.length < 7) return;

  const level = lineArray[1];
  const statusCode = lineArray[3].replace(/..$/, "xx");
  const time = +lineArray[4];
  const incomePath = lineArray[6];

  outputStats.total += 1;
  outputStats.levels[level] += 1;
  outputStats.status[statusCode] += 1;
  outputStats.avgResponseTimeMs += time;

  const pathIndex = outputStats.topPaths.findIndex(
    ({ path, _ }) => path === incomePath,
  );

  if (pathIndex === -1) {
    outputStats.topPaths.push({ path: incomePath, count: 1 });
  } else {
    const pathObj = outputStats.topPaths[pathIndex];
    pathObj.count += 1;
  }
});

rl.on("close", () => {
  parentPort?.postMessage(outputStats);
});
