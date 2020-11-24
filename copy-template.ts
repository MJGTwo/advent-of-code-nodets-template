import path from "path";
import { make, find, read, write, run } from "promise-path";
import { report, fromHere } from "./util";

async function fetchAOCDInput(currentYear: number, currentDay: number) {
  report(
    "Using AOCD to attempt to download your puzzle input, see: https://github.com/wimglenn/advent-of-code-data"
  );
  try {
    const { stdout, stderr } = await run(`aocd ${currentDay} ${currentYear}`);
    if (stderr) {
      report(`AOCD ${currentYear} / ${currentDay}`, stderr);
    }
    if (stdout) {
      report(`Downloaded ${stderr.bytes} bytes of data using AOCD.`);
    }
    return stdout;
  } catch (ex) {
    report(`Could not fetch input for ${currentYear} / ${currentDay}`, ex);
  }
  return "PASTE YOUR INPUT HERE";
}

async function copyTemplate() {
  const newFolderName = process.argv[2];
  const templateFolderPath = "solutions/template";
  const targetFolderPath = fromHere(`solutions/${newFolderName}`);

  if (!newFolderName) {
    return report(
      "No path specified to copy to.",
      "Please specify a folder name as an argument to this script.",
      "e.g. node copy-template day5"
    );
  }

  const existingFiles = await find(`${targetFolderPath}/*`);
  if (existingFiles.length > 0) {
    report("Existing files found:");
    console.log(existingFiles.map((n) => "  " + n).join("\n"));
    return report("Path", newFolderName, "already exists, doing nothing.");
  }

  report(
    "Creating:",
    `solutions/${newFolderName}`,
    "from template",
    templateFolderPath
  );

  const templateFiles = await find(fromHere(`${templateFolderPath}/*`));
  await make(fromHere(`solutions/${newFolderName}`));
  await Promise.all(
    templateFiles.map(async (filepath) => {
      const contents = await read(filepath);
      const filename = path.parse(filepath).base;
      const newFilePath = `solutions/${newFolderName}/${filename}`;
      report("Creating:", newFilePath);
      return write(fromHere(newFilePath), contents);
    })
  );

  report("Attemping to download puzzle input for this date");

  const currentPath = fromHere("/");
  const currentFolder = currentPath.split("/").reverse()[1];
  const currentYearString: string | undefined = currentFolder.split("-").pop();
  const currentDay: number = Number.parseInt(newFolderName.replace("day", ""));
  if (!currentYearString || !currentDay) {
    report(`Invalid year (${currentYearString}) / day (${currentDay})`);
    process.exit(1);
  }
  const currentYear: number = +currentYearString;
  report(
    `Based on the path, ${currentFolder} I think its: ${currentYearString}, and you're trying to solve: Day ${currentDay}`
  );

  if (+currentYear > 0 && currentDay > 0) {
    report(`Potentially valid year (${currentYear}) / day (${currentDay})`);
    const aocInputText = await fetchAOCDInput(+currentYear, currentDay);
    await write(
      fromHere(`solutions/${newFolderName}/input.txt`),
      aocInputText,
      "utf8"
    );
  } else {
    report(`Invalid year (${currentYear}) / day (${currentDay})`);
  }

  report("Done.");
}

module.exports = copyTemplate();
