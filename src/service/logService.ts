import * as fs from "fs";
export function logRecord(logstr: string) {
  const currentDate = new Date();
  logstr = currentDate.toISOString() + ":" + logstr;
  const date = `${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getDate()}`;
  // fs.appendFileSync(`/cctp-logs/${date}.log`, logstr + '\n', { flag: 'a' })
}
