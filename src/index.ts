import { compress } from "lz-string";
import deserialize from "./deserializer";
import { Directory, Resource, SFFile } from "./resources";
// import as pathlib because the variable "path" is used a lot in function arguments
import pathlib from "path-browserify";

class SimulatedFilesystem {
  /** The root directory of the filesystem. */
  public root: Directory;
  /** Utility string representing the current working directory. */
  public cwd_path: string;

  /**
   * The main Simulated Filesystem class.
   * @param from (optional) If you already have a Directory, you can use it as the root. If
   * you have a serialized string/Uint8Array, you can use that instead as well.
   */
  constructor(from?: Directory | string | Uint8Array) {
    if (typeof from == "string" || from instanceof Uint8Array)
      from = deserialize(from).root;

    this.root = from || new Directory("");
    this.cwd_path = "/";
  }

  /** Modifies current working directory (`this.cwd`).
   *
   * @returns `true` on success, otherwise `false` (if the directory doesn't exist, or it's a file). */
  public cd(path: Array<string>): boolean {
    // make sure new cwd exists
    let newPath = this.cwd_path;
    path.forEach(x => (newPath = pathlib.join(newPath, x)));

    const got = this.get_by_path(newPath);

    if (!got) return false;
    if (got.type == "file") return false;

    this.cwd_path = newPath;
    return true;
  }

  /**
   * Gets the current working directory as a Directory object
   * @returns The current working directory as a Directory
   */
  public cwd(): Directory {
    const resource = this.get_by_path(this.cwd_path);

    return resource as Directory;
  }

  /**
   * Gets a resource by its path.
   * @param resource_path The resource path.
   * @returns A Resource object or null if it doesn't exist
   */
  public get_by_path(resource_path: string): Resource | null {
    let dir = this.root;
    const path = pathlib
      .normalize(resource_path)
      .split(pathlib.sep)
      .toSpliced(0, 1);

    if (JSON.stringify(path) == JSON.stringify([""])) return this.root;

    for (let i = 0; i < path.length; i++) {
      const name = path[i];
      const resource = dir.get(name);

      if (!resource) return null;

      if (resource.type == "file") return resource as SFFile;
      dir = resource as Directory;
    }

    return dir;
  }

  /**
   * Serializes this SimulatedFilesystem to a bytestring, compressed
   * with lz-string (unless `doCompress` is set to false.)
   *
   * @param doCompress (true) Whether to compress the data or not
   * @returns The serialized SimulatedFilesystem
   *
   * @example ```ts
   * // serializing it
   * import SimulatedFilesystem from 'simfs';
   *
   * const sfs = new SimulatedFilesystem(); // create the simfs
   * const serialized = sfs.serialize(); // serialize it
   * console.log(serialized); // probably some weird bytes
   *
   * // deserializing it
   * import deserialize from 'simfs/deserializer';
   * const deserialized = deserialize(serialized); // deserialize it
   *
   *
   * // these should output the same thing:
   * console.log(sfs);
   * console.log(deserialized);
   * ```
   */
  public serialize(doCompress = true): string | Uint8Array {
    const data = this.root.serialize().join(",");

    if (doCompress) {
      return compress(data);
    } else {
      return new Uint8Array(data.split(",").map(x => parseInt(x)));
    }
  }
}

/**
 * Verifies a file/folder name.
 * @param customInvalidCharacters (optional) If you want to define your own invalid characters.
 * @returns True on valid, false on invalid.
 */
function verifyResourceName(
  name: string,
  customInvalidCharacters?: string[],
) {
  // can't be over 255 because serialization only has one
  // byte for the name length which has a max of 255
  if (name.length > 255 || name.length <= 0) return false;

  const invalidCharacters = customInvalidCharacters || [
    "\\",
    "/",
    ":",
    "*",
    "?",
    '"',
    "<",
    ">",
    "|",
  ];

  if (!customInvalidCharacters) {
    // add control characters
    const control = Array.from(Array(32)).map((x, i) => i);
    invalidCharacters.push(...control.map(x => String.fromCharCode(x)));
    const del = String.fromCharCode(0x7f);
    invalidCharacters.push(del);
  }

  if (invalidCharacters.some(x => name.includes(x))) return false;
  if (name.trim().length == 0) return false; // is  (remove whitespace)
  if (
    name
      .replace(/s/g, "")
      .split("")
      .every(x => x == ".")
  )
    return; // only has dots
  if (name.endsWith(".")) return false;

  return true;
}

export default SimulatedFilesystem;
export { Directory, Resource, SFFile, verifyResourceName };
