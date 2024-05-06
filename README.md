# simfs

Simple simulated filesystem in Typescript.

## Features:

- Full web compatibility
- Serialization and deserialization
- Really good documentation

## API reference
- SimulatedFilesystem (default import)
- Directory
- SFFile
- (simfs/resources) Directory
- (simfs/resources) SFFile
- (simfs/deserializer) deserialize()

### SimulatedFilesystem

> The main Simulated Filesystem class.
> @param from (optional)  
> If you already have a Directory, you can use it as the root. If
you have a serialized string/Uint8Array, you can use that instead as well. ([Serialization](#serialization and deserialization))

Example
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

### Directory
> Resource used for containing more resources  
> @param name The name of this Directory  
> @param parentDir The parent Directory of this Directory (note: if this
> isn't set, it won't check for a valid directory name as it assumes it's root)
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

### SFFile class

> Note: It's called SFFile because "File" already exists


> The file class for a simfs. Just a name and some contents.
> You shouldn't really ever need to initialize this class. Instead, use the
> `createFile` method on the parent directory.  
> @param name The name of this file  
> @param contents The contents of this file

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

### Serialization
> simfs uses a custom serialization format, and will compress it with lz-string unless explicitly disabled.

```typescript
// all resources support "serialize" method
someFile.serialize(); // uncompressed
someDir.serialize(); // uncompressed

// only serializing with SimulatedFilesystem.serialize will compress
simfs.serialize(); // compressed
simfs.serialize(false); // don't compress
```

### Deserialization
> Deserializes a serialized SimulatedFilesystem.  
> @param serialized The serialized SimulatedFilesystem  
> @returns Deserialized SimulatedFilesystem

```ts
import SimulatedFilesystem from 'simfs';
import deserialize from 'simfs/deserializer';

const sfs = new SimulatedFilesystem(); // create the simfs
const serialized = sfs.serialize(); // serialize it
console.log(serialized); // probably some weird bytes
const deserialized = deserialize(serialized); // deserialize it

// these should output the same thing:
console.log(sfs);
console.log(deserialized);
```

## Contributing

I'm not going to add any guidelines for this. Just add test coverage. If you don't want to, feel free to open an issue. I'm honestly running out of ideas...