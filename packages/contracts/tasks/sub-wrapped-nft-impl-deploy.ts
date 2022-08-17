import { task } from "hardhat/config";

task("sub-wrapped-nft-impl-deploy", "cmd deploy wrapped nft").setAction(async (_, { ethers }) => {
  const name = "WrappedHashi721";
  const WrappedHashi721 = await ethers.getContractFactory(name);
  const wrappedHashi721 = await WrappedHashi721.deploy();
  await wrappedHashi721.deployed();
  console.log(name, "deployed to:", wrappedHashi721.address);
  return wrappedHashi721.address;
});
