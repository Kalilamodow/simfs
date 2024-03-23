import { Directory, Resource, SFFile } from "./resources";
declare class SimulatedFilesystem {
    /** The root directory of the filesystem. */
    root: Directory;
    /** Utility string representing the current working directory. */
    cwd_path: string;
    /**
     * The main Simulated Filesystem class.
     * @param from (optional) If you already have a Directory, you can use it as the root. If
     * you have a serialized string, you can use that instead as well.
     */
    constructor(from?: Directory | string);
    /** Modifies current working directory (`this.cwd`).
     *
     * @returns `true` on success, otherwise `false` (if the directory doesn't exist, or it's a file). */
    cd(path: Array<string>): boolean;
    /**
     * Gets the current working directory as a Directory object
     * @returns The current working directory as a Directory
     */
    cwd(): Directory;
    /**
     * Gets a resource by its path.
     * @param resource_path The resource path.
     * @returns A Resource object or null if it doesn't exist
     */
    get_by_path(resource_path: string): Resource | null;
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
    serialize(doCompress?: boolean): string | Uint8Array;
}
export default SimulatedFilesystem;
export { Directory, SFFile };
