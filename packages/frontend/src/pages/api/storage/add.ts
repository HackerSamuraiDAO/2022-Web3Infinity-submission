import type { NextApiRequest, NextApiResponse } from "next";

import { isChainId } from "../../../../../contracts/types/network";
import { add } from "../../../lib/storage/index";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, contractAddress, tokenId } = req.body;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }
  if (typeof chainId !== "string" || !isChainId(chainId)) {
    return res.status(400).json({ error: "network is invalid" });
  }
  if (typeof contractAddress !== "string") {
    return res.status(400).json({ error: "contract address is invalid" });
  }
  if (typeof tokenId !== "string") {
    return res.status(400).json({ error: "token id is invalid" });
  }
  const tokenURI = await add(chainId, contractAddress, tokenId);
  res.status(200).json(tokenURI);
}
