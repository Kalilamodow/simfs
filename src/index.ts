import * as fs from "fs";
import deserialize from "./deserializer.js";
import { Directory, Resource, SFFile } from "./resources.js";
// import as pathlib because the variable "path" is used a lot in function arguments
import pathlib from "path-browserify";

class SimulatedFilesystem {
  /** The root directory of the filesystem. */
  public root: Directory;
  /** Utility object representing the current working directory. */
  public cwd_path: string;

  /**
   * The main Simulated Filesystem class.
   * @param from (optional) If you already have a directory, you can use it as the root. If
   * you have a serialized Uint8Array, you can use that instead as well. If you want to provide
   * a path to load from, use a string.
   */
  constructor(from?: Directory | Uint8Array) {
    if (from instanceof Uint8Array) from = deserialize(from).root;

    this.root = from || new Directory("");
    console.log(this.root.name);
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

  public cwd(): Directory {
    const resource = this.get_by_path(this.cwd_path);

    return resource as Directory;
  }

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
   * Saves this simulated filesystem as a binary-encoded file.
   * @returns `true` on success, `false` on error.
   */
  public serialize(
    filename: string = "./simulated-filesystem.simfs",
  ): boolean {
    const data = this.root.serialize();

    try {
      fs.writeFileSync(filename, data);
    } catch (e) {
      console.log("Could not write to file: ", e);
      return false;
    }

    return true;
  }
}

export default SimulatedFilesystem;
export { Directory, SFFile };
