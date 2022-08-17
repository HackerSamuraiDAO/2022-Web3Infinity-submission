import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_1, ADDRESS_2, NULL_ADDRESS } from "../lib/constant";
import { HashiHandler } from "../types/typechain";

describe("Unit Test for HashiHandler", function () {
  let hashiHandler: HashiHandler;

  beforeEach(async function () {
    const HashiHandler = await ethers.getContractFactory("HashiHandler");
    hashiHandler = <HashiHandler>await HashiHandler.deploy();
    await hashiHandler.initialize(ADDRESS_1);
  });

  it("initialize", async function () {
    await expect(hashiHandler.initialize(ADDRESS_1)).to.revertedWith("Initializable: contract is already initialized");
  });

  it("executor", async function () {
    expect(await hashiHandler.executor()).to.equal(ADDRESS_1);
  });

  it("xcall", async function () {
    const destinationDomain = 1;
    const to = ADDRESS_2;
    const callData = "0x01";
    const xCallArgs = {
      params: {
        to,
        callData,
        originDomain: 0,
        destinationDomain,
        agent: NULL_ADDRESS,
        recovery: NULL_ADDRESS,
        forceSlow: false,
        receiveLocal: false,
        callback: NULL_ADDRESS,
        callbackFee: 0,
        relayerFee: 0,
        slippageTol: 9995,
      },
      transactingAssetId: NULL_ADDRESS,
      amount: 0,
    };

    await expect(hashiHandler.xcall(xCallArgs))
      .to.emit(hashiHandler, "Called")
      .withArgs(destinationDomain, to, callData);
  });
});
