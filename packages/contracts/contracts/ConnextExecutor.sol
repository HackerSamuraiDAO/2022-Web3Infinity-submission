// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract ConnextExecutor is OwnableUpgradeable {
  address private _originSender;
  uint32 private _origin;

  function execute(
    uint32 origin,
    address originSender,
    address to,
    bytes memory data
  ) public {
    _origin = origin;
    _originSender = originSender;
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory log) = to.call(data);
    require(success, "MockExecutor: failed");
    delete _origin;
    delete _originSender;
  }

  function originSender() public view returns (address) {
    return _originSender;
  }

  function origin() public view returns (uint32) {
    return _origin;
  }

  // solhint-disable-next-line func-name-mixedcase
  function __ConnextExecutor_init() internal onlyInitializing {
    __Ownable_init_unchained();
    __ConnextExecutor_init_unchained();
  }

  // solhint-disable-next-line func-name-mixedcase
  function __ConnextExecutor_init_unchained() internal onlyInitializing {}
}
