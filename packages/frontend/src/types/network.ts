import network from "../../network.json";

export type ChainId = keyof typeof network;

export const isChainId = (chainId?: string | number): chainId is ChainId => {
  if (!chainId) {
    return false;
  }
  return Object.keys(network).includes(String(chainId));
};
