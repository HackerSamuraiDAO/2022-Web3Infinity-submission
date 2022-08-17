import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

// import { ADDRESS_1, ADDRESS_2, ADDRESS_3, NULL_ADDRESS } from "../lib/constant";
import { ADDRESS_1, ADDRESS_2, BYTE32_1, NULL_ADDRESS } from "../lib/constant";
import {
  Hashi721Bridge,
  HashiExecutor,
  HashiExecutor__factory,
  HashiHandler,
  HashiWrapped721,
  HashiWrapped721__factory,
  MockNFT,
} from "../types/typechain";

describe("Unit Test for Hashi721Bridge", function () {
  let holder: SignerWithAddress;
  let owner: SignerWithAddress;
  let sendTo: SignerWithAddress;
  let malicious: SignerWithAddress;

  let HashiExecutor: HashiExecutor__factory;
  let hashiExecutor: HashiExecutor;
  let hashiHandler: HashiHandler;
  let selfHashi721Bridge: Hashi721Bridge;
  let opponentHashi721Bridge: Hashi721Bridge;

  let HashiWrapped721: HashiWrapped721__factory;
  let hashiWrapped721: HashiWrapped721;
  let depoloyedNFT: HashiWrapped721;
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

    HashiExecutor = <HashiExecutor__factory>await ethers.getContractFactory("HashiExecutor");
    hashiExecutor = <HashiExecutor>await HashiExecutor.deploy();
    const HashiHandler = await ethers.getContractFactory("HashiHandler");
    hashiHandler = <HashiHandler>await HashiHandler.deploy();
    HashiWrapped721 = <HashiWrapped721__factory>await ethers.getContractFactory("HashiWrapped721");
    hashiWrapped721 = <HashiWrapped721>await HashiWrapped721.deploy();
    const Hashi721Bridge = await ethers.getContractFactory("Hashi721Bridge");
    selfHashi721Bridge = <Hashi721Bridge>await Hashi721Bridge.deploy();
    opponentHashi721Bridge = <Hashi721Bridge>await Hashi721Bridge.deploy();

    await hashiExecutor.connect(owner).initialize();
    await hashiHandler.initialize(hashiExecutor.address);
    await hashiWrapped721.connect(owner).initialize();
    await selfHashi721Bridge.initialize(selfDomain, hashiHandler.address, hashiWrapped721.address);
    await opponentHashi721Bridge.initialize(opponentDomain, hashiHandler.address, hashiWrapped721.address);

    const MockNFT = await ethers.getContractFactory("MockNFT");
    mockNFT = <MockNFT>await MockNFT.connect(owner).deploy(baseTokenURL);

    const MockClone = await ethers.getContractFactory("MockClone");
    const mockClone = await MockClone.deploy();

    const salt = ethers.utils.solidityKeccak256(["uint32", "address"], [selfDomain, mockNFT.address]);
    const depoloyedNFTAddress = await mockClone.predictDeterministicAddress(
      hashiWrapped721.address,
      salt,
      opponentHashi721Bridge.address
    );
    depoloyedNFT = HashiWrapped721.attach(depoloyedNFTAddress);
  });

  it("xSend: validateAuthorization", async function () {
    await selfHashi721Bridge.setBridgeContract(opponentDomain, opponentBridgeContract);
    await mockNFT.connect(owner).mint(holder.address);
    await mockNFT.connect(holder).setApprovalForAll(selfHashi721Bridge.address, true);
    await expect(
      selfHashi721Bridge
        .connect(malicious)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, "")
    ).to.revertedWith("Hashi721Bridge: invalid sender");

    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, malicious.address, sendTo.address, mintedTokenId_1, opponentDomain, "")
    ).to.revertedWith("Hashi721Bridge: invalid from");

    await expect(
      selfHashi721Bridge
        .connect(holder)
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, "")
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
      hashiExecutor
        .connect(owner)
        .execute(BYTE32_1, selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_1)
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
      hashiExecutor
        .connect(owner)
        .execute(BYTE32_1, selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_2)
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
        .xSend(mockNFT.address, holder.address, sendTo.address, mintedTokenId_1, opponentDomain, "")
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
      hashiExecutor
        .connect(owner)
        .execute(BYTE32_1, selfDomain, selfBridgeContract, opponentHashi721Bridge.address, xReceiveDataAtOpponent_1)
    )
      .to.emit(depoloyedNFT, "Transfer")
      .withArgs(NULL_ADDRESS, sendTo.address, mintedTokenId_1);

    await expect(
      opponentHashi721Bridge
        .connect(sendTo)
        .xSend(depoloyedNFT.address, sendTo.address, holder.address, mintedTokenId_1, selfDomain, "")
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
      hashiExecutor
        .connect(owner)
        .execute(BYTE32_1, opponentDomain, opponentBridgeContract, selfHashi721Bridge.address, xReceiveDataAtSelf)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(selfHashi721Bridge.address, holder.address, mintedTokenId_1);
  });
});
