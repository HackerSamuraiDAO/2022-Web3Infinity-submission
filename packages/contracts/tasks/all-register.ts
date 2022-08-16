import fs from "fs";
import { task } from "hardhat/config";
import path from "path";

import networks from "../networks.json";
import { isChainId } from "../types/network";

const domainVersion = "0";

task("all-register", "integration register").setAction(async (_, { network, run }) => {
  const { config } = network;
  const chainId = config.chainId?.toString();
  if (!isChainId(chainId)) {
    console.log("network invalid");
    return;
  }
  const { contracts } = networks[chainId];
  const { bridge: selfContractAddress } = contracts;
  if (!selfContractAddress) {
    console.log("bridge not deployed");
    return;
  }
  for (const [key, value] of Object.entries(networks)) {
    if (key !== chainId) {
      const { domainId: opponentDomainNum, contracts } = value;
      const { bridge: opponentContractAddress } = contracts;
      const opponentDomain = opponentDomainNum.toString();
      await run("bridge-register", { selfContractAddress, opponentDomain, domainVersion, opponentContractAddress });
    }
  }
  console.log("DONE");
});
