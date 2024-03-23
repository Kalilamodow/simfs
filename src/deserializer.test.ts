import SimulatedFilesystem from ".";
import deserialize from "./deserializer";
// import * as fs from "fs";

describe("simfs serialization", () => {
  const sfs = new SimulatedFilesystem();
  const root = sfs.root;

  root.createFile("test.txt", "hello world");
  root.createFile("test 2.txt", "hello world number 2");

  const dir = root.createDirectory("subdir");
  dir.createFile("test 3.txt", "hello world number 3");
  dir.createFile("test 4.txt", "hello world number 4");

  const serialized = sfs.serialize();
  const serialized_nocompress = sfs.serialize(false);

  it("can be deserialized with compression", () => {
    const deserialized = deserialize(serialized);

    expect(deserialized).toEqual(sfs);
  });

  it("can be deserialized without compression", () => {
    const deserialized = deserialize(serialized_nocompress);

    expect(deserialized).toEqual(sfs);
  });

  // // write to file
  // const writeStream = fs.createWriteStream("test.simfs_nc");
  // writeStream.write(serialized_nocompress);
  // writeStream.end();
});
