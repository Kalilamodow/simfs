import { Directory, Resource, SFFile } from "./resources";
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
    constructor(from?: Directory | string);
    /** Modifies current working directory (`this.cwd`).
     *
     * @returns `true` on success, otherwise `false` (if the directory doesn't exist, or it's a file). */
    cd(path: Array<string>): boolean;
    cwd(): Directory;
    get_by_path(resource_path: string): Resource | null;
    /**
     * Saves this simfs to binary, then compresses it
     * @returns The compressed simfs
     */
    serialize(): string;
}
export default SimulatedFilesystem;
export { Directory, SFFile };
