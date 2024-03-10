interface ResourceData {
    name: string;
    contents: any;
    parentDir: Directory | undefined;
    type: "file" | "directory";
    serialize: () => Uint8Array;
}
type Resource = SFFile | Directory;
type ResourceList = Array<Resource>;
declare class SFFile implements ResourceData {
    name: string;
    parentDir: Directory | undefined;
    /** This file's contents. Use read() to get it as a string */
    contents: Uint8Array;
    readonly type: "file";
    /**
     * Note: You shouldn't really ever need to initialize this class. Instead, use the
     * `createFile` method on the parent directory.
     * @param name The name of this file
     * @param contents The contents of this file
     */
    constructor(name: string, contents?: string | Uint8Array, parentDir?: Directory);
    /** Deletes this file from its parent directory */
    delete(): void;
    /** Write a string or Uint8Array to this file */
    write(newContents: string | Uint8Array): void;
    /** This file's contents, as a string */
    read(): string;
    /**
     * Performs the serialization on itself
     */
    serialize(): Uint8Array;
    /**
     * returns a serialized version of SFFile `file`, in a Uint8Array.
     * Spec: [1, {name length byte} {name unicode bytes} {file contents length byte} {file contents unicode bytes}]
     * @param file The file to serialize
     */
    static serialize(file: SFFile): Uint8Array;
}
declare class Directory implements ResourceData {
    name: string;
    contents: ResourceList;
    parentDir: Directory | undefined;
    readonly type: "directory";
    /**
     * Resource used for containing more resources
     * @param name The name of this Directory
     * @param parentDir The parent directory of this directory
     */
    constructor(name: string, parentDir?: Directory);
    /** Deletes a resource that's inside this directory */
    delete(cname: string): void;
    /** Deletes this directory from its parent */
    deleteSelf(): void;
    /** adds an ALREADY INITIALIZED SFFile instance to this directory's contents */
    addFile(file: SFFile, autoParentDir?: boolean): SFFile;
    /** Creates a file and adds it */
    createFile(name: string, contents?: string | Uint8Array): SFFile;
    /** Creates a directory and adds it */
    createDirectory(name: string): Directory;
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
    /**
     * Serialized version of this directory
     * @returns Serialized representation of itself
     */
    serialize(): Uint8Array;
    /**
     * Performs serialization to a Uint8Array on the provided Directory
     *
     * Spec:
     * `[2, {directory name length byte}, {directory name bytes},
     * {serialized files or directories inside this directory}]`
     * @param {Directroy} directory The directory to serialize
     * @returns A `Uint8Array`, continaing the serialized data
     */
    static serialize(directory: Directory): Uint8Array;
}
export { SFFile, Directory, Resource };
