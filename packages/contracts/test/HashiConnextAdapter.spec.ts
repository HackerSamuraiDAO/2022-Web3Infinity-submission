import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_1, ADDRESS_2, NULL_ADDRESS } from "../lib/constant";
import {
  MockConnextHandler,
  MockExecutor,
  MockExecutor__factory,
  MockHashiConnextAdapter,
} from "../typechain-types";

describe("Unit Test for HashiConnextAdapter", function () {
  let malicious: SignerWithAddress;

  let MockExecutor: MockExecutor__factory;
  let mockExecutor: MockExecutor;
  let mockConnextHandler: MockConnextHandler;
  let mockHashiConnextAdapter: MockHashiConnextAdapter;

  const selfDomain = 0;
  const version = 0;
  const opponentDomain = 1;

  const opponentContract = ADDRESS_1;

  const dummyTransactingAssetId = ADDRESS_1;

  beforeEach(async function () {
    [, malicious] = await ethers.getSigners();
    const MockConnextHandler = await ethers.getContractFactory(
      "MockConnextHandler"
    );
    mockConnextHandler = await MockConnextHandler.deploy();
    MockExecutor = await ethers.getContractFactory("MockExecutor");
    mockExecutor = await MockExecutor.deploy();
    mockExecutor.setOrigin(opponentDomain);
    mockExecutor.setOriginSender(opponentContract);
    await mockConnextHandler.setExecutor(mockExecutor.address);
    const MockHashiConnextAdapter = await ethers.getContractFactory(
      "MockHashiConnextAdapter"
    );
    mockHashiConnextAdapter = await MockHashiConnextAdapter.deploy(
      selfDomain,
      mockConnextHandler.address,
      dummyTransactingAssetId
    );
  });

  it("onlyExecutor", async function () {
    const oldVersion = version;
    const newVersion = 1;
    const functionDataForOldVersion =
      mockHashiConnextAdapter.interface.encodeFunctionData("testOnlyExecutor", [
        oldVersion,
      ]);
    await mockHashiConnextAdapter.setBridgeContract(
      opponentDomain,
      oldVersion,
      opponentContract
    );
    await mockExecutor.execute(
      mockHashiConnextAdapter.address,
      functionDataForOldVersion
    );

    const malciousMockExecutor = await MockExecutor.deploy();
    await expect(
      malciousMockExecutor.execute(
        mockHashiConnextAdapter.address,
        functionDataForOldVersion
      )
    ).to.revertedWith("MockExecutor: failed");
    const mistakeContract = ADDRESS_2;
    await mockHashiConnextAdapter.setBridgeContract(
      opponentDomain,
      newVersion,
      mistakeContract
    );
    const functionDataForNewVersion =
      mockHashiConnextAdapter.interface.encodeFunctionData("testOnlyExecutor", [
        newVersion,
      ]);
    await expect(
      mockExecutor.execute(
        mockHashiConnextAdapter.address,
        functionDataForNewVersion
      )
    ).to.revertedWith("MockExecutor: failed");
  });

  it("xCall", async function () {
    await expect(
      mockHashiConnextAdapter.testXCall(opponentDomain, version, "0x")
    ).to.revertedWith("HashiConnextAdapter: invalid bridge");
    await mockHashiConnextAdapter.setBridgeContract(
      opponentDomain,
      version,
      opponentContract
    );
    await mockHashiConnextAdapter.testXCall(opponentDomain, version, "0x");
  });
});
