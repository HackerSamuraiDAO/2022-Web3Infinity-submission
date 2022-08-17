import { ethers } from "ethers";

import Hashi721Bridge from "../../../../contracts/artifacts/contracts/Hashi721Bridge.sol/Hashi721Bridge.json";
import HashiExecutor from "../../../../contracts/artifacts/contracts/HashiExecutor.sol/HashiExecutor.json";
import HashiHandler from "../../../../contracts/artifacts/contracts/HashiHandler.sol/HashiHandler.json";
import networks from "../../../../contracts/networks.json";
import { ChainId } from "../../../../contracts/types/network";
import { add } from "../../lib/storage";

const blockNumberRange = 500;

/*
 * @dev It is to convert domain id to chain id
 */
const domainToChainId = (domain: number) => {
  const network = Object.entries(networks).find(([, network]) => network.domain === domain);
  if (!network) {
    throw new Error("invalid domain id");
  }
  return network[0] as ChainId;
};

/*
 * @dev currently relayer private key is managed by env
 *      I want to improve private key management security later
 */
const privateKey = process.env.RELAYER_PRIVATE_KEY || "";

/*
 * @dev get call and executed event in all chains
 */
const getEvents = async (chainId: ChainId, blockNumberRange: number) => {
  const network = networks[chainId];
  const provider = new ethers.providers.JsonRpcProvider(network.rpc);
  const handler = new ethers.Contract(network.contracts.handler, HashiHandler.abi, provider);
  const executor = new ethers.Contract(network.contracts.executor, HashiExecutor.abi, provider);
  const blockNumber = await provider.getBlockNumber();
  const handlerFilter = handler.filters.Called();
  const executorFilter = executor.filters.Executed();
  const from = blockNumber - blockNumberRange;
  const to = blockNumber;
  const promises = [handler.queryFilter(handlerFilter, from, to), executor.queryFilter(executorFilter, from, to)];
  const [handlerEvents, executorEvents] = await Promise.all(promises);
  return { chainId, handlerEvents, executorEvents };
};

export const run = async () => {
  /*
   * @dev need better block control for each chain later
   */
  const promises = Object.keys(networks).map((chainId) => {
    return getEvents(chainId as ChainId, blockNumberRange);
  });
  /*
   * @dev assuming only rinkeby and goerli are supported in this order
   *      Handling logic is needed when one more network is added
   */
  const [rinkebyEvents, goerliEvents] = await Promise.all(promises);

  /*
   * @dev Filtering processed events
   *      It is required to skip duplicated tx in destination chain
   *      I want to improve security later
   */
  const rinkebyProcessingEvents = rinkebyEvents.handlerEvents.filter((handlerEvent) => {
    return !goerliEvents.executorEvents.some((executorEvent) => {
      return handlerEvent.transactionHash === executorEvent.args?.hash;
    });
  });
  const goerliProcessingEvents = goerliEvents.handlerEvents.filter((handlerEvent) => {
    return !rinkebyEvents.executorEvents.some((executorEvent) => {
      return handlerEvent.transactionHash === executorEvent.args?.hash;
    });
  });

  const hashi721Interface = new ethers.utils.Interface(Hashi721Bridge.abi);

  /*
   * @dev Filtering invalid ipfs hash in relayer side
   *      It is required to make ipfs as multichain storage layer in our NFTHashi
   *      I want to improve validation schema and algorism for better performance later
   */
  const validatedRinkebyProcessingEvent = [];
  for (const rinkebyProcessingEvent of rinkebyProcessingEvents) {
    const decoded = hashi721Interface.decodeFunctionData("xReceive", rinkebyProcessingEvent.args?.callData);
    const chainId = domainToChainId(decoded.birthChainDomain);
    const expectedTokenURI = await add(chainId, decoded.birthChainNFTContractAddress, decoded.tokenId);
    if (expectedTokenURI === decoded.tokenURI) {
      validatedRinkebyProcessingEvent.push(rinkebyProcessingEvent);
    }
  }
  const validatedGoerliProcessingEvent = [];
  for (const goerliProcessingEvent of goerliProcessingEvents) {
    const decoded = hashi721Interface.decodeFunctionData("xReceive", goerliProcessingEvent.args?.callData);
    const chainId = domainToChainId(decoded.birthChainDomain);
    const expectedTokenURI = await add(chainId, decoded.birthChainNFTContractAddress, decoded.tokenId);
    if (expectedTokenURI === decoded.tokenURI) {
      validatedGoerliProcessingEvent.push(goerliProcessingEvent);
    }
  }
  /*
   * @dev Sending Tx by Executor in destinattion chain
   *      It is to mint bridged NFT in destination chain
   *      I want to improve performance by multicall or merkle tree based validation in cotract side
   */
  const rinkebyNetwork = networks["4"];
  const goerliNetwork = networks["5"];
  const rinkebyProvider = new ethers.providers.JsonRpcProvider(rinkebyNetwork.rpc);
  const goerliProvider = new ethers.providers.JsonRpcProvider(goerliNetwork.rpc);
  const rinkebySigner = new ethers.Wallet(privateKey, rinkebyProvider);
  const goerliSigner = new ethers.Wallet(privateKey, goerliProvider);
  const rinkebyExecutor = new ethers.Contract(rinkebyNetwork.contracts.executor, HashiExecutor.abi, rinkebySigner);
  const goerliExecutor = new ethers.Contract(goerliNetwork.contracts.executor, HashiExecutor.abi, goerliSigner);

  const rinkebyTxPromises = validatedRinkebyProcessingEvent.map((processingEvent) => {
    return goerliExecutor.execute(
      processingEvent.transactionHash,
      rinkebyNetwork.domain,
      rinkebyNetwork.contracts.bridge,
      goerliNetwork.contracts.bridge,
      processingEvent.args?.callData
    );
  });
  const goerliTxPromises = validatedGoerliProcessingEvent.map((processingEvent) => {
    return rinkebyExecutor.execute(
      processingEvent.transactionHash,
      goerliNetwork.domain,
      goerliNetwork.contracts.bridge,
      rinkebyNetwork.contracts.bridge,
      processingEvent.args?.callData
    );
  });
  const txPromises = [...rinkebyTxPromises, ...goerliTxPromises];
  const tx = await Promise.all(txPromises);

  /*
   * @dev Return tx list for reference
   */
  return tx;
};
