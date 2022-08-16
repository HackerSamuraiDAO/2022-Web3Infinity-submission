import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ADDRESS_1, NULL_ADDRESS } from "../lib/constant";
import {
  Hashi721Bridge,
  Hashi721Bridge__factory,
  MockClone,
  MockClone__factory,
  MockExecutor,
  MockExecutor__factory,
  MockNFT,
  MockNFT__factory,
  WrappedHashi721,
  WrappedHashi721__factory,
} from "../../shared/types/typechain";

describe("Unit Test for Hashi721Bridge", function () {
  let signer: SignerWithAddress;
  let other: SignerWithAddress;
  let malicious: SignerWithAddress;

  let hashi721Bridge: Hashi721Bridge;
  let mockExecutor: MockExecutor;
  let WrappedHashi721: WrappedHashi721__factory;
  let wrappedHashi721: WrappedHashi721;
  let mockNFT: MockNFT;
  let mockClone: MockClone;

  const baseTokenURL = "http://localhost:3000/";

  const selfDomain = 0;
  const version = 0;

  beforeEach(async function () {
    [signer, other, malicious] = await ethers.getSigners();

    const MockConnextHandler = await ethers.getContractFactory("MockConnextHandler");
    const mockConnextHandler = await MockConnextHandler.deploy();

    const MockExecutor = <MockExecutor__factory>await ethers.getContractFactory("MockExecutor");
    mockExecutor = await MockExecutor.deploy();
    await mockConnextHandler.setExecutor(mockExecutor.address);

    WrappedHashi721 = <WrappedHashi721__factory>await ethers.getContractFactory("WrappedHashi721");
    wrappedHashi721 = await WrappedHashi721.deploy();

    const Hashi721Bridge = <Hashi721Bridge__factory>await ethers.getContractFactory("Hashi721Bridge");
    hashi721Bridge = await Hashi721Bridge.deploy();
    await hashi721Bridge.initialize(selfDomain, mockConnextHandler.address, wrappedHashi721.address);
    const MockNFT = <MockNFT__factory>await ethers.getContractFactory("MockNFT");
    mockNFT = await MockNFT.deploy(baseTokenURL);
    await mockNFT.mint(signer.address);
    await mockNFT.mint(signer.address);
    await mockNFT.setApprovalForAll(hashi721Bridge.address, true);

    const MockClone = <MockClone__factory>await ethers.getContractFactory("MockClone");
    mockClone = await MockClone.deploy();
  });

  it("xSend - sender is in birth chain and other tests", async function () {
    const tokenId_1 = "0";
    const tokenId_2 = "1";
    const sendToDomain = "1";
    const toContract = ADDRESS_1;
    await hashi721Bridge.setBridgeContract(sendToDomain, version, toContract);

    // Error: NFTs are not approved
    await mockNFT.mint(other.address);
    await expect(
      hashi721Bridge
        .connect(other)
        .xSend(mockNFT.address, malicious.address, ADDRESS_1, tokenId_1, sendToDomain, version, true)
    ).to.revertedWith("Hashi721Bridge: invalid sender");

    // Error: Sender is not an owner of NFTs
    await expect(
      hashi721Bridge.xSend(mockNFT.address, malicious.address, ADDRESS_1, tokenId_1, sendToDomain, version, true)
    ).to.revertedWith("Hashi721Bridge: invalid from");

    // Successful:  isTokenURIIncluded == true
    await expect(
      hashi721Bridge.xSend(mockNFT.address, signer.address, ADDRESS_1, tokenId_1, sendToDomain, version, true)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(signer.address, hashi721Bridge.address, tokenId_1);

    // Successful:  isTokenURIIncluded == false
    await expect(
      hashi721Bridge.xSend(mockNFT.address, signer.address, ADDRESS_1, tokenId_2, sendToDomain, version, false)
    )
      .to.emit(mockNFT, "Transfer")
      .withArgs(signer.address, hashi721Bridge.address, tokenId_2);
  });

  // this is separated test because it requires receiving asset first
  it("xSend - sender is not in birth chain", async function () {
    const tokenId = "0";
    const birthDomain = "1";
    const otherDomain = "2";
    const fromDomain = birthDomain;
    const fromContract = ADDRESS_1;

    await hashi721Bridge.setBridgeContract(fromDomain, version, fromContract);
    await mockExecutor.setOriginSender(fromContract);
    await mockExecutor.setOrigin(fromDomain);

    const data = hashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      signer.address,
      tokenId,
      birthDomain,
      version,
      baseTokenURL,
    ]);

    await mockExecutor.execute(hashi721Bridge.address, data);
    const salt = ethers.utils.solidityKeccak256(["uint32", "address"], [birthDomain, mockNFT.address]);
    const deployedContractAddress = await mockClone.predictDeterministicAddress(
      wrappedHashi721.address,
      salt,
      hashi721Bridge.address
    );
    const deployedContract = WrappedHashi721.attach(deployedContractAddress);

    // Error: Domain isn't resisterd
    await expect(
      hashi721Bridge.xSend(deployedContract.address, signer.address, ADDRESS_1, tokenId, otherDomain, version, true)
    ).to.revertedWith("Hashi721Bridge: invalid destination domain");

    // Successfull
    await expect(
      hashi721Bridge.xSend(deployedContract.address, signer.address, ADDRESS_1, tokenId, fromDomain, version, true)
    )
      .to.emit(deployedContract, "Transfer")
      .withArgs(signer.address, NULL_ADDRESS, tokenId);
  });

  it("xReceive - receiver is in birth chain", async function () {
    const sendToDomain = "1";
    const tokenId = "0";
    const toContract = ADDRESS_1;
    await hashi721Bridge.setBridgeContract(sendToDomain, version, toContract);
    await hashi721Bridge.xSend(mockNFT.address, signer.address, ADDRESS_1, tokenId, sendToDomain, version, true);
    const birthDomain = selfDomain;
    const fromDomain = "1";
    const maliciousDomain = "2";
    const fromContract = ADDRESS_1;
    const data_1 = hashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      signer.address,
      tokenId,
      birthDomain,
      version,
      baseTokenURL,
    ]);
    await mockExecutor.setOriginSender(fromContract);

    //  Error: Tx was sent from not valid domain
    await mockExecutor.setOrigin(maliciousDomain);
    await expect(mockExecutor.execute(hashi721Bridge.address, data_1)).to.revertedWith("MockExecutor: failed");

    //  Error: Tx was sent from not valid version
    await mockExecutor.setOrigin(fromDomain);
    const maliciousVersion = "99";
    const maliciousData_1 = hashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      signer.address,
      tokenId,
      birthDomain,
      maliciousVersion,
      baseTokenURL,
    ]);
    await expect(mockExecutor.execute(hashi721Bridge.address, maliciousData_1)).to.revertedWith("MockExecutor: failed");

    //  Successfull
    await mockExecutor.execute(hashi721Bridge.address, data_1);
    expect(await mockNFT.ownerOf(tokenId)).to.equal(signer.address);

    await mockNFT.transferFrom(signer.address, hashi721Bridge.address, tokenId);
    await expect(mockExecutor.execute(hashi721Bridge.address, data_1)).to.revertedWith("MockExecutor: failed");
  });

  it("xReceive - receiver is not in birth chain", async function () {
    const tokenId_1 = "0";
    const tokenId_2 = "1";
    const birthDomain = "1";
    const fromDomain = "2";
    const fromContract = ADDRESS_1;

    await hashi721Bridge.setBridgeContract(fromDomain, version, fromContract);

    await mockExecutor.setOriginSender(fromContract);
    await mockExecutor.setOrigin(fromDomain);

    const salt = ethers.utils.solidityKeccak256(["uint32", "address"], [birthDomain, mockNFT.address]);
    const deployedContractAddress = await mockClone.predictDeterministicAddress(
      wrappedHashi721.address,
      salt,
      hashi721Bridge.address
    );
    const deployedContract = wrappedHashi721.attach(deployedContractAddress);

    // Successful: WrapedHashiNFT isn't exist
    const data_1 = hashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      signer.address,
      tokenId_1,
      birthDomain,
      version,
      baseTokenURL,
    ]);
    await mockExecutor.execute(hashi721Bridge.address, data_1);
    expect(await deployedContract.ownerOf(tokenId_1)).to.equal(signer.address);

    // Successfull: WrapedHashiNFT is exist
    const data_2 = hashi721Bridge.interface.encodeFunctionData("xReceive", [
      mockNFT.address,
      signer.address,
      tokenId_2,
      birthDomain,
      version,
      baseTokenURL,
    ]);
    await mockExecutor.execute(hashi721Bridge.address, data_2);
    expect(await deployedContract.ownerOf(tokenId_2)).to.equal(signer.address);
  });
});
