import { verifyResourceName } from ".";
import * as errors from "./errors";

/**
 * Base data for anything that will be in the simfs
 */
interface ResourceData {
  name: string;
  contents: any;
  parentDir: Directory | undefined;
  type: "file" | "directory";
  serialize: () => Uint8Array;
}

type Resource = SFFile | Directory;

type ResourceList = Array<Resource>;

// Called SFFile because "File" is already a
// class in Javascript
class SFFile implements ResourceData {
  public parentDir: Directory | undefined;
  /** This file's contents. Use read() to get it as a string */
  public contents: Uint8Array;
  public readonly type: "file" = "file";

  /**
   * The file class for a simfs. Just a name and some contents.
   * You shouldn't really ever need to initialize this class. Instead, use the
   * `createFile` method on the parent directory.
   * @param name The name of this file
   * @param contents The contents of this file
   * 
   * @example
   * ```typescript
   * // creating
   * const someFile = new SFFile("someFile.txt", "raspberry");
   * const anotherFile = new SFFile(
   *   "anotherFile.txt",
   *   // this is just "raspberry"
   *   new Uint8Array([114, 97, 115, 112, 98, 101, 114, 114, 121]),
   * );
   *
   * // getting contents
   * someFile.read(); // "raspberry"
   * someFile.contents; // Uint8Array([114, 97, 115, 112, 98, 101, 114, 114, 121])
   *
   * // writing
   * someFile.write("blackberry"); // void
   * someFile.write("🍓"); // ERROR: UnsupportedEncoding()
   * someFile.write("hello".repeat(9999)); // ERROR: WriteTooLarge()
   *
   * // you can only delete it if it has a parent directory.
   * // so this will work:
   * const dir = simfs.root;
   * const f = dir.createFile("hello.txt", "hello");
   *
   * // or
   * const f = new SFFile("hello.txt", "hello");
   * dir.addFile(f);
   *
   * f.delete();
   * dir.get("hello.txt"); // null
   *
   * // but this will not:
   * const allAlone = new SFFile("hello.txt", "hello");
   * allAlone.delete(); // ERROR: CannotDelete()
    ```
   */
  constructor(
    public name: string,
    contents?: string | Uint8Array,
    parentDir?: Directory,
  ) {
    if (!verifyResourceName(name)) throw new errors.InvalidName();

    if (typeof contents == "string") {
      if (
        contents
          .split("")
          .map(c => c.charCodeAt(0))
          .some(c => c > 0xff)
      ) {
        throw new errors.UnsupportedEncoding();
      }

      contents = new Uint8Array(
        contents.split("").map(c => c.charCodeAt(0)),
      );
    }

    if (contents.length > 0xff) {
      throw new errors.WriteTooLarge();
    }

    this.contents = contents || new Uint8Array();
    this.parentDir = parentDir;
  }

  /** Deletes this file from its parent directory */
  public delete() {
    if (this.parentDir) this.parentDir.delete(this.name);
    else
      throw new errors.CannotDelete(
        "No parent provided when creating file",
      );
  }

  /**
   * Renames this file.
   */
  public rename(newName: string) {
    if (!verifyResourceName(newName)) throw new errors.InvalidName();

    if (!this.parentDir)
      throw new errors.CannotDelete(
        "No parent provided, or root directory",
      );

    this.parentDir.rename(this.name, newName);
  }

  /** Write a string or Uint8Array to this file */
  public write(newContents: string | Uint8Array) {
    if (newContents.length > 0xff) {
      throw new errors.WriteTooLarge();
    }

    if (typeof newContents == "string") {
      if (
        newContents
          .split("")
          .map(c => c.charCodeAt(0))
          .some(c => c > 0xff)
      ) {
        throw new errors.UnsupportedEncoding();
      }
    }

    this.contents =
      typeof newContents == "string"
        ? new Uint8Array(newContents.split("").map(c => c.charCodeAt(0)))
        : newContents;
  }

  /** This file's contents, as a string */
  public read(): string {
    return new TextDecoder().decode(this.contents);
  }

