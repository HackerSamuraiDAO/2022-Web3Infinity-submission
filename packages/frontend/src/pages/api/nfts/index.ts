import type { NextApiRequest, NextApiResponse } from "next";

import { isChainId } from "../../../../../contracts/types/network";
import { getNFTs } from "../../../lib/moralis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, address } = req.query;
  if (typeof chainId !== "string" || !isChainId(chainId)) {
    return res.status(400).json({ error: "network is invalid" });
  }
  if (typeof address !== "string") {
    return res.status(400).json({ error: "address is invalid" });
  }
  const nfts = await getNFTs(chainId, address);
  res.status(200).json(nfts);
}
