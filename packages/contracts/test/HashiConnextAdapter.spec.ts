import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  HashiExecutor,
  HashiExecutor__factory,
  HashiHandler,
  MockHashiConnextAdapterExposure,
} from "../../shared/types/typechain";
import { ADDRESS_1, ADDRESS_2 } from "../lib/constant";

describe("Unit Test for HashiConnextAdapter", function () {
  let owner: SignerWithAddress;

  let HashiExecutor: HashiExecutor__factory;
  let hashiExecutor: HashiExecutor;
  let hashiHandler: HashiHandler;
  let mockHashiConnextAdapterExposure: MockHashiConnextAdapterExposure;

  const selfDomain = 0;
  const opponentDomain = 1;
  const opponentBridgeContract = ADDRESS_1;
  const maliciousOpponentContract = ADDRESS_2;

  beforeEach(async function () {
    [, owner] = await ethers.getSigners();
    const MockHashiConnextAdapterExposure = await ethers.getContractFactory("MockHashiConnextAdapterExposure");
    mockHashiConnextAdapterExposure = <MockHashiConnextAdapterExposure>await MockHashiConnextAdapterExposure.deploy();

    HashiExecutor = <HashiExecutor__factory>await ethers.getContractFactory("HashiExecutor");
    hashiExecutor = <HashiExecutor>await HashiExecutor.deploy();
    const HashiHandler = await ethers.getContractFactory("HashiHandler");
    hashiHandler = <HashiHandler>await HashiHandler.deploy();
    await hashiExecutor.connect(owner).initialize();
    await hashiHandler.initialize(hashiExecutor.address);
    await mockHashiConnextAdapterExposure.connect(owner).initialize(selfDomain, hashiHandler.address);
  });

  it("initialize", async function () {
    await expect(mockHashiConnextAdapterExposure.initialize(selfDomain, hashiHandler.address)).to.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("getConnext", async function () {
    expect(await mockHashiConnextAdapterExposure.getConnext()).to.equal(hashiHandler.address);
  });

  it("getExecutor", async function () {
    expect(await mockHashiConnextAdapterExposure.getExecutor()).to.equal(hashiExecutor.address);
  });

  it("getSelfDomain", async function () {
    expect(await mockHashiConnextAdapterExposure.getSelfDomain()).to.equal(selfDomain);
  });

  it("set and get bridgeContract", async function () {
    await mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentBridgeContract);
    expect(await mockHashiConnextAdapterExposure.getBridgeContract(opponentDomain)).to.equal(opponentBridgeContract);
    await expect(
      mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentBridgeContract)
    ).to.revertedWith("HashiConnextAdaptor: bridge already registered");
  });

  it("onlyExecutor", async function () {
    const sigHash = mockHashiConnextAdapterExposure.interface.getSighash("testOnlyExecutor");
    await mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentBridgeContract);
    await hashiExecutor
      .connect(owner)
      .execute(opponentDomain, opponentBridgeContract, mockHashiConnextAdapterExposure.address, sigHash);

    const maliciousHashiExecutor = await HashiExecutor.deploy();
    await maliciousHashiExecutor.connect(owner).initialize();

    await expect(
      maliciousHashiExecutor
        .connect(owner)
        .execute(opponentDomain, opponentBridgeContract, mockHashiConnextAdapterExposure.address, sigHash)
    ).to.revertedWith("HashiExecutor: execute failed");

    await expect(
      hashiExecutor
        .connect(owner)
        .execute(opponentDomain, maliciousOpponentContract, mockHashiConnextAdapterExposure.address, sigHash)
    ).to.revertedWith("HashiExecutor: execute failed");
  });

  it("xCall", async function () {
    await expect(mockHashiConnextAdapterExposure.xcall(opponentDomain, "0x")).to.revertedWith(
      "HashiConnextAdapter: invalid bridge"
    );
    await mockHashiConnextAdapterExposure.connect(owner).setBridgeContract(opponentDomain, opponentBridgeContract);
    await mockHashiConnextAdapterExposure.xcall(opponentDomain, "0x");
  });
});
