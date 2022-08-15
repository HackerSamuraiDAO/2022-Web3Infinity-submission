import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import { getNFTs } from "../../lib/moralis";
import { isChainId } from "../../types/network";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("called");
  const { chainId, address } = req.body;
  console.log(chainId, address);
  if (typeof address !== "string" || !ethers.utils.isAddress(address)) {
    return res.status(400).json({ error: "query user address is invalid" });
  }
  if (typeof chainId !== "string" || !isChainId(chainId)) {
    return res.status(400).json({ error: "query network is invalid" });
  }
  const nfts = await getNFTs(chainId, address);
  res.status(200).json(nfts);
}
