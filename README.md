# simfs.js

Simple simulated filesystem in Typescript.

## Features:

- Core simulated filesystem
- Full web compatibility
- Serialization and deserialization in a simple binary format

## Saving and loading to the actual filesystem
Unfortunately, to have web compatibility, these features have been removed. However, here
are some code examples to do it. In fact, the shell tool actually uses this implementation
of saving the simfs.
```javascript

import * as fs from 'fs';

// saving a simfs
function save(simfs: SimulatedFilesystem, path: string = "./") {
    let currentDir = simfs.root;
    const pathlist: Array<string> = [path.replace(/\/$/, "")];

    if (!fs.existsSync(path)) fs.mkdirSync(path);
    else 
        console.warn(
            "Directory already exists. Some files may be overwritten.",
        );

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

// loading a simfs from the filesystem
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
