import axios from "axios";
import { ethers } from "ethers";
import { Blob, NFTStorage } from "nft.storage";

import ERC721Artifact from "../../../../shared/artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json";
import networks from "../../../../shared/networks.json";
import { ChainId } from "../../../../shared/types/network";
import { ERC721 } from "../../../../shared/types/typechain";

const nftStorageApiKey = process.env.NFT_STORAGE_API_KEY || "";

export const getTokenMetadata = async (chainId: ChainId, contractAddress: string, tokenId: string) => {
  const network = networks[chainId];
  const provider = new ethers.providers.JsonRpcProvider(network.rpc);
  const erc721 = <ERC721>new ethers.Contract(contractAddress, ERC721Artifact.abi, provider);
  const tokenURI = await erc721.tokenURI(tokenId).catch(() => "");
  console.log("tokenURI", tokenURI);
  if (tokenURI) {
    const { data } = await axios.get(tokenURI);
    return data;
  } else {
    return {};
  }
};

export const addToIpfs = async (data: string) => {
  const client = new NFTStorage({ token: nftStorageApiKey });
  const someData = new Blob([data]);
  const cid = await client.storeBlob(someData);
  return cid;
};
