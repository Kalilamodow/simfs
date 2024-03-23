import { compress } from "lz-string";
import deserialize from "./deserializer";
import { Directory, SFFile } from "./resources";
// import as pathlib because the variable "path" is used a lot in function arguments
import pathlib from "path-browserify";
class SimulatedFilesystem {
    /** The root directory of the filesystem. */
    root;
    /** Utility string representing the current working directory. */
    cwd_path;
    /**
     * The main Simulated Filesystem class.
     * @param from (optional) If you already have a Directory, you can use it as the root. If
     * you have a serialized string, you can use that instead as well.
     */
    constructor(from) {
        if (typeof from == "string")
            from = deserialize(from).root;
        this.root = from || new Directory("");
        this.cwd_path = "/";
    }
    /** Modifies current working directory (`this.cwd`).
     *
     * @returns `true` on success, otherwise `false` (if the directory doesn't exist, or it's a file). */
    cd(path) {
        // make sure new cwd exists
        let newPath = this.cwd_path;
        path.forEach(x => (newPath = pathlib.join(newPath, x)));
        const got = this.get_by_path(newPath);
        if (!got)
            return false;
        if (got.type == "file")
            return false;
        this.cwd_path = newPath;
        return true;
    }
    /**
     * Gets the current working directory as a Directory object
     * @returns The current working directory as a Directory
     */
    cwd() {
        const resource = this.get_by_path(this.cwd_path);
        return resource;
    }
    /**
     * Gets a resource by its path.
     * @param resource_path The resource path.
     * @returns A Resource object or null if it doesn't exist
     */
    get_by_path(resource_path) {
        let dir = this.root;
        const path = pathlib
            .normalize(resource_path)
            .split(pathlib.sep)
            .toSpliced(0, 1);
        if (JSON.stringify(path) == JSON.stringify([""]))
            return this.root;
        for (let i = 0; i < path.length; i++) {
            const name = path[i];
            const resource = dir.get(name);
            if (!resource)
                return null;
            if (resource.type == "file")
                return resource;
            dir = resource;
        }
        return dir;
    }
    /**
     * Serializes this SimulatedFilesystem to a bytestring, compressed
     * with lz-string.
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
    serialize(doCompress = true) {
        const data = this.root.serialize().join(",");
        if (doCompress) {
            return compress(data);
        }
        else {
            return new Uint8Array(data.split(",").map(x => parseInt(x)));
        }
    }
}
export default SimulatedFilesystem;
export { Directory, SFFile };
