// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

import "@connext/nxtp-contracts/contracts/core/connext/libraries/LibConnextStorage.sol";
import "@connext/nxtp-contracts/contracts/core/connext/interfaces/IExecutor.sol";
import "@connext/nxtp-contracts/contracts/core/connext/interfaces/IConnextHandler.sol";

contract HashiConnextAdapter is OwnableUpgradeable, ERC165Upgradeable {
  mapping(bytes32 => address) private _bridgeContracts;

  address private _connext;
  address private _executor;
  address private _transactingAssetId;
  uint32 private _selfDomain;

  event BridgeSet(uint32 domain, uint32 version, address bridgeContract);

  modifier onlyExecutor(uint32 version) {
    require(msg.sender == _executor, "HashiConnextAdapter: sender invalid");
    uint32 domain = IExecutor(msg.sender).origin();
    address expectedBridgeContract = getBridgeContract(domain, version);
    require(
      IExecutor(msg.sender).originSender() == expectedBridgeContract,
      "HashiConnextAdapter: origin sender invalid"
    );
    _;
  }

  function setBridgeContract(
    uint32 domain,
    uint32 version,
    address bridgeContract
  ) public onlyOwner {
    bytes32 bridgeContractKey = _getBridgeKey(domain, version);
    require(
      _bridgeContracts[bridgeContractKey] == address(0x0),
      "HashiConnextAdaptor: bridge already registered"
    );
    _bridgeContracts[bridgeContractKey] = bridgeContract;
    emit BridgeSet(domain, version, bridgeContract);
  }

  function getConnext() public view returns (address) {
    return _connext;
  }

  function getExecutor() public view returns (address) {
    return _executor;
  }

  function getSelfDomain() public view returns (uint32) {
    return _selfDomain;
  }

  function getBridgeContract(uint32 domainId, uint32 version) public view returns (address){
    bytes32 bridgeKey = _getBridgeKey(domainId, version);
    return _bridgeContracts[bridgeKey];
  }

  // solhint-disable-next-line func-name-mixedcase
  function __HashiConnextAdapter_init(
    uint32 selfDomain,
    address connext,
    address transactingAssetId
  ) internal onlyInitializing {
    __Ownable_init_unchained();
    __HashiConnextAdapter_init_unchained(selfDomain, connext, transactingAssetId);
  }

  // solhint-disable-next-line func-name-mixedcase
  function __HashiConnextAdapter_init_unchained(
    uint32 selfDomain,
    address connext,
    address transactingAssetId
  ) internal onlyInitializing {
    _selfDomain = selfDomain;
    _connext = connext;
    _executor = address(IConnextHandler(_connext).executor());
    _transactingAssetId = transactingAssetId;
  }

  function _xcall(
    uint32 destinationDomainId,
    uint32 version,
    bytes memory callData
  ) internal {
    address destinationContract = getBridgeContract(destinationDomainId, version);
    require(destinationContract != address(0x0), "HashiConnextAdapter: invalid bridge");
    CallParams memory callParams = CallParams({
      to: destinationContract,
      callData: callData,
      originDomain: _selfDomain,
      destinationDomain: destinationDomainId,
      agent: msg.sender,
      recovery: msg.sender,
      forceSlow: true,
      receiveLocal: false,
      callback: address(0),
      callbackFee: 0,
      relayerFee: 0,
      slippageTol: 9995
    });
    XCallArgs memory xcallArgs = XCallArgs({params: callParams, transactingAssetId: address(0x0), amount: 0});
    IConnextHandler(_connext).xcall(xcallArgs);
  }

  function _getBridgeKey(uint32 domainId, uint32 version) internal pure returns(bytes32){
    return keccak256(abi.encodePacked(domainId, version));
  }
}