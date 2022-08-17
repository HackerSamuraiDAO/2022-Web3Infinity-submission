import type { NextApiRequest, NextApiResponse } from "next";

import { isChainId } from "../../../../../shared/types/network";
import { addToIpfs, getTokenMetadata } from "../../../lib/storage/index";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId, contractAddress, tokenId } = req.body;
  console.log(chainId, contractAddress, tokenId);
  if (typeof chainId !== "string" || !isChainId(chainId)) {
    return res.status(400).json({ error: "network is invalid" });
  }
  if (typeof contractAddress !== "string") {
    return res.status(400).json({ error: "contract address is invalid" });
  }
  if (typeof tokenId !== "string") {
    return res.status(400).json({ error: "token id is invalid" });
  }
  const metadata = await getTokenMetadata(chainId, contractAddress, tokenId);
  const cid = await addToIpfs(JSON.stringify(metadata));
  res.status(200).json(cid);
}
