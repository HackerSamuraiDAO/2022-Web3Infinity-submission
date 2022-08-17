import { task } from "hardhat/config";

task("sub-executor-deploy", "cmd deploy bridge").setAction(async (_, { ethers }) => {
  const name = "ConnextExecutor";
  const ConnextExecutor = await ethers.getContractFactory(name);
  const connextExecutor = await ConnextExecutor.deploy();
  await connextExecutor.deployed();
  await connextExecutor.initialize();
  console.log(name, "deployed to:", connextExecutor.address);
  return connextExecutor.address;
});
