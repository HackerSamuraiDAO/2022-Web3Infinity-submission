# NFTHashi 2022 Web3 Inifinity Hackathon Edition

![Key Visital](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/packages/frontend/public/img/brands/key-visual.png)

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

## Inspiration

We are trying to build the most secure and permission cross-chain NFT bridge supported by [Connext](https://www.connext.network/). We are a very active team and have a good community in the cross-chain space.

[NFTHashi Twitter](https://twitter.com/nfthashi)

We did not have multi-chain storage before, so only simple token URI transfer was supported. For this hackathon, we decided to implement multi-chain storage on IPFS for this hackathon for bringing better data flexibility to NFTHashi.

Also, we want to get better feedback and support in this hackathon.

## What it does

We added the IPFS metadata uploading function and add-on logic for content verification for the cross-chain messaging relayer.

![How it works](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/docs/how-it-works.png)

Relayer is called via github actions cron for simple development for this hackathon

![Relayer](https://raw.githubusercontent.com/nfthashi/2022-Web3Infinity-submission/main/docs/relayer.png)

## How we built it

We use NFT storage to access IPFS and use Connext cross-chain messaging.

## Challenges we ran into

- It was difficult to add IPFS content verification logic in the relayer, because we need to prevent sending wrong or malicious token metadata when bridging.
- Connext bridge was down in the development period, so we built a workaround relayer too.

## Accomplishments that we're proud of

- Successfully build all cross-chain bridge processes with IPFS multi-chain storage.
- We can add this function in the main service too.

## What we learned

- How to use IPFS
- How to build a cross-chain messaging relayer
- Cross-chain messaging security is very difficult to achieve.

## What's next for NFTHashi

- Mainnet launch
- More secure IPFS content verifier
- Multichain metadata tracking and verifyer

## Development Principle

- make it stupid simple
- no monorepo integration for packages, leave it as separated package
- minimum code linting fixing

### Frontend

- No atomic design, just simple components
- Mainly use Chakra UI, use MUI if specific component is required, use tailwind for custom design

## Running in Local

### Frontend

```
cd packages/frontend
yarn dev
```
