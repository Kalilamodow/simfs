import SimulatedFilesystem from ".";
import deserialize from "./deserializer";

describe("Deserializer", () => {
  const sfs = new SimulatedFilesystem();
  const serialized_compress = sfs.serialize();
  const serialized_nocompress = sfs.serialize(false);

  it("can deserialize", () => {
    const deserialized = deserialize(serialized_compress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize without compression", () => {
    const deserialized = deserialize(serialized_nocompress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize within simfs constructor", () => {
    const deserialized = new SimulatedFilesystem(serialized_compress);
    expect(deserialized).toEqual(sfs);
  });

  it("can deserialize within simfs constructor without compression", () => {
    const deserialized = new SimulatedFilesystem(serialized_nocompress);
    expect(deserialized).toEqual(sfs);
  });
});
