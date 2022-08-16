// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "../HashiConnextAdapter.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract MockHashiConnextAdapter is HashiConnextAdapter {
  constructor(
    uint32 selfDomain,
    address connext
  ) {
    initialize(selfDomain, connext);
  }

  function initialize(
    uint32 selfDomain,
    address connext
  ) public initializer {
    __HashiConnextAdapter_init(selfDomain, connext);
  }

  // solhint-disable-next-line no-empty-blocks
  function testOnlyExecutor(uint32 version) public onlyExecutor(version) {}

  function testXCall(uint32 destinationDomain, uint32 version, bytes memory callData) public {
    _xcall(destinationDomain, version, callData);
  }
}