  /**
   * Returns the serialized representation of this SFFile
   * as a UInt8Array.
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
    const name_bytes = file.name.split("").map(char => char.charCodeAt(0));
    // note: the 1 is to tell the deserializer that this is a file. if it were a directory, it would be a 2.
    return new Uint8Array(
      [1]
        .concat([name_length])
        .concat(name_bytes)
        .concat([file.contents.byteLength])
        .concat(Array.from(file.contents)),
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
   * @param parentDir The parent Directory of this Directory (note: if this
   * isn't set, it won't check for a valid directory name as it assumes it's root)
   * 
   * @example
   * ```typescript
   * // "root" is the root directory
   * const myDirectory = simfs.root;
   *
   * // creating resources
   * const file = subdirectory.createFile("file.txt", "eeee");
   * const subdirectory = myDirectory.createDirectory("subdirectory");
   * subdirectory.createFile("secrets.txt", "sorry, they're a secret");
   *
   * // getting resource
   * myDirectory.get(); // Array of resources
   * myDirectory.get("file.txt"); // SFFile
   * myDirectory.get("subdirectory"); // Directory
   * myDirectory.get("old mcdonald had a farm"); // null
   *
   * // getting resources with specific types
   * myDirectory.get(fileName, "file"); // SFFile
   * myDirectory.get(directoryName, "directory"); // Directory
   * myDirectory.get("banana", "file"); // null
   * myDirectory.get("apple", "directory"); // null
   *
   * myDirectory.get(fileName, "directory"); // TypeError
   * myDirectory.get(directoryName, "file"); // TypeError
    ```
   */
  constructor(name: string, parentDir?: Directory) {
    if (!verifyResourceName(name) && parentDir) {
      throw new errors.InvalidName();
    }

    this.name = name;

    this.parentDir = parentDir;
    this.contents = [];
  }

  /** 
   * Deletes a direct child of this directory 
   * @param cname Name of the child
   */
  public delete(cname: string) {
    const newContents = this.contents.filter(e => e.name != cname);
    if (newContents === this.contents) throw new errors.ResourceNotFound();
    this.contents = newContents;
  }

  /** Deletes this directory from its parent */
  public deleteSelf() {
    if (!this.parentDir)
      throw new errors.CannotDelete(
        "No parent provided, or root directory",
      );

    this.parentDir.delete(this.name);
  }

  /**
   * Renames a **child** of this directory. To delete this, use the `renameSelf` method
   */
  public rename(resourceName: string, newName: string) {
    if (!verifyResourceName(newName)) throw new errors.InvalidName();

    const resource = this.get(resourceName);
    if (!resource)
      throw new errors.ResourceNotFound(
        "Could not find resource to rename",
      );
    resource.name = newName;
  }

  /**
   * Renames **this** directory. To rename a child, use the `rename` method
   * @param newName The new name.
   */
  public renameSelf(newName: string) {
    if (!verifyResourceName(newName)) throw new errors.InvalidName();

    if (!this.parentDir)
      throw new errors.CannotDelete(
        "No parent provided, or root directory",
      );

    this.parentDir.rename(this.name, newName);
  }

  /** 
   * Adds an ALREADY INITIALIZED SFFile instance to this directory's contents 
   * @param file The file to add
   * @param [autoParentDir=true] Whether to automatically set this as the parent directory
   */
  public addFile(file: SFFile, autoParentDir: boolean = true): SFFile {
    if (this.contents.map(x => x.name).includes(file.name))
      throw new errors.FileExists("Cannot add file, as it already exists");

    if (autoParentDir) {
      file.parentDir = this;
    }

    this.contents.push(file);
    return file;
  }

  /**
   * Creates a file as a subresource of this Directory 
   * @param name File name
   * @param contents (optional) The file contents
  */
  public createFile(name: string, contents?: string | Uint8Array): SFFile {
    const file = new SFFile(name, contents, this);
    this.addFile(file);
    return file;
  }

  /** Creates a directory as a subresource of this Directory 
   * @param name Directory name
  */
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
   * Gets a specific resource by name. If you are 100% sure of the type,
   * add another argument with the type ("file" or "directory") to prevent
   * any type checking errors.
   * @param name The name of the resource
   */
  get(name: string): Resource | null;
  /**
   * Gets a SFFile by its name. If the resource is not
   * an SFFile, an error will be thrown.
   * @returns The File if it exists or null.
   */
  get(name: string, predefinedType: "file"): SFFile | null;
  /**
   * Gets a Directory by its name. If the resource is not
   * a Directory, an error will be thrown.
   * @returns The Directory if it exists or null.
   */
  get(name: string, predefinedType: "directory"): Directory | null;

  public get(name?: string, predefinedType?: "file" | "directory") {
    if (!name) return this.contents;

    const res = this.contents.find(e => e.name == name);
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
   * Returns the serialized representation of this Directory
   * as a UInt8Array.
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
   * @param {Directory} directory The directory to serialize
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
      .map(char => char.charCodeAt(0));
    res.push(...dirname_bytes);

    const content_bytes: Array<number> = [];

    directory.contents.forEach(resource => {
      const serializedResource = resource.serialize();

      content_bytes.push(...serializedResource);
    });

    // save content bytes as two bytes
    const base_content_length = content_bytes.length;
    if (base_content_length < 0xff) {
      // first push 0 as padding
      res.push(0, base_content_length);
    } else {
      const content_length_hex = base_content_length.toString(16);
      const first = parseInt(content_length_hex.slice(0, 2), 16);
      const second = parseInt(content_length_hex.slice(2), 16);
      res.push(first, second);
    }

    res.push(...content_bytes);

    return new Uint8Array(res);
  }
}

export { Directory, Resource, SFFile };
