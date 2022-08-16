// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";
import "@connext/nxtp-contracts/contracts/core/connext/interfaces/IExecutor.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract ConnextHandler is OwnableUpgradeable {
  IExecutor private _executor;

  event Called(address indexed to, uint32 indexed originDomain, uint32 indexed destinationDomain, bytes callData);
  event Received(address indexed from, uint32 indexed originDomain, uint32 indexed destinationDomain, bytes callData);

  function setExecutor(IExecutor executor) public {
    _executor = executor;
  }

  // solhint-disable-next-line no-unused-vars
  function xcall(XCallArgs memory xCallArgs) public payable returns (bytes32) {
    emit Called(
      xCallArgs.params.to,
      xCallArgs.params.originDomain,
      xCallArgs.params.destinationDomain,
      xCallArgs.params.callData
    );
  }

  function executor() public view returns (IExecutor) {
    return _executor;
  }

  // solhint-disable-next-line func-name-mixedcase
  function __HashiConnextAdapter_init() internal onlyInitializing {
    __Ownable_init_unchained();
    __ConnextHandler_init_unchained();
  }

  // solhint-disable-next-line func-name-mixedcase
  function __ConnextHandler_init_unchained() internal onlyInitializing {}
}
