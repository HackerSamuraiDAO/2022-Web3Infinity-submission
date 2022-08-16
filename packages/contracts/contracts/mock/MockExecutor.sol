// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

//TODO: remove when prod
import "hardhat/console.sol";

contract MockExecutor {
  address private _originSender;
  uint32 private _origin;

  function setOriginSender(address originSender_) public {
    _originSender = originSender_;
  }

  function setOrigin(uint32 origin_) public {
    _origin = origin_;
  }

  function execute(address to, bytes memory data) public {
    // solhint-disable-next-line avoid-low-level-calls
    (bool success,bytes memory t) = to.call(data);
    require(success, "MockExecutor: failed");
  }

  function originSender() public view returns (address) {
    return _originSender;
  }

  function origin() public view returns (uint32) {
    return _origin;
  }
}
