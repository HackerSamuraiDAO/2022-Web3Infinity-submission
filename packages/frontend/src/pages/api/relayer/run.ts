import type { NextApiRequest, NextApiResponse } from "next";

import { run } from "../../../lib/relayer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await run();
  res.status(200).json(result);
}
