import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_1, BYTE32_1, NULL_ADDRESS } from "../lib/constant";
import { HashiExecutor, MockBridge } from "../types/typechain";

describe("Unit Test for HashiExecutor", function () {
  let owner: SignerWithAddress;
  let malicious: SignerWithAddress;
  let hashiExecutor: HashiExecutor;
  let mockBridge: MockBridge;

  beforeEach(async function () {
    [, owner, malicious] = await ethers.getSigners();
    const HashiExecutor = await ethers.getContractFactory("HashiExecutor");
    hashiExecutor = <HashiExecutor>await HashiExecutor.deploy();
    const MockBridge = await ethers.getContractFactory("MockBridge");
    mockBridge = <MockBridge>await MockBridge.deploy();
    await hashiExecutor.connect(owner).initialize();
  });

  it("initialize", async function () {
    await expect(hashiExecutor.initialize()).to.revertedWith("Initializable: contract is already initialized");
  });

  it("originSender", async function () {
    expect(await hashiExecutor.originSender()).to.equal(NULL_ADDRESS);
  });

  it("origin", async function () {
    expect(await hashiExecutor.origin()).to.equal(0);
  });

  it("execute", async function () {
    const failCalldata = mockBridge.interface.encodeFunctionData("execute", [false]);
    const successCalldata = mockBridge.interface.encodeFunctionData("execute", [true]);

    const originDomain = 1;
    const originSender = ADDRESS_1;
    await expect(
      hashiExecutor
        .connect(malicious)
        .execute(BYTE32_1, originDomain, originSender, mockBridge.address, successCalldata)
    ).to.revertedWith("Ownable: caller is not the owner");

    await expect(
      hashiExecutor.connect(owner).execute(BYTE32_1, originDomain, originSender, mockBridge.address, failCalldata)
    ).to.revertedWith("HashiExecutor: execute failed");

    await expect(
      hashiExecutor.connect(owner).execute(BYTE32_1, originDomain, originSender, mockBridge.address, successCalldata)
    )
      .to.emit(mockBridge, "Called")
      .withArgs(originDomain, originSender);
  });
});
