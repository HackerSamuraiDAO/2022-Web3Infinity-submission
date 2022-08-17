import { task } from "hardhat/config";

task("sub-handler-deploy", "cmd deploy bridge")
  .addParam("executor", "executor")
  .setAction(async ({ executor }, { ethers }) => {
    const name = "ConnextHandler";
    const ConnextHandler = await ethers.getContractFactory(name);
    const connextHandler = await ConnextHandler.deploy();
    await connextHandler.deployed();
    await connextHandler.initialize(executor);
    console.log(name, "deployed to:", connextHandler.address);
    return connextHandler.address;
  });
