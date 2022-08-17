import axios from "axios";
import { ethers } from "ethers";
import { Blob, NFTStorage } from "nft.storage";

import ERC721Artifact from "../../../../contracts/artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json";
import networks from "../../../../contracts/networks.json";
import { ChainId } from "../../../../contracts/types/network";

/*
 * @dev currently nft storage api key is managed by env
 *      I want to add function to use user api key instead to reduce management cost
 */
const nftStorageApiKey = process.env.NFT_STORAGE_API_KEY || "";

/*
 * @dev: Get metadata from token and add to IPFS
 */
export const add = async (chainId: ChainId, contractAddress: string, tokenId: string) => {
  const metadata = await getTokenMetadata(chainId, contractAddress, tokenId);
  const cid = await addToIpfs(JSON.stringify(metadata));
  return `ipfs://${cid}`;
};

/*
 * @dev: Get token tokenURI from contract then get metadata from it
 *       I want to add image to ipfs later for better decentralization
 */
export const getTokenMetadata = async (chainId: ChainId, contractAddress: string, tokenId: string) => {
  const network = networks[chainId];
  const provider = new ethers.providers.JsonRpcProvider(network.rpc);
  const erc721 = new ethers.Contract(contractAddress, ERC721Artifact.abi, provider);
  const tokenURI = await erc721.tokenURI(tokenId).catch(() => "");
  if (tokenURI) {
    const { data } = await axios.get(tokenURI).catch(() => {
      return { data: {} };
    });
    return data;
  } else {
    return {};
  }
};

/*
 * @dev: Adding content to IPFS
 */
export const addToIpfs = async (data: string) => {
  const client = new NFTStorage({ token: nftStorageApiKey });
  const someData = new Blob([data]);
  const cid = await client.storeBlob(someData);
  return cid;
};
