import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  ConnextExecutor,
  ConnextExecutor__factory,
  ConnextHandler,
  HashiConnextAdapter,
  MockHashiConnextAdapterExposure,
} from "../../shared/types/typechain";
import { ADDRESS_1, ADDRESS_2 } from "../lib/constant";

describe("Unit Test for HashiConnextAdapter", function () {
  let owner: SignerWithAddress;

  let mockHashiConnextAdapterExposure: MockHashiConnextAdapterExposure;
  let hashiConnextAdapter: HashiConnextAdapter;
  let ConnextExecutor: ConnextExecutor__factory;
  let connextExecutor: ConnextExecutor;
  let connextHandler: ConnextHandler;

  const selfDomain = 0;
  const opponentDomain = 1;
  const opponentContract = ADDRESS_1;
  const maliciousOpponentContract = ADDRESS_2;

  beforeEach(async function () {
    [, owner] = await ethers.getSigners();
    const MockHashiConnextAdapterExposure = await ethers.getContractFactory("MockHashiConnextAdapterExposure");
    mockHashiConnextAdapterExposure = <MockHashiConnextAdapterExposure>await MockHashiConnextAdapterExposure.deploy();
    const HashiConnextAdapter = await ethers.getContractFactory("HashiConnextAdapter");
    hashiConnextAdapter = <HashiConnextAdapter>await HashiConnextAdapter.deploy();
    ConnextExecutor = <ConnextExecutor__factory>await ethers.getContractFactory("ConnextExecutor");
    connextExecutor = <ConnextExecutor>await ConnextExecutor.deploy();
    const ConnextHandler = await ethers.getContractFactory("ConnextHandler");
    connextHandler = <ConnextHandler>await ConnextHandler.deploy();
    await connextExecutor.connect(owner).initialize();
    await connextHandler.initialize(connextExecutor.address);
    await hashiConnextAdapter.connect(owner).initialize(selfDomain, connextHandler.address);
    await mockHashiConnextAdapterExposure.connect(owner).initialize(selfDomain, connextHandler.address);
  });

  it("initialize", async function () {
    await expect(hashiConnextAdapter.initialize(selfDomain, connextHandler.address)).to.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("getConnext", async function () {
    expect(await hashiConnextAdapter.getConnext()).to.equal(connextHandler.address);
  });

  it("getExecutor", async function () {
    expect(await hashiConnextAdapter.getExecutor()).to.equal(connextExecutor.address);
  });

  it("getSelfDomain", async function () {
    expect(await hashiConnextAdapter.getSelfDomain()).to.equal(selfDomain);
  });

  it("set and get bridgeContract", async function () {
    await hashiConnextAdapter.connect(owner).setBridgeContract(opponentDomain, opponentContract);
    expect(await hashiConnextAdapter.getBridgeContract(opponentDomain)).to.equal(opponentContract);
    await expect(
      hashiConnextAdapter.connect(owner).setBridgeContract(opponentDomain, opponentContract)
    ).to.revertedWith("HashiConnextAdaptor: bridge already registered");
  });

  it("onlyExecutor", async function () {
    const sigHash = mockHashiConnextAdapterExposure.interface.getSighash("testOnlyExecutor");
    await mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentContract);
    await connextExecutor
      .connect(owner)
      .execute(opponentDomain, opponentContract, mockHashiConnextAdapterExposure.address, sigHash);

    const maliciousConnextExecutor = await ConnextExecutor.deploy();
    await maliciousConnextExecutor.connect(owner).initialize();

    await expect(
      maliciousConnextExecutor
        .connect(owner)
        .execute(opponentDomain, opponentContract, mockHashiConnextAdapterExposure.address, sigHash)
    ).to.revertedWith("ConnextExecutor: execute failed");

    await expect(
      connextExecutor
        .connect(owner)
        .execute(opponentDomain, maliciousOpponentContract, mockHashiConnextAdapterExposure.address, sigHash)
    ).to.revertedWith("ConnextExecutor: execute failed");
  });

  it("xCall", async function () {
    await expect(mockHashiConnextAdapterExposure.xcall(opponentDomain, "0x")).to.revertedWith(
      "HashiConnextAdapter: invalid bridge"
    );
    await mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentContract);
    await mockHashiConnextAdapterExposure.xcall(opponentDomain, "0x");
  });
});
