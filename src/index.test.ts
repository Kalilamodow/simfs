import SimulatedFilesystem from ".";

describe("SimulatedFilesystem", () => {
  it("can be constructed", () => {
    const sfs = new SimulatedFilesystem();
    console.log(sfs);
  });
});
