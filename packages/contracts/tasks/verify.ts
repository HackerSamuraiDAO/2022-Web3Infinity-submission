import { task } from "hardhat/config";

import networks from "../../shared/networks.json";
import { isChainId } from "../../shared/types/network";

task("verify", "verify").setAction(async (_, { network, run }) => {
  const { config } = network;
  const chainId = config.chainId?.toString();
  if (!isChainId(chainId)) {
    console.log("network invalid");
    return;
  }
  const { contracts } = networks[chainId];
  const promises = Object.entries(contracts).map(([name, address]) => {
    return run("verify:verify", {
      address,
      constructorArguments: [],
    }).catch((e) => {
      console.log(name, e.message);
    });
  });
  await Promise.all(promises);
  console.log("DONE");
});
