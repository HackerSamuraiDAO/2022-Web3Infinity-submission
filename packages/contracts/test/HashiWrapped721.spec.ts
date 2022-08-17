import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { NULL_ADDRESS } from "../lib/constant";
import { HashiWrapped721, HashiWrapped721__factory } from "../types/typechain";

describe("Unit Test for HashiWrapped721", function () {
  let signer: SignerWithAddress;
  let malicious: SignerWithAddress;
  let hashiWrapped721: HashiWrapped721;

  const baseURI = "http://localhost:3000/";

  beforeEach(async function () {
    [signer, malicious] = await ethers.getSigners();
    const HashiWrapped721 = <HashiWrapped721__factory>await ethers.getContractFactory("HashiWrapped721");
    hashiWrapped721 = await HashiWrapped721.deploy();
  });

  it("initialize", async function () {
    await hashiWrapped721.initialize();
    await expect(hashiWrapped721.initialize()).to.revertedWith("Initializable: contract is already initialized");
  });

  it("mint", async function () {
    const tokenId_1 = 0;
    const tokenId_2 = 1;
    const tokenURI = `${baseURI}${tokenId_1}`;
    await hashiWrapped721.initialize();
    await expect(hashiWrapped721.connect(malicious).mint(signer.address, tokenId_1, tokenURI)).to.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(hashiWrapped721.mint(signer.address, tokenId_1, tokenURI))
      .to.emit(hashiWrapped721, "Transfer")
      .withArgs(NULL_ADDRESS, signer.address, tokenId_1);

    await expect(hashiWrapped721.mint(signer.address, tokenId_2, ""))
      .to.emit(hashiWrapped721, "Transfer")
      .withArgs(NULL_ADDRESS, signer.address, tokenId_2);
  });

  it("burn", async function () {
    const tokenId = 0;
    const tokenURI = `${baseURI}${tokenId}`;
    await hashiWrapped721.initialize();
    await hashiWrapped721.mint(signer.address, tokenId, tokenURI);
    await expect(hashiWrapped721.connect(malicious).burn(tokenId)).to.revertedWith("Ownable: caller is not the owner");
    await expect(hashiWrapped721.burn(tokenId))
      .to.emit(hashiWrapped721, "Transfer")
      .withArgs(signer.address, NULL_ADDRESS, tokenId);
  });

  it("tokenURI", async function () {
    const tokenId = 0;
    const tokenURI = `${baseURI}${tokenId}`;
    await hashiWrapped721.initialize();
    await hashiWrapped721.mint(signer.address, tokenId, tokenURI);
    expect(await hashiWrapped721.tokenURI(tokenId)).to.equal(tokenURI);
  });

  it("supportsInterface", async function () {
    const hashiWrapped721InterfaceId = "0x10430810";
    const erc721InterfaceId = "0x80ac58cd";
    expect(await hashiWrapped721.supportsInterface(hashiWrapped721InterfaceId)).to.equal(true);
    expect(await hashiWrapped721.supportsInterface(erc721InterfaceId)).to.equal(true);
  });
});
