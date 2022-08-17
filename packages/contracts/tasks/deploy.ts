import fs from "fs";
import { task } from "hardhat/config";
import path from "path";

import networks from "../../shared/networks.json";
import { isChainId } from "../../shared/types/network";

task("deploy", "deploy").setAction(async (_, { network, run }) => {
  const { config } = network;
  const chainId = config.chainId?.toString();
  if (!isChainId(chainId)) {
    console.log("network invalid");
    return;
  }
  const { domainId } = networks[chainId];
  const selfDomain = domainId.toString();
  const wrappedNftImplementation = await run("sub-wrapped-nft-impl-deploy");
  const executor = await run("sub-executor-deploy");
  const handler = await run("sub-handler-deploy", { executor });
  const bridge = await run("sub-bridge-deploy", {
    selfDomain,
    handler,
    wrappedNftImplementation,
  });
  networks[chainId].contracts.wrappedNftImplementation = wrappedNftImplementation;
  networks[chainId].contracts.executor = executor;
  networks[chainId].contracts.handler = handler;
  networks[chainId].contracts.bridge = bridge;
  fs.writeFileSync(path.join(__dirname, "../../shared/networks.json"), JSON.stringify(networks));
  console.log("DONE");
});
