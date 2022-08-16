import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_1, ADDRESS_2 } from "../lib/constant";
import {
  MockConnextHandler,
  MockConnextHandler__factory,
  MockExecutor,
  MockExecutor__factory,
  MockHashiConnextAdapter,
  MockHashiConnextAdapter__factory,
} from "../../shared/types/typechain";

describe("Unit Test for HashiConnextAdapter", function () {
  let malicious: SignerWithAddress;

  let MockExecutor: MockExecutor__factory;
  let mockExecutor: MockExecutor;
  let mockConnextHandler: MockConnextHandler;
  let mockHashiConnextAdapter: MockHashiConnextAdapter;

  const selfDomain = 0;
  const opponentDomain = 1;

  const opponentContract = ADDRESS_1;

  beforeEach(async function () {
    [, malicious] = await ethers.getSigners();
    const MockConnextHandler = <MockConnextHandler__factory>await ethers.getContractFactory("MockConnextHandler");
    mockConnextHandler = await MockConnextHandler.deploy();
    MockExecutor = <MockExecutor__factory>await ethers.getContractFactory("MockExecutor");
    mockExecutor = await MockExecutor.deploy();
    mockExecutor.setOrigin(opponentDomain);
    mockExecutor.setOriginSender(opponentContract);
    await mockConnextHandler.setExecutor(mockExecutor.address);
    const MockHashiConnextAdapter = <MockHashiConnextAdapter__factory>(
      await ethers.getContractFactory("MockHashiConnextAdapter")
    );
    mockHashiConnextAdapter = await MockHashiConnextAdapter.deploy(selfDomain, mockConnextHandler.address);
  });

  it("getConnext", async function () {
    expect(await mockHashiConnextAdapter.getConnext()).to.equal(mockConnextHandler.address);
  });

  it("getExecutor", async function () {
    expect(await mockHashiConnextAdapter.getExecutor()).to.equal(mockExecutor.address);
  });

  it("getSelfDomain", async function () {
    expect(await mockHashiConnextAdapter.getSelfDomain()).to.equal(selfDomain);
  });

  it("setBridgeContract", async function () {
    await mockHashiConnextAdapter.setBridgeContract(opponentDomain, opponentContract);
    await expect(mockHashiConnextAdapter.setBridgeContract(opponentDomain, opponentContract)).to.revertedWith(
      "HashiConnextAdaptor: bridge already registered"
    );
  });

  it("getBridgeContract", async function () {
    await mockHashiConnextAdapter.setBridgeContract(opponentDomain, opponentContract);
    expect(await mockHashiConnextAdapter.getBridgeContract(opponentDomain)).to.equal(opponentContract);
  });

  it("onlyExecutor", async function () {
    const sigHash = mockHashiConnextAdapter.interface.getSighash("testOnlyExecutor");
    await mockHashiConnextAdapter.setBridgeContract(opponentDomain, opponentContract);
    await mockExecutor.execute(mockHashiConnextAdapter.address, sigHash);

    const malciousMockExecutor = await MockExecutor.deploy();
    await expect(malciousMockExecutor.execute(mockHashiConnextAdapter.address, sigHash)).to.revertedWith(
      "MockExecutor: failed"
    );
  });

  it("xCall", async function () {
    await expect(mockHashiConnextAdapter.testXCall(opponentDomain, "0x")).to.revertedWith(
      "HashiConnextAdapter: invalid bridge"
    );
    await mockHashiConnextAdapter.setBridgeContract(opponentDomain, opponentContract);
    await mockHashiConnextAdapter.testXCall(opponentDomain, "0x");
  });
});
