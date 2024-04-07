import SimulatedFilesystem, { Directory, SFFile } from ".";

describe("Files", () => {
  const sfs = new SimulatedFilesystem();
  const root = sfs.root;

  it("can create, write, and read from files", () => {
    const file1 = root.createFile("test 1 1.txt", "hello world");
    const file2 = root.createFile("test 1 2.txt", "hello world #2");

    expect(file1.read()).toBe("hello world");
    expect(file2.read()).toBe("hello world #2");

    file1.write("hello world again");
    file2.write("hello world #2 again");

    expect(file1.read()).toBe("hello world again");
    expect(file2.read()).toBe("hello world #2 again");
  });

  it("shouldn't be able to handle more than 255 bytes", () => {
    expect(() =>
      root.createFile("test 2 1.txt", "hello world".repeat(15)),
    ).not.toThrow();

    expect(() => {
      root.createFile("test 2 2.txt", "hello world".repeat(256));
    }).toThrow();
  });

  it("shouldn't be able to handle characters outside of UTF-8", () => {
    expect(() => {
      root.createFile("test 3.txt", "this is a utf-8 string!");
    }).not.toThrow();

    expect(() => {
      root.createFile("test 4.txt", "Th🤖s 🤠s n🦄t a UTF-8 str🤖ng!");
    }).toThrow();
  });

  it("should be able to delete itself", () => {
    const file = root.createFile("test 5.txt", "hello world");
    file.delete();
    expect(root.get("test 5.txt")).toBeNull();
  });
});

describe("Directories", () => {
  const simfs = new SimulatedFilesystem();
  const root = simfs.root;

  it("can create directories", () => {
    root.createDirectory("test 1");
    root.createDirectory("test 2");
  });

  it("can get created files and directories", () => {
    expect(root.get("test 1")).toBeInstanceOf(Directory);

    root.createFile("test 1.txt", "hello world");
    expect(root.get("test 1.txt")).toBeInstanceOf(SFFile);
  });

  it("can create and add files into directories", () => {
    expect(root.get("test 1", "directory")).toBeInstanceOf(Directory);

    const dir = root.get("test 1", "directory")!;

    dir.createFile("test 1.txt", "hello world");
    expect(dir.get("test 1.txt")).toBeInstanceOf(SFFile);

    const toAdd = new SFFile("test 2.txt", "hello world #2");
    dir.addFile(toAdd);
    expect(dir.get("test 2.txt")).toBe(toAdd);
  });

  it("can delete files from directories", () => {
    const dir = root.get("test 1", "directory")!;
    dir.delete("test 1.txt");
    expect(dir.get("test 1.txt")).toBeNull();
  });
});

describe("Deserializable", () => {
  const sfs = new SimulatedFilesystem();
  const serialized_compress = sfs.serialize();
  const serialized_nocompress = sfs.serialize(false);

  it("can be deserialized with compression", () => {
    const deserialized = new SimulatedFilesystem(serialized_compress);
    expect(deserialized).toEqual(sfs);
  });

  it("can be deserialized without compression", () => {
    const deserialized = new SimulatedFilesystem(serialized_nocompress);
    expect(deserialized).toEqual(sfs);
  });
});
