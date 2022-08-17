// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract HashiExecutor is Initializable, OwnableUpgradeable {
  address private _originSender;
  uint32 private _origin;

  event Executed(uint32 indexed originDomain, address indexed originSender, address indexed to, bytes callData);

  function initialize() public initializer {
    __HashiExecutor_init();
  }

  function execute(
    uint32 originDomain,
    address originSender_,
    address to,
    bytes memory callData
  ) public onlyOwner {
    _origin = originDomain;
    _originSender = originSender_;
    (bool success, ) = to.call(callData);
    require(success, "HashiExecutor: execute failed");
    emit Executed(originDomain, originSender_, to, callData);
    delete _origin;
    delete _originSender;
  }

  function originSender() public view returns (address) {
    return _originSender;
  }

  function origin() public view returns (uint32) {
    return _origin;
  }

  function __HashiExecutor_init() internal onlyInitializing {
    __Ownable_init_unchained();
    __HashiExecutor_init_unchained();
  }

  function __HashiExecutor_init_unchained() internal onlyInitializing {}
}
