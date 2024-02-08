import { Directory, SFFile } from "./resources.js";
import SimulatedFilesystem from "./simfs.js";

enum Section {
  RES_TYPE,
  NAME_LENGTH,
  NAME,
  CONTENT_LENGTH,
  FILE_CONTENT,
}

function print(index: number, ...m: any) {
  console.log("x" + index.toString(16).padStart(2, "0"), "\t", ...m);
}

function deserialize(serialized_bytes: Uint8Array) {
  const rootDir = new Directory("", undefined);
  let cdir: Directory;
  let cfile: SFFile;
  let ctype: "file" | "directory" = "directory";

  const left_in_dir_contents: Array<number> = [];

  let left_in_file_contents: number;
  let left_in_name: number;
  let section = Section.RES_TYPE;

  serialized_bytes.forEach((byte_, byteindex) => {
    const byte = byte_;

    switch (section) {
      case Section.RES_TYPE:
        if (byte == 1) {
          print(byteindex, "found file");
          if (cdir) cfile = cdir.createFile("");
          else cfile = rootDir.createFile("");

          ctype = "file";
        } else {
          print(byteindex, "found directory");
          if (cdir) cdir = cdir.createDirectory("");
          else cdir = rootDir.createDirectory("");

          ctype = "directory";
        }

        section = Section.NAME_LENGTH;
        break;
      case Section.NAME_LENGTH:
        print(byteindex, "found name length x" + byte.toString(16));
        left_in_name = byte;
        section = Section.NAME;

        // checks if name length is 0. if it is, then skip
        if (left_in_name == 0) {
          left_in_name = undefined;
          print(
            byteindex,
            "name length started at 0, jumping to content length immediately"
          );
          section = Section.CONTENT_LENGTH;
          break;
        }

        break;
      case Section.NAME:
        if (ctype == "file") {
          cfile.name += String.fromCharCode(byte);
        } else {
          cdir.name += String.fromCharCode(byte);
        }

        left_in_name--;

        if (left_in_name <= 0) {
          left_in_name = undefined;
          print(
            byteindex,
            `left_in_name < i0, jumping to content length. name found: ${
              ctype == "file" ? cfile.name : cdir.name
            }`
          );
          section = Section.CONTENT_LENGTH;
          break;
        }

        break;
      case Section.CONTENT_LENGTH:
        if (ctype == "file") {
          print(
            byteindex,
            "found content length of file x" + byte.toString(16)
          );
          left_in_file_contents = byte;
        } else {
          left_in_dir_contents.push(byte);
          print(byteindex, "found content length of dir x" + byte.toString(16));
          // because we have the directory now, we jump straight
          // to the header of the first file inside the directory
          section = Section.RES_TYPE;
          break;
        }

        section = Section.FILE_CONTENT;
        break;
      case Section.FILE_CONTENT:
        cfile.write(new Uint8Array(Array.from(cfile.contents).concat([byte])));

        left_in_file_contents--;
        left_in_dir_contents[left_in_dir_contents.length - 1]--;

        if (left_in_file_contents <= 0) {
          left_in_file_contents = undefined;
          print(
            byteindex,
            "left in file contents is 0, going to next file. text found: " +
              cfile.read()
          );

          if (left_in_dir_contents[left_in_dir_contents.length - 1] <= 0) {
            print(
              byteindex,
              "left_in_dir_contents is 0, jumping to next directory"
            );
            left_in_dir_contents.pop();
            cdir = cdir.parentDir;

            section = Section.RES_TYPE;
            break;
          }

          section = Section.RES_TYPE;
          break;
        }
    }
  });

  const endDir = rootDir.contents[0] as Directory;
  endDir.parentDir = undefined;

  return new SimulatedFilesystem(endDir);
}

export default deserialize;
