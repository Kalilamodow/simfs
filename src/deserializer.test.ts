import SimulatedFilesystem from ".";
import deserialize from "./deserializer";

describe("simfs serialization", () => {
  const sfs = new SimulatedFilesystem();
  const root = sfs.root;

  root.createFile("test.txt", "hello world");
  root.createFile("second file.txt", "hello again");

  const subdir = root.createDirectory("subdir");
  subdir.createFile("subfile.txt", "hello from subdir");
  subdir.createFile("subfile2.txt", "hello from subdir again");

  const serialized = sfs.serialize();
  const serialized_nocompress = sfs.serialize(false);

  it("can be deserialized with compression", () => {
    const deserialized = deserialize(serialized);

    expect(deserialized).toEqual(sfs);
    console.log(deserialized);
  });

  it("can be deserialized without compression", () => {
    const deserialized = deserialize(serialized_nocompress);

    expect(deserialized).toEqual(sfs);
    console.log(deserialized);
  });
});
