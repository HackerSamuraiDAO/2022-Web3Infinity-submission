import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ConnextExecutor, MockBridge } from "../../shared/types/typechain";
import { ADDRESS_1, NULL_ADDRESS } from "../lib/constant";

describe("Unit Test for ConnextExecutor", function () {
  let owner: SignerWithAddress;
  let malicious: SignerWithAddress;
  let connextExecutor: ConnextExecutor;
  let mockBridge: MockBridge;

  beforeEach(async function () {
    [, owner, malicious] = await ethers.getSigners();
    const ConnextExecutor = await ethers.getContractFactory("ConnextExecutor");
    connextExecutor = <ConnextExecutor>await ConnextExecutor.deploy();
    const MockBridge = await ethers.getContractFactory("MockBridge");
    mockBridge = <MockBridge>await MockBridge.deploy();
    await connextExecutor.connect(owner).initialize();
  });

  it("initialize", async function () {
    await expect(connextExecutor.initialize()).to.revertedWith("Initializable: contract is already initialized");
  });

  it("originSender", async function () {
    expect(await connextExecutor.originSender()).to.equal(NULL_ADDRESS);
  });

  it("origin", async function () {
    expect(await connextExecutor.origin()).to.equal(0);
  });

  it("execute", async function () {
    const failCalldata = mockBridge.interface.encodeFunctionData("execute", [false]);
    const successCalldata = mockBridge.interface.encodeFunctionData("execute", [true]);

    const originDomain = 1;
    const originSender = ADDRESS_1;
    await expect(
      connextExecutor.connect(malicious).execute(originDomain, originSender, mockBridge.address, successCalldata)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      connextExecutor.connect(owner).execute(originDomain, originSender, mockBridge.address, failCalldata)
    ).to.revertedWith("ConnextExecutor: execute failed");

    await expect(
      connextExecutor.connect(owner).execute(originDomain, originSender, mockBridge.address, successCalldata)
    )
      .to.emit(mockBridge, "Called")
      .withArgs(originDomain, originSender);
  });
});
