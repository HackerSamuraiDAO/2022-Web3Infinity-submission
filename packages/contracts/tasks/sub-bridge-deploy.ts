import { task } from "hardhat/config";

task("sub-bridge-deploy", "cmd deploy bridge")
  .addParam("selfDomain", "self domain")
  .addParam("handler", "handler")
  .addParam("wrappedNftImplementation", "nft implementation")
  .setAction(async ({ selfDomain, handler, wrappedNftImplementation }, { ethers }) => {
    const name = "Hashi721Bridge";
    const Hashi721Bridge = await ethers.getContractFactory(name);
    const hashi721Bridge = await Hashi721Bridge.deploy();
    await hashi721Bridge.deployed();
    await hashi721Bridge.initialize(selfDomain, handler, wrappedNftImplementation);
    console.log(name, "deployed to:", hashi721Bridge.address);
    return hashi721Bridge.address;
  });
