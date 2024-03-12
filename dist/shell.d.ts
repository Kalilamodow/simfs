import { Directory } from "./resources.js";
import SimulatedFilesystem from "./index.js";
/**
 * Starts a simple shell that can be used to interact with the filesystem.
 *
 * @param start Directory, SimulatedFilesystem, or serialized directory to
 * start with. If not specified, it starts with a blank SimulatedFilesystem.
 *
 * @param print_hello Whether to print the welcome message.
 */
declare const startShell: (start?: Directory | Uint8Array | SimulatedFilesystem, print_hello?: boolean) => void;
export default startShell;
