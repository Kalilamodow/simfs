import * as errors from "./errors.js";

interface ResourceData {
  name: string;
  contents: any;
  parentDir: Directory | undefined;
  type: "file" | "directory";
  serialize: () => Uint8Array;
}

type Resource = SFFile | Directory;

type ResourceList = Array<Resource>;

class SFFile implements ResourceData {
  public parentDir: Directory | undefined;
  /** This file's contents. Use read() to get it as a string */
  public contents: Uint8Array;
  public readonly type: "file" = "file";

  /**
   * Note: You shouldn't really ever need to initialize this class. Instead, use the
   * `createFile` method on the parent directory.
   * @param name The name of this file
   * @param contents The contents of this file
   */
  constructor(
    public name: string,
    contents?: string | Uint8Array,
    parentDir?: Directory
  ) {
    if (typeof contents == "string") {
      contents = new Uint8Array(contents.split("").map((c) => c.charCodeAt(0)));
    }

    this.contents = contents || new Uint8Array();
    this.parentDir = parentDir;
  }

  /** Deletes this file from its parent directory */
  public delete() {
    if (this.parentDir) this.parentDir.delete(this.name);
    else throw new errors.CannotDelete("No parent provided when creating file");
  }

  /** Write a string or Uint8Array to this file */
  public write(newContents: string | Uint8Array) {
    this.contents =
      typeof newContents == "string"
        ? new Uint8Array(newContents.split("").map((c) => c.charCodeAt(0)))
        : newContents;
  }

  /** This file's contents, as a string */
  public read(): string {
    return new TextDecoder().decode(this.contents);
  }

  /**
   * Performs the serialization on itself
   */
  public serialize() {
    return SFFile.serialize(this);
  }

  /**
   * returns a serialized version of SFFile `file`, in a Uint8Array.
   * Spec: [1, {name length byte} {name unicode bytes} {file contents length byte} {file contents unicode bytes}]
   * @param file The file to serialize
   */
  public static serialize(file: SFFile) {
    const name_length = file.name.length;
    const name_bytes = file.name.split("").map((char) => char.charCodeAt(0));
    // note: the 1 is to tell the deserializer that this is a file. if it were a directory, it would be a 2.
    return new Uint8Array(
      [1]
        .concat([name_length])
        .concat(name_bytes)
        .concat([file.contents.byteLength])
        .concat(Array.from(file.contents))
    );
  }
}

class Directory implements ResourceData {
  public name: string;
  public contents: ResourceList;
  public parentDir: Directory | undefined;
  public readonly type: "directory" = "directory";

  /**
   * Resource used for containing more resources
   * @param name The name of this Directory
   * @param parentDir The parent directory of this directory
   */
  constructor(name: string, parentDir?: Directory) {
    this.name = name;

    this.parentDir = parentDir;
    this.contents = [];
  }

  /** Deletes a resource that's inside this directory */
  public delete(cname: string) {
    const newContents = this.contents.filter((e) => e.name != cname);
    if (newContents === this.contents) throw new errors.ResourceNotFound();
    this.contents = newContents;
  }

  /** Deletes this directory from its parent */
  public deleteSelf() {
    if (!this.parentDir)
      throw new errors.CannotDelete("No parent provided, or root directory");

    this.parentDir.delete(this.name);
  }

  /** adds an ALREADY INITIALIZED SFFile instance to this directory's contents */
  public addFile(file: SFFile, autoParentDir: boolean = true): SFFile {
    if (this.contents.map((x) => x.name).includes(file.name))
      throw new errors.FileExists("Cannot add file, as it already exists");

    if (autoParentDir) {
      file.parentDir = this;
    }

    this.contents.push(file);
    return file;
  }

  /** Creates a file and adds it */
  public createFile(name: string, contents?: string | Uint8Array): SFFile {
    const file = new SFFile(name, contents, this);
    this.addFile(file);
    return file;
  }

  /** Creates a directory and adds it */
  public createDirectory(name: string): Directory {
    const dir = new Directory(name, this);
    this.contents.push(dir);
    return dir;
  }

  /**
   * Get all resources in this directory.
   * To get a specific resource, use this method with the name as an argument
   */
  get(): ResourceList;
  /**
   * Gets a specific resource by name. Already know the type, and sure it exists?
   * Add another argument with the type ("file" or "directory"), and get the type hinting.
   * @param name The name of the resource
   */
  get(name: string): Resource | null;
  /** Gets a file by name. */
  get(name: string, predefinedType: "file"): SFFile | null;
  /** Gets a directory by name. */
  get(name: string, predefinedType: "directory"): Directory | null;

  public get(name?: string, predefinedType?: "file" | "directory") {
    if (!name) return this.contents;

    const res = this.contents.find((e) => e.name == name);
    if (!res) return null;

    if (predefinedType) {
      if (
        (res.type == "file" && predefinedType == "file") ||
        (res.type == "directory" && predefinedType == "directory")
      ) {
        return res;
      }

      throw new TypeError("Predefined type does not match resource type");
    }

    return res;
  }

  /**
   * Serialized version of this directory
   * @returns Serialized representation of itself
   */
  public serialize() {
    return Directory.serialize(this);
  }

  /**
   * Performs serialization to a Uint8Array on the provided Directory
   *
   * Spec:
   * `[2, {directory name length byte}, {directory name bytes},
   * {serialized files or directories inside this directory}]`
   * @param {Directroy} directory The directory to serialize
   * @returns A `Uint8Array`, continaing the serialized data
   */
  public static serialize(directory: Directory): Uint8Array {
    // resulting array, which will be converted into
    // note: the 2 is to tell the deserializer that this is a directory.
    // if it were a file, it would start with a 1.
    const res: Array<number> = [2];
    const dirname_len_byte = directory.name.length;

    res.push(dirname_len_byte);
    const dirname_bytes = directory.name
      .split("")
      .map((char) => char.charCodeAt(0));
    res.push(...dirname_bytes);

    const content_bytes: Array<number> = [];

    directory.contents.forEach((resource) => {
      const serializedResource = resource.serialize();

      content_bytes.push(...serializedResource);
    });

    res.push(content_bytes.length);
    res.push(...content_bytes);

    return new Uint8Array(res);
  }
}

export { SFFile, Directory, Resource };
