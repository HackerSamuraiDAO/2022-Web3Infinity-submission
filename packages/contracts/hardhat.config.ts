import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import * as dotenv from "dotenv";

import "./tasks/all-deploy";
import "./tasks/all-register";
import "./tasks/bridge-deploy";
import "./tasks/bridge-register";
import "./tasks/wrapped-nft-impl-deploy";

import networks from "./networks.json";

dotenv.config();

const accounts = process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.15",
  networks: {
    hardhat: process.env.FORK_RINKEBY
      ? {
          forking: {
            url: networks["4"].rpc,
          },
        }
      : {},
    rinkeby: {
      chainId: 4,
      url: networks["4"].rpc,
      accounts,
    },
    goerli: {
      chainId: 5,
      url: networks["5"].rpc,
      accounts,
    },
  },
};

export default config;
