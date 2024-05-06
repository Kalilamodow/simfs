import SimulatedFilesystem from ".";
import deserialize from "./deserializer";

describe("Deserializer", () => {
  const sfs = new SimulatedFilesystem();
  (() => {
    sfs.root.createDirectory("dir2");
    const directory = sfs.root.createDirectory("dir1");
    directory.createFile("hello.txt", "some text");
    directory.createFile("hello 2.txt", "some text number 2");
    sfs.root.createFile("hello.py", "print('hello owrld!')");
  })();

  const serialized_compress = sfs.serialize();
  const serialized_nocompress = sfs.serialize(false);

  it("can deserialize", () => {
    const deserialized = deserialize(serialized_compress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize without compression", () => {
    const deserialized = deserialize(serialized_nocompress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize within simfs constructor", () => {
    const deserialized = new SimulatedFilesystem(serialized_compress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize within simfs constructor without compression", () => {
    const deserialized = new SimulatedFilesystem(serialized_nocompress);
    expect(deserialized).toEqual(sfs);
  });
});
