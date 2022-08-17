import { ethers } from "ethers";

import HashiExecutor from "../../../../shared/artifacts/contracts/HashiExecutor.sol/HashiExecutor.json";
import HashiHandler from "../../../../shared/artifacts/contracts/HashiHandler.sol/HashiHandler.json";
import networks from "../../../../shared/networks.json";
import { ChainId } from "../../../../shared/types/network";

const privateKey = process.env.RELAYER_PRIVATE_KEY || "";

const getEvents = async (chainId: ChainId) => {
  const network = networks[chainId];
  const provider = new ethers.providers.JsonRpcProvider(network.rpc);
  const handler = new ethers.Contract(network.contracts.handler, HashiHandler.abi, provider);
  const executor = new ethers.Contract(network.contracts.executor, HashiExecutor.abi, provider);
  const blockNumber = await provider.getBlockNumber();
  const handlerFilter = handler.filters.Called();
  const executorFilter = executor.filters.Executed();
  const promises = [
    handler.queryFilter(handlerFilter, 0, blockNumber),
    executor.queryFilter(executorFilter, 0, blockNumber),
  ];
  const [handlerEvents, executorEvents] = await Promise.all(promises);
  return { chainId, handlerEvents, executorEvents };
};

export const run = async () => {
  const promises = Object.keys(networks).map((chainId) => {
    return getEvents(chainId as ChainId);
  });
  /*
   * @dev assuming only rinkeby and goerli are supported in this order
   */
  const [rinkebyEvents, goerliEvents] = await Promise.all(promises);

  /*
   * @dev need to add better filter later
   */
  const rinkebyProcessingEvents = rinkebyEvents.handlerEvents.filter((handlerEvent) => {
    return !goerliEvents.executorEvents.some((executorEvent) => {
      return executorEvent.args?.callData === handlerEvent.args?.callData;
    });
  });
  const goerliProcessingEvents = goerliEvents.handlerEvents.filter((handlerEvent) => {
    return !rinkebyEvents.executorEvents.some((executorEvent) => {
      return executorEvent.args?.callData === handlerEvent.args?.callData;
    });
  });

  const rinkebyNetwork = networks["4"];
  const goerliNetwork = networks["5"];
  const rinkebyProvider = new ethers.providers.JsonRpcProvider(rinkebyNetwork.rpc);
  const goerliProvider = new ethers.providers.JsonRpcProvider(goerliNetwork.rpc);
  const rinkebySigner = new ethers.Wallet(privateKey, rinkebyProvider);
  const goerliSigner = new ethers.Wallet(privateKey, goerliProvider);
  const rinkebyExecutor = new ethers.Contract(rinkebyNetwork.contracts.executor, HashiExecutor.abi, rinkebySigner);
  const goerliExecutor = new ethers.Contract(goerliNetwork.contracts.executor, HashiExecutor.abi, goerliSigner);

  const rinkebyTxPromises = rinkebyProcessingEvents.map((processingEvent) => {
    return goerliExecutor.execute(
      rinkebyNetwork.domain,
      rinkebyNetwork.contracts.bridge,
      goerliNetwork.contracts.bridge,
      processingEvent.args?.callData
    );
  });
  const goerliTxPromises = goerliProcessingEvents.map((processingEvent) => {
    return rinkebyExecutor.execute(
      goerliNetwork.domain,
      goerliNetwork.contracts.bridge,
      rinkebyNetwork.contracts.bridge,
      processingEvent.args?.callData
    );
  });
  const txPromises = [...rinkebyTxPromises, ...goerliTxPromises];
  const tx = await Promise.all(txPromises);
  return tx;
};
