// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";
import "@connext/nxtp-contracts/contracts/core/connext/interfaces/IExecutor.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract ConnextHandler is Initializable {
  IExecutor private _executor;

  event Called(uint32 indexed destinationDomain, address indexed originSender, address indexed to, bytes callData);

  function initialize(IExecutor executor) public initializer {
    __ConnextHandler_init(executor);
  }

  function xcall(XCallArgs memory xCallArgs) public payable returns (bytes32) {
    emit Called(xCallArgs.params.destinationDomain, address(this), xCallArgs.params.to, xCallArgs.params.callData);
  }

  function executor() public view returns (IExecutor) {
    return _executor;
  }

  function __ConnextHandler_init(IExecutor executor) internal onlyInitializing {
    __ConnextHandler_init_unchained(executor);
  }

  function __ConnextHandler_init_unchained(IExecutor executor) internal onlyInitializing {
    _executor = executor;
  }
}
