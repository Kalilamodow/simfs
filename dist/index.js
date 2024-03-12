import { compress } from "lz-string";
import deserialize from "./deserializer.js";
import { Directory, SFFile } from "./resources.js";
// import as pathlib because the variable "path" is used a lot in function arguments
import pathlib from "path-browserify";
class SimulatedFilesystem {
    /** The root directory of the filesystem. */
    root;
    /** Utility object representing the current working directory. */
    cwd_path;
    /**
     * The main Simulated Filesystem class.
     * @param from (optional) If you already have a directory, you can use it as the root. If
     * you have a serialized Uint8Array, you can use that instead as well. If you want to provide
     * a path to load from, use a string.
     */
    constructor(from) {
        if (typeof from == 'string')
            from = deserialize(from).root;
        this.root = from || new Directory("");
        console.log(this.root.name);
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
    cwd() {
        const resource = this.get_by_path(this.cwd_path);
        return resource;
    }
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
     * Saves this simfs to binary, then compresses it
     * @returns The compressed simfs
     */
    serialize() {
        const data = this.root.serialize().join(',');
        const compressed = compress(data);
        return compressed;
    }
}
export default SimulatedFilesystem;
export { Directory, SFFile };
