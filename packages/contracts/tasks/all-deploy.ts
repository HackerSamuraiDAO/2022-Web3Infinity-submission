import fs from "fs";
import { task } from "hardhat/config";
import path from "path";

import networks from "../networks.json";
import { isChainId } from "../types/network";

task("all-deploy", "deploy").setAction(async (_, { network, run }) => {
  const { config } = network;
  const chainId = config.chainId?.toString();
  if (!isChainId(chainId)) {
    console.log("network invalid");
    return;
  }
  const { domainId, contracts } = networks[chainId];
  const { connext } = contracts;
  const selfDomain = domainId.toString();
  const wrappedNftImplementation = await run("wrapped-nft-impl-deploy");
  const bridge = await run("bridge-deploy", {
    selfDomain,
    connext,
    wrappedNftImplementation,
  });
  networks[chainId].contracts.wrappedNftImplementation = wrappedNftImplementation;
  networks[chainId].contracts.bridge = bridge;
  fs.writeFileSync(path.join(__dirname, "../networks.json"), JSON.stringify(networks));
  console.log("DONE");
});
