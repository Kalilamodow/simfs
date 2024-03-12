/**
 * Tests reading from/writing to the physical filesystem
 */
import SimulatedFilesystem from "../src/index.js";
import startShell from "../src/shell.js";

const OPTIONS = {
  test_create: false,
  test_read: true,
};

function create(sfs: SimulatedFilesystem) {
  const root = sfs.root;
  root.createFile("file.txt", "hello, world!");
  root.createFile("file2.txt", "hello, world! 2");
  const dir = root.createDirectory("sub");
  dir.createFile("subfile4.txt", "hello world s4");
  dir.createFile("file5.txt", "hello world 5");
  const subdir = dir.createDirectory("subsub");
  subdir.createFile("subfile1.txt", "hello world s1");
  subdir.createFile("file6.txt", "hello world 6");
}

if (OPTIONS.test_create) {
  console.log("CREATION TEST:");

  const sfs = new SimulatedFilesystem();
  create(sfs);

  sfs.save("simfs_save");
  console.log(sfs.root);
}

if (OPTIONS.test_read) {
  console.log("READING TEST:\n");
  const directory = SimulatedFilesystem.load("simfs_save");
  console.log(directory);

  startShell(directory);
}
