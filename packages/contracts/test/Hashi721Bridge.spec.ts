import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  ConnextExecutor,
  ConnextExecutor__factory,
  ConnextHandler,
  Hashi721Bridge,
  MockNFT,
  WrappedHashi721,
  WrappedHashi721__factory,
} from "../../shared/types/typechain";
// import { ADDRESS_1, ADDRESS_2, ADDRESS_3, NULL_ADDRESS } from "../lib/constant";
import { ADDRESS_1, ADDRESS_2, NULL_ADDRESS } from "../lib/constant";

describe("Unit Test for Hashi721Bridge", function () {
  let holder: SignerWithAddress;
  let owner: SignerWithAddress;
  let sendTo: SignerWithAddress;
  let malicious: SignerWithAddress;

  let ConnextExecutor: ConnextExecutor__factory;
  let connextExecutor: ConnextExecutor;
  let connextHandler: ConnextHandler;
  let selfHashi721Bridge: Hashi721Bridge;
  let opponentHashi721Bridge: Hashi721Bridge;

  let WrappedHashi721: WrappedHashi721__factory;
  let wrappedHashi721: WrappedHashi721;
  let depoloyedNFT: WrappedHashi721;
  let mockNFT: MockNFT;

  const selfDomain = 0;
  const opponentDomain = 1;
  // const maliciousDomain = 2;
  const selfBridgeContract = ADDRESS_1;
  const opponentBridgeContract = ADDRESS_2;
  // const maliciousContract = ADDRESS_3;

  const baseTokenURL = "http://localhost:3000/";

  const mintedTokenId_1 = "0";
  const mintedTokenId_2 = "1";
  // const mintedTokenId_3 = "0";

  beforeEach(async function () {
    [, holder, owner, sendTo, malicious] = await ethers.getSigners();

    ConnextExecutor = <ConnextExecutor__factory>await ethers.getContractFactory("ConnextExecutor");
    connextExecutor = <ConnextExecutor>await ConnextExecutor.deploy();
    const ConnextHandler = await ethers.getContractFactory("ConnextHandler");
    connextHandler = <ConnextHandler>await ConnextHandler.deploy();
    WrappedHashi721 = <WrappedHashi721__factory>await ethers.getContractFactory("WrappedHashi721");
    wrappedHashi721 = <WrappedHashi721>await WrappedHashi721.deploy();
    const Hashi721Bridge = await ethers.getContractFactory("Hashi721Bridge");
    selfHashi721Bridge = <Hashi721Bridge>await Hashi721Bridge.deploy();
    opponentHashi721Bridge = <Hashi721Bridge>await Hashi721Bridge.deploy();

    await connextExecutor.connect(owner).initialize();
    await connextHandler.initialize(connextExecutor.address);
    await wrappedHashi721.connect(owner).initialize();
    await selfHashi721Bridge.initialize(selfDomain, connextHandler.address, wrappedHashi721.address);
    await opponentHashi721Bridge.initialize(opponentDomain, connextHandler.address, wrappedHashi721.address);

    const MockNFT = await ethers.getContractFactory("MockNFT");
    mockNFT = <MockNFT>await MockNFT.connect(owner).deploy(baseTokenURL);

    const MockClone = await ethers.getContractFactory("MockClone");
    const mockClone = await MockClone.deploy();

    const salt = ethers.utils.solidityKeccak256(["uint32", "address"], [selfDomain, mockNFT.address]);
    const depoloyedNFTAddress = await mockClone.predictDeterministicAddress(
      wrappedHashi721.address,
      salt,
      opponentHashi721Bridge.address
    );
    depoloyedNFT = WrappedHashi721.attach(depoloyedNFTAddress);
  });

  it("xSend: validateAuthorization", async function () {
    await selfHashi721Bridge.setBridgeContract(opponentDomain, opponentBridgeContract);
    await mockNFT.connect(owner).mint(holder.address);
    await mockNFT.connect(holder).setApprovalForAll(selfHashi721Bridge.address, true);
    await expect(
      selfHashi721Bridge
        .connect(malicious)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, false)
    ).to.revertedWith("Hashi721Bridge: invalid sender");

    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, malicious.address, sendTo.address, mintedTokenId_1, opponentDomain, false)
    ).to.revertedWith("Hashi721Bridge: invalid from");

    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, false)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(holder.address, selfHashi721Bridge.address, mintedTokenId_1);
  });

  it("xSend: isTokenURIIncluded is true", async function () {
    await selfHashi721Bridge.setBridgeContract(opponentDomain, opponentBridgeContract);
    await mockNFT.connect(owner).mint(holder.address);
    await mockNFT.connect(holder).setApprovalForAll(selfHashi721Bridge.address, true);
    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, true)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(holder.address, selfHashi721Bridge.address, mintedTokenId_1);
  });

  it("xRecieve: NFT is already deployed", async function () {
    await opponentHashi721Bridge.setBridgeContract(selfDomain, selfBridgeContract);
    await mockNFT.connect(owner).mint(holder.address);
    await mockNFT.connect(holder).setApprovalForAll(selfHashi721Bridge.address, true);
    const xReceiveDataAtOpponent_1 = opponentHashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      sendTo.address,
      mintedTokenId_1,
      selfDomain,
      "",
    ]);

    await expect(
      connextExecutor
        .connect(owner)
        .execute(selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_1)
    )
      .to.emit(depoloyedNFT, "Transfer")
      .withArgs(NULL_ADDRESS, sendTo.address, mintedTokenId_1);

    const xReceiveDataAtOpponent_2 = opponentHashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      sendTo.address,
      mintedTokenId_2,
      selfDomain,
      "",
    ]);

    await expect(
      connextExecutor
        .connect(owner)
        .execute(selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_2)
    )
      .to.emit(depoloyedNFT, "Transfer")
      .withArgs(NULL_ADDRESS, sendTo.address, mintedTokenId_2);
  });

  it("integration: selfDomain -> opponentDomain -> selfDomain -> opponentDomain", async function () {
    await selfHashi721Bridge.setBridgeContract(opponentDomain, opponentBridgeContract);
    await opponentHashi721Bridge.setBridgeContract(selfDomain, selfBridgeContract);

    await mockNFT.connect(owner).mint(holder.address);
    await mockNFT.connect(holder).setApprovalForAll(selfHashi721Bridge.address, true);
    await mockNFT.connect(sendTo).setApprovalForAll(opponentHashi721Bridge.address, true);

    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, false)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(holder.address, selfHashi721Bridge.address, mintedTokenId_1);

    const xReceiveDataAtOpponent_1 = opponentHashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      sendTo.address,
      mintedTokenId_1,
      selfDomain,
      "",
    ]);

    await expect(
      connextExecutor
        .connect(owner)
        .execute(selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_1)
    )
      .to.emit(depoloyedNFT, "Transfer")
      .withArgs(NULL_ADDRESS, sendTo.address, mintedTokenId_1);

    await expect(
      opponentHashi721Bridge
        .connect(sendTo)
        .xSend(depoloyedNFT.address, sendTo.address, holder.address, mintedTokenId_1, selfDomain, false)
    )
      .to.emit(depoloyedNFT, "Transfer")
      .withArgs(sendTo.address, NULL_ADDRESS, mintedTokenId_1);

    const xReceiveDataAtSelf = opponentHashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      holder.address,
      mintedTokenId_1,
      selfDomain,
      "",
    ]);
    await expect(
      connextExecutor
        .connect(owner)
        .execute(opponentDomain, opponentBridgeContract, selfHashi721Bridge.address, xReceiveDataAtSelf)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(selfHashi721Bridge.address, holder.address, mintedTokenId_1);
  });
});
