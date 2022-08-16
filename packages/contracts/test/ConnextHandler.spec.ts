import { expect } from "chai";
import { ethers } from "hardhat";

import { ConnextHandler } from "../../shared/types/typechain";
import { ADDRESS_1, ADDRESS_2, NULL_ADDRESS } from "../lib/constant";

describe("Unit Test for ConnextHandler", function () {
  let connextHandler: ConnextHandler;

  beforeEach(async function () {
    const ConnextHandler = await ethers.getContractFactory("ConnextHandler");
    connextHandler = <ConnextHandler>await ConnextHandler.deploy();
    await connextHandler.initialize(ADDRESS_1);
  });

  it("initialize", async function () {
    await expect(connextHandler.initialize(ADDRESS_1)).to.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  it("executor", async function () {
    expect(await connextHandler.executor()).to.equal(ADDRESS_1);
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

    await expect(connextHandler.xcall(xCallArgs))
      .to.emit(connextHandler, "Called")
      .withArgs(destinationDomain, connextHandler.address, to, callData);
  });
});
