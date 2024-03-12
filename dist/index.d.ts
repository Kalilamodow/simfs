import { Directory, Resource, SFFile } from "./resources.js";
declare class SimulatedFilesystem {
    /** The root directory of the filesystem. */
    root: Directory;
    /** Utility object representing the current working directory. */
    cwd_path: string;
    /**
     * The main Simulated Filesystem class.
     * @param from (optional) If you already have a directory, you can use it as the root. If
     * you have a serialized Uint8Array, you can use that instead as well. If you want to provide
     * a path to load from, use a string.
     */
    constructor(from?: Directory | Uint8Array | string);
    /** Modifies current working directory (`this.cwd`).
     *
     * @returns `true` on success, otherwise `false` (if the directory doesn't exist, or it's a file). */
    cd(path: Array<string>): boolean;
    cwd(): Directory;
    get_by_path(resource_path: string): Resource | null;
    /**
     * Saves this simulated filesystem as a binary-encoded file.
     * @returns `true` on success, `false` on error.
     */
    serialize(filename?: string): boolean;
    /**
     * Saves this simulated filesystem to the filesystem.
     * @param path The directory to put it in
     */
    save(path?: string): void;
    /**
     * Creates a simulated directory from an actual directory.
     *
     * @param path The path to load from
     * @returns A `Directory` that simulates the provided directory path
     */
    static load(path: string): Directory;
}
export default SimulatedFilesystem;
export { Directory, SFFile };
