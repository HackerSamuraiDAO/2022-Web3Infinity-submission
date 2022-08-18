# NFTHashi 2022 Web3 Inifinity Hackathon Edition

![Key Visital](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/packages/frontend/public/img/brands/key-visual.png)

## Submit

https://devpost.com/software/vnfts

## Works

### Deployed Contract

All contracts are kept here and verified in etherscan
https://github.com/nfthashi/2022-Web3Infinity-submission/blob/main/packages/contracts/networks.json

Following are the main contract developped in this hackathon.

- Hanlder

  - https://rinkeby.etherscan.io/address/0x1F506545E846a613f78FD8493544fc6676a9E251#code

- Executor

  - https://rinkeby.etherscan.io/address/0x4c0e868594D621Ed81F2dC2071e5B0066D384b33#code

* This is to extende Connext bridge to support IPFS multichain storage

### Replayer

- IPFS content integrity verifier in cross-chain messaging relayer

  - https://github.com/nfthashi/2022-Web3Infinity-submission/blob/main/packages/frontend/src/lib/relayer/index.ts#L83-L100

- IPFS add by NFT Storage

  - https://github.com/nfthashi/2022-Web3Infinity-submission/blob/main/packages/frontend/src/lib/storage/index.ts#L18-L22

## How it Works

We added the IPFS metadata uploading function and add-on logic for content verification for the cross-chain messaging relayer.

![How it works](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/docs/how-it-works.png)

Relayer is called via github actions cron for simple development for this hackathon

![Relayer](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/docs/relayer.png)

## How we built it

We use NFT storage to access IPFS and use Connext cross-chain messaging.

## Development Principle

- make it stupid simple
- no monorepo integration for packages, leave it as separated package
- minimum code linting fixing

### Frontend

- No atomic design, just simple components
- Mainly use Chakra UI, use MUI if specific component is required, use tailwind for custom design

## Running in Local

### Contract

```
cd packages/contracts
yarn test
```

### Frontend

```
// build contracts package first
cd packages/frontend
yarn dev
```
