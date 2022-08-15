import network from "../../network.json";

export type ChainId = keyof typeof network;

export const isChainId = (chainId: string): chainId is ChainId => {
  return Object.keys(network).includes(chainId);
};
