import SimulatedFilesystem from ".";
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
declare function deserialize(serialized: string | Uint8Array): SimulatedFilesystem;
export default deserialize;
