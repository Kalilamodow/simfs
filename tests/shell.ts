import { clear as clear_console } from "console";
import * as readlineSync from "readline-sync";
import * as errors from "../src/errors.js";
import { Directory } from "../src/resources.js";
import SimulatedFilesystem from "../src/index.js";
import * as pathlib from "path";

enum HandledCommandReturn {
  CONTINUE,
  EXIT,
  EXIT_ERROR,
}

let sfs: SimulatedFilesystem;

// Python function aliases lol
const print = (m: any) => console.log(m);
const input = (m: string) => readlineSync.question(m);

enum Commands {
  LIST = "ls",
  CHANGE_DIR = "cd",
  CREATE_FILE = "cf",
  CREATE_DIR = "mkdir",
  DELETE = "delete",
  WRITE = "wr",
  PRINT_FILE = "cat",
  CLEAR = "clear",
  HELP = "help",
  BYTEREPR = "serialize",
  SAVE = "disksave",
}

/**
 * Handles a command.
 *
 * @param cmd the command
 * @returns whether to exit or continue
 */
const handleCommand = (cmd: string): HandledCommandReturn => {
  if (cmd == "exit") {
    return HandledCommandReturn.EXIT;
  }

  if (cmd == Commands.LIST) {
    const cwd = sfs.cwd();
    const filelist =
      cwd.get().length > 0
        ? cwd.contents.map(
          x => x.name + (x.type == "directory" ? "/" : ""),
        )
        : null;

    if (filelist) print(filelist.join("\n"));
    else print("No files in directory");
  } else if (cmd.startsWith(Commands.CHANGE_DIR)) {
    const path = cmd.split(" ")[1];

    if (!sfs.cd(path.split("/"))) print("error: directory does not exist");
  } else if (cmd.startsWith(Commands.CREATE_FILE)) {
    const filename = cmd.split(" ")[1];
    const contents = cmd.split(" ").slice(2).join(" ");

    try {
      sfs.cwd().createFile(filename, contents);
    } catch (e) {
      if (e instanceof errors.FileExists)
        print("error: file already exists");
      else print("error: unknown error");
    }
  } else if (cmd.startsWith(Commands.CREATE_DIR)) {
    const dirname = cmd.split(" ")[1];
    try {
      sfs.cwd().createDirectory(dirname);
    } catch (e) {
      if (e instanceof errors.FileExists)
        print("error: directory already exists");
      else print("error: unknown error");
    }
  } else if (cmd.startsWith(Commands.DELETE)) {
    const filename = cmd.split(" ")[1];
    sfs.cwd().delete(filename);
  } else if (cmd.startsWith(Commands.PRINT_FILE)) {
    const filename = cmd.split(" ")[1];
    const file = sfs.cwd().get(filename);

    if (!file) {
      print("File not found");

      return HandledCommandReturn.CONTINUE;
    }
    if (file.type == "file") print(file.read());
    else print("error: not a file");
  } else if (cmd == Commands.CLEAR) {
    clear_console();
  } else if (cmd.startsWith(Commands.WRITE)) {
    const filename = cmd.split(" ")[1];
    const contents = cmd.split(" ").slice(2).join(" ");

    const file = sfs.cwd().get(filename);

    if (!file) {
      print("File not found");
      return HandledCommandReturn.CONTINUE;
    }

    if (file.type != "file") {
      print("error: not a file");
    } else {
      file.write(contents);
      print("wrote successfully");
    }
  } else if (cmd == Commands.HELP) {
    print(`
commands:
  directories:
    ${Commands.LIST} \t\t\t\t\t list files in cwd
    ${Commands.CHANGE_DIR} {path} \t\t\t\t change directory by {path}
    ${Commands.DELETE} {name} \t\t\t delete resource {name}
    ${Commands.CREATE_DIR} {dirname} \t\t\t create directory {dirname}
  files:
    ${Commands.CREATE_FILE} {filename} {contents} \t create file {filename} with contents {contents}
    ${Commands.WRITE} {filename} {contents} \t write to file {filename} with contents {contents}
    ${Commands.PRINT_FILE} {filename} \t\t\t print contents of file {filename}
    
  exit: exits the shell`);
  } else if (cmd.startsWith(Commands.BYTEREPR)) {
    const filename = cmd.split(" ")[1];
    const file = sfs.cwd().get(filename);

    if (!file) {
      print("File not found");
      return HandledCommandReturn.CONTINUE;
    }

    if (cmd.includes("--string")) {
      print(
        Array.from(file.serialize())
          .map(x => String.fromCharCode(x))
          .join(""),
      );
    } else if (cmd.includes("--debug")) {
      print(file.serialize().join("\t"));
      print(
        Array.from(file.serialize())
          .map(x => String.fromCharCode(x))
          .join("\t"),
      );
    } else {
      print(file.serialize().join(" "));
    }
  } else if (cmd == Commands.SAVE) {
    const should = input("Are you sure? (y/N)\n> ");
    if (should.toLowerCase() == "y") {
      const path = input("Path:\n> ");
      sfs.save(path);
    }
  }

  return HandledCommandReturn.CONTINUE;
};

/**
 * Starts a simple shell that can be used to interact with the filesystem.
 *
 * @param start Directory, SimulatedFilesystem, or serialized directory to
 * start with. If not specified, it starts with a blank SimulatedFilesystem.
 *
 * @param print_hello Whether to print the welcome message.
 */
const startShell = (
  start?: Directory | Uint8Array | SimulatedFilesystem,
  print_hello = true,
) => {
  if (start instanceof SimulatedFilesystem) sfs = start;
  else sfs = new SimulatedFilesystem(start);

  if (print_hello)
    print(
      "welcome to the simfs shell! type 'help' for a list of commands.",
    );

  // main loop
  for (; ;) {
    const command = input(
      `(${pathlib.normalize(sfs.cwd_path).replaceAll("\\", "/")})> `,
    );
    const res = handleCommand(command);

    if (res == HandledCommandReturn.EXIT) break;
  }
};

// if running from "npm run" then start the shell
if (process.argv[2]) if (process.argv[2].includes("run")) startShell();

export default startShell;
