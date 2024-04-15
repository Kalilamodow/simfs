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
declare class SFFile implements ResourceData {
    name: string;
    parentDir: Directory | undefined;
    /** This file's contents. Use read() to get it as a string */
    contents: Uint8Array;
    readonly type: "file";
    /**
     * The file class for a simfs. Just a name and some contents.
     * You shouldn't really ever need to initialize this class. Instead, use the
     * `createFile` method on the parent directory.
     * @param name The name of this file
     * @param contents The contents of this file
     */
    constructor(name: string, contents?: string | Uint8Array, parentDir?: Directory);
    /** Deletes this file from its parent directory */
    delete(): void;
    /**
     * Renames this file.
     */
    rename(newName: string): void;
    /** Write a string or Uint8Array to this file */
    write(newContents: string | Uint8Array): void;
    /** This file's contents, as a string */
    read(): string;
    /**
     * Returns the serialized representation of this SFFile
     * as a UInt8Array.
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
     * @param parentDir The parent Directory of this Directory (note: if this
     * isn't set, it won't check for a valid directory name as it assumes it's root)
     */
    constructor(name: string, parentDir?: Directory);
    /** Deletes a direct child of this directory */
    delete(cname: string): void;
    /** Deletes this directory from its parent */
    deleteSelf(): void;
    /**
     * Renames a **child** of this directory. To delete this, use the `renameSelf` method
     */
    rename(resourceName: string, newName: string): void;
    /**
     * Deletes **this** directory. To rename a child, use the `rename` method
     */
    renameSelf(newName: string): void;
    /** adds an ALREADY INITIALIZED SFFile instance to this directory's contents */
    addFile(file: SFFile, autoParentDir?: boolean): SFFile;
    /** Creates a file as a subresource of this Directory */
    createFile(name: string, contents?: string | Uint8Array): SFFile;
    /** Creates a directory as a subresource of this Directory */
    createDirectory(name: string): Directory;
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
    /**
     * Returns the serialized representation of this Directory
     * as a UInt8Array.
     */
    serialize(): Uint8Array;
    /**
     * Performs serialization to a Uint8Array on the provided Directory
     *
     * Spec:
     * `[2, {directory name length byte}, {directory name bytes},
     * {serialized files or directories inside this directory}]`
     * @param {Directory} directory The directory to serialize
     * @returns A `Uint8Array`, continaing the serialized data
     */
    static serialize(directory: Directory): Uint8Array;
}
export { Directory, Resource, SFFile };
