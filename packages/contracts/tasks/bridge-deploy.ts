import { task } from "hardhat/config";

task("bridge-deploy", "cmd deploy bridge")
  .addParam("selfDomain", "self domain")
  .addParam("connext", "connext")
  .addParam("wrappedNftImplementation", "nft implementation")
  .setAction(async ({ selfDomain, connext, wrappedNftImplementation }, { ethers }) => {
    const Hashi721Bridge = await ethers.getContractFactory("Hashi721Bridge");
    const hashi721Bridge = await Hashi721Bridge.deploy();
    await hashi721Bridge.deployed();
    await hashi721Bridge.initialize(selfDomain, connext, wrappedNftImplementation);
    console.log("Deployed to: ", hashi721Bridge.address);
    return hashi721Bridge.address;
  });
