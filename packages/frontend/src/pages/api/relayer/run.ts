import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

import HandlerArtifact from "../../../../../shared/artifacts/contracts/ConnextHandler.sol/ConnextHandler.json";
import { isChainId } from "../../../../../shared/types/network";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chainId } = req.body;
  if (typeof chainId !== "string" || !isChainId(chainId)) {
    return res.status(400).json({ error: "network is invalid" });
  }

  res.status(200).json("");
}
