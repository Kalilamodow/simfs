# simfs

Simple simulated filesystem in Typescript.

## Features:

- Full web compatibility
- Serialization and deserialization in a simple binary format

## API reference

There are extensive JSDoc comments on functions and classes. Honestly, they are probably better than this.

- SimulatedFilesystem (default import)
- Directory
- SFFile
- (simfs/resources) Directory
- (simfs/resources) SFFile
- (simfs/deserializer) deserialize()

#### SimulatedFilesystem

```typescript
// creating new
const simfs = new SimulatedFilesystem();

// creating from an existing directory
const directory = new Directory();
const simfs = new SimulatedFilesystem(directory);

// creating from a compressed serialized string
const serialized = someOtherSimfs.serialize();
const simfs = new SimulatedFilesystem(serialized);
```

#### Directory class

```typescript
// "root" is the root directory
const myDirectory = simfs.root;

// creating resources
const file = subdirectory.createFile("file.txt", "eeee");
const subdirectory = myDirectory.createDirectory("subdirectory");
subdirectory.createFile("secrets.txt", "sorry, they're a secret");

// getting resource
myDirectory.get(); // Array of resources
myDirectory.get("file.txt"); // SFFile
myDirectory.get("subdirectory"); // Directory
myDirectory.get("old mcdonald had a farm"); // null

// getting resources with specific types
myDirectory.get(fileName, "file"); // SFFile
myDirectory.get(directoryName, "directory"); // Directory
myDirectory.get("banana", "file"); // null
myDirectory.get("apple", "directory"); // null

myDirectory.get(fileName, "directory"); // TypeError
myDirectory.get(directoryName, "file"); // TypeError
```

#### SFFile class

Note: It's called SFFile because "File" already exists

```typescript
// creating
const someFile = new SFFile("someFile.txt", "raspberry");
const anotherFile = new SFFile(
  "anotherFile.txt",
  // this is just "raspberry"
  new Uint8Array([114, 97, 115, 112, 98, 101, 114, 114, 121]),
);

// getting contents
someFile.read(); // "raspberry"
someFile.contents; // Uint8Array([114, 97, 115, 112, 98, 101, 114, 114, 121])

// writing
someFile.write("blackberry"); // void
someFile.write("🍓"); // ERROR: UnsupportedEncoding()
someFile.write("hello".repeat(9999)); // ERROR: WriteTooLarge()

// you can only delete it if it has a parent directory.
// so this will work:
const dir = simfs.root;
const f = dir.createFile("hello.txt", "hello");

// or
const f = new SFFile("hello.txt", "hello");
dir.addFile(f);

f.delete();
dir.get("hello.txt"); // null

// but this will not:
const allAlone = new SFFile("hello.txt", "hello");
allAlone.delete(); // ERROR: CannotDelete()
```

#### Serialization and deserialization

simfs supports a simple serialization format, and will compress it with lz-string unless explicitly disabled.

```typescript
// SERIALIZATION

// all resources support "serialize" method
someFile.serialize(); // uncompressed
someDir.serialize(); // uncompressed

// only serializing with SimulatedFilesystem.serialize will compress
simfs.serialize(); // compressed
simfs.serialize(false); // don't compress

// DESERIALIZATION
import deserialize from "simfs/deserializer";
const simfs = createSampleSimfs(); // THIS DOES NOT EXIST

const serialized_compressed = simfs.serialize();
const serialized_uncompressed = simfs.serialize(false);

const simfs_c = deserialize(serialized_compressed);
const simfs_u = deserialize(serialized_uncompressed);

simfs_u == simfs_c; // true
```

Like I said before, there's a lot better documentation in the JSDoc comments. You'd be better off just using VSCode to browse through the methods.

## Contributing

I'm not going to add any guidelines for this. Just add test coverage. If you don't want to, feel free to open an issue. I'm honestly running out of ideas...

## Saving and loading to the actual filesystem

Saving to the filesystem

```typescript
import * as fs from "fs";

function save(simfs: SimulatedFilesystem, path: string = "./") {
  let currentDir = simfs.root;
  const pathlist: Array<string> = [path.replace(/\/$/, "")];

  function searchDir() {
    currentDir.contents.forEach(reso => {
      if (reso.type == "directory") {
        const dir = reso as Directory;
        pathlist.push(dir.name);
        fs.mkdirSync(pathlist.join("/"));
        currentDir = dir;
        searchDir();
      } else if (reso.type == "file") {
        const file = reso as SFFile;
        fs.appendFileSync(
          pathlist.join("/") + "/" + file.name,
          file.contents,
          "utf-8",
        );
      }
    });

    if (currentDir.parentDir) currentDir = currentDir.parentDir;
  }

  searchDir();
}
```

Loading a simfs from the filesystem

```typescript
import * as pathlib from "path";
import * as fs from "fs";

function load(path: string) {
  const loaded = new Directory("");
  let cdir = loaded;

  function readDir(dirpath_: string) {
    const dirpath = pathlib.normalize(dirpath_);
    const files = fs.readdirSync(dirpath);

    files.forEach(filename => {
      const filepath = pathlib.join(dirpath, filename);
      const stats = fs.statSync(filepath);

      if (stats.isDirectory()) {
        cdir = cdir.createDirectory(filename);
        readDir(filepath);
      } else {
        const contents = fs.readFileSync(filepath);
        cdir.createFile(filename, new Uint8Array(contents));
      }
    });

    if (cdir.parentDir) cdir = cdir.parentDir;
  }

  readDir(path);
  return loaded;
}
```
