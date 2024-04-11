import SimulatedFilesystem, { Directory, SFFile } from ".";

describe("Directories", () => {
  const simfs = new SimulatedFilesystem();
  const root = simfs.root;

  it("can create resources", () => {
    const dir1 = root.createDirectory("td1");
    const dir2 = root.createDirectory("td2");

    const file1 = root.createFile("tf1.txt", "hello world");
    const file2 = root.createFile("tf2.txt", "hello world #2");

    expect(root.get("td1")).toBe(dir1);
    expect(root.get("td2")).toBe(dir2);
    expect(root.get("tf1.txt")).toBe(file1);
    expect(root.get("tf2.txt")).toBe(file2);
  });

  it("can retrieve resources", () => {
    const dir1 = root.get("td1");
    const dir2 = root.get("td2");
    const file1 = root.get("tf1.txt");
    const file2 = root.get("tf2.txt");

    expect(dir1).toBeInstanceOf(Directory);
    expect(dir2).toBeInstanceOf(Directory);
    expect(file1).toBeInstanceOf(SFFile);
    expect(file2).toBeInstanceOf(SFFile);
  });

  it("can delete resources", () => {
    root.delete("td1");
    root.delete("td2");
    root.delete("tf1.txt");
    root.delete("tf2.txt");

    expect(root.get("td1")).toBeNull();
    expect(root.get("td2")).toBeNull();
    expect(root.get("tf1.txt")).toBeNull();
    expect(root.get("tf2.txt")).toBeNull();
  });

  it("can rename children and itself", () => {
    const directory = root.createDirectory("td1");
    const file = directory.createFile("tf1.txt", "hello world");

    expect(directory.get("tf1.txt")).toBe(file);
    file.rename("tf2.txt");
    expect(directory.get("tf1.txt")).toBeNull();
    expect(directory.get("tf2.txt")).toBe(file);

    directory.rename("tf2.txt", "tf3.txt");
    expect(directory.get("tf2.txt")).toBeNull();
    expect(directory.get("tf3.txt")).toBe(file);

    directory.renameSelf("td2");
    expect(root.get("td1")).toBeNull();
    expect(root.get("td2")).toBe(directory);

    root.rename("td2", "td3");
    expect(root.get("td2")).toBeNull();
    expect(root.get("td3")).toBe(directory);

    directory.deleteSelf(); // cleanup
  });
});

describe("Files", () => {
  const sfs = new SimulatedFilesystem();
  const root = sfs.root;
  const directory = root.createDirectory("dir");

  it("can be created", () => {
    const file = directory.createFile("file.txt", "hello world");

    expect(file).toBeInstanceOf(SFFile);
    expect(file.name).toBe("file.txt");
    expect(file.read()).toBe("hello world");

    expect(directory.get("file.txt")).toBe(file);
  });

  it("can be read from", () => {
    const file = directory.get("file.txt", "file")!;
    expect(file).toBeInstanceOf(SFFile);

    expect(file.read()).toBe("hello world");
  });

  it("can be written to", () => {
    const file_ = directory.get("file.txt", "file");
    expect(file_).toBeInstanceOf(SFFile);
    const file = file_ as SFFile;

    file.write("hello world #2");
    expect(file.read()).not.toBe("hello world");
    expect(file.read()).toBe("hello world #2");
  });

  it("can throw on invalid writes", () => {
    // >255b error
    expect(() => {
      directory.get("file.txt", "file")!.write("hello world".repeat(9999));
    }).toThrow();

    expect(() => {
      directory
        .get("file.txt", "file")!
        .write("hello world #2".repeat(9999));
    }).toThrow();

    expect(() => {
      directory.get("file.txt", "file")!.write("t💀i💀 👍s🍓b👍d");
    }).toThrow();
  });

  it("can be deleted", () => {
    const file = directory.get("file.txt", "file")!;
    expect(file).toBeInstanceOf(SFFile);
    file.delete();
    expect(directory.get("file.txt")).toBeNull();
  });
});
