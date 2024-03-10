import * as errors from "./errors.js";
class SFFile {
    name;
    parentDir;
    /** This file's contents. Use read() to get it as a string */
    contents;
    type = "file";
    /**
     * Note: You shouldn't really ever need to initialize this class. Instead, use the
     * `createFile` method on the parent directory.
     * @param name The name of this file
     * @param contents The contents of this file
     */
    constructor(name, contents, parentDir) {
        this.name = name;
        if (typeof contents == "string") {
            contents = new Uint8Array(contents.split("").map((c) => c.charCodeAt(0)));
        }
        this.contents = contents || new Uint8Array();
        this.parentDir = parentDir;
    }
    /** Deletes this file from its parent directory */
    delete() {
        if (this.parentDir)
            this.parentDir.delete(this.name);
        else
            throw new errors.CannotDelete("No parent provided when creating file");
    }
    /** Write a string or Uint8Array to this file */
    write(newContents) {
        this.contents =
            typeof newContents == "string"
                ? new Uint8Array(newContents.split("").map((c) => c.charCodeAt(0)))
                : newContents;
    }
    /** This file's contents, as a string */
    read() {
        return new TextDecoder().decode(this.contents);
    }
    /**
     * Performs the serialization on itself
     */
    serialize() {
        return SFFile.serialize(this);
    }
    /**
     * returns a serialized version of SFFile `file`, in a Uint8Array.
     * Spec: [1, {name length byte} {name unicode bytes} {file contents length byte} {file contents unicode bytes}]
     * @param file The file to serialize
     */
    static serialize(file) {
        const name_length = file.name.length;
        const name_bytes = file.name.split("").map((char) => char.charCodeAt(0));
        // note: the 1 is to tell the deserializer that this is a file. if it were a directory, it would be a 2.
        return new Uint8Array([1]
            .concat([name_length])
            .concat(name_bytes)
            .concat([file.contents.byteLength])
            .concat(Array.from(file.contents)));
    }
}
class Directory {
    name;
    contents;
    parentDir;
    type = "directory";
    /**
     * Resource used for containing more resources
     * @param name The name of this Directory
     * @param parentDir The parent directory of this directory
     */
    constructor(name, parentDir) {
        this.name = name;
        this.parentDir = parentDir;
        this.contents = [];
    }
    /** Deletes a resource that's inside this directory */
    delete(cname) {
        const newContents = this.contents.filter((e) => e.name != cname);
        if (newContents === this.contents)
            throw new errors.ResourceNotFound();
        this.contents = newContents;
    }
    /** Deletes this directory from its parent */
    deleteSelf() {
        if (!this.parentDir)
            throw new errors.CannotDelete("No parent provided, or root directory");
        this.parentDir.delete(this.name);
    }
    /** adds an ALREADY INITIALIZED SFFile instance to this directory's contents */
    addFile(file, autoParentDir = true) {
        if (this.contents.map((x) => x.name).includes(file.name))
            throw new errors.FileExists("Cannot add file, as it already exists");
        if (autoParentDir) {
            file.parentDir = this;
        }
        this.contents.push(file);
        return file;
    }
    /** Creates a file and adds it */
    createFile(name, contents) {
        const file = new SFFile(name, contents, this);
        this.addFile(file);
        return file;
    }
    /** Creates a directory and adds it */
    createDirectory(name) {
        const dir = new Directory(name, this);
        this.contents.push(dir);
        return dir;
    }
    get(name, predefinedType) {
        if (!name)
            return this.contents;
        const res = this.contents.find((e) => e.name == name);
        if (!res)
            return null;
        if (predefinedType) {
            if ((res.type == "file" && predefinedType == "file") ||
                (res.type == "directory" && predefinedType == "directory")) {
                return res;
            }
            throw new TypeError("Predefined type does not match resource type");
        }
        return res;
    }
    /**
     * Serialized version of this directory
     * @returns Serialized representation of itself
     */
    serialize() {
        return Directory.serialize(this);
    }
    /**
     * Performs serialization to a Uint8Array on the provided Directory
     *
     * Spec:
     * `[2, {directory name length byte}, {directory name bytes},
     * {serialized files or directories inside this directory}]`
     * @param {Directroy} directory The directory to serialize
     * @returns A `Uint8Array`, continaing the serialized data
     */
    static serialize(directory) {
        // resulting array, which will be converted into
        // note: the 2 is to tell the deserializer that this is a directory.
        // if it were a file, it would start with a 1.
        const res = [2];
        const dirname_len_byte = directory.name.length;
        res.push(dirname_len_byte);
        const dirname_bytes = directory.name
            .split("")
            .map((char) => char.charCodeAt(0));
        res.push(...dirname_bytes);
        const content_bytes = [];
        directory.contents.forEach((resource) => {
            const serializedResource = resource.serialize();
            content_bytes.push(...serializedResource);
        });
        res.push(content_bytes.length);
        res.push(...content_bytes);
        return new Uint8Array(res);
    }
}
export { SFFile, Directory };
