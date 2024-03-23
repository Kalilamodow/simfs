import { decompress } from "lz-string";
import SimulatedFilesystem from ".";
const decodeString = (bytes) => Array.from(bytes)
    .map(x => String.fromCharCode(x))
    .join("");
/**
 * Takes some serialized bytes as input (should be of a directory), deserializes them,
 * then modifies the parent directory accordingly.
 * @param bytes Input bytes
 * @param parent The parent directory to modify.
 *
 * @returns The length of the parsed directory
 */
function parseDirectory(bytes_, parent) {
    const bytes = Array.from(bytes_);
    bytes.shift(); // remove type byte (we know it's a directory)
    const name_length = bytes.shift();
    const name = decodeString(bytes.splice(0, name_length));
    const directory = parent.createDirectory(name);
    // content length is two bytes, so shift twice
    const content_length = bytes.shift() + bytes.shift();
    // start at zero because we already removed all the
    // type, name length, and name bytes (with shift() and splice())
    for (let byte_index = 0; byte_index < content_length; byte_index++) {
        const typeByte = bytes[byte_index];
        if (typeByte == 1) {
            const nameLength = bytes[byte_index + 1];
            const name = decodeString(bytes.slice(byte_index + 2, byte_index + 2 + nameLength));
            const contentsLength = bytes[byte_index + 2 + nameLength];
            const contents = decodeString(bytes.slice(byte_index + 3 + nameLength, byte_index + 3 + nameLength + contentsLength));
            directory.createFile(name, contents);
            const bump = 3 + nameLength + contentsLength;
            byte_index += bump;
            // decrement because for loop automatically increments
            byte_index--;
        }
        if (typeByte == 2) {
            const bump = parseDirectory(new Uint8Array(bytes.splice(byte_index)), directory);
            byte_index += bump;
            // decrement because for loop automatically increments
            byte_index--;
        }
    }
    return content_length;
}
/**
 * Deserializes a serialized SimulatedFilesystem.
 *
 * @param serialized The serialized SimulatedFilesystem
 * @returns Deserialized SimulatedFilesystem
 *
 * @example ```ts
 * import SimulatedFilesystem from 'simfs';
 * import deserialize from 'simfs/deserializer';
 *
 * const sfs = new SimulatedFilesystem(); // create the simfs
 * const serialized = sfs.serialize(); // serialize it
 * console.log(serialized); // probably some weird bytes
 * const deserialized = deserialize(serialized); // deserialize it
 *
 * // these should output the same thing:
 * console.log(sfs);
 * console.log(deserialized);
 * ```
 */
function deserialize(serialized) {
    const is_compressed = typeof serialized == "string";
    const serialized_bytes = is_compressed
        ? decompress(serialized)
            .split(",")
            .map(x => parseInt(x))
        : serialized;
    const sfs = new SimulatedFilesystem();
    parseDirectory(new Uint8Array(serialized_bytes), sfs.root);
    // parseDirectory creates new directories,
    // so set it to the old root
    sfs.root = sfs.root.get()[0];
    sfs.root.parentDir = undefined;
    return sfs;
}
export default deserialize;
