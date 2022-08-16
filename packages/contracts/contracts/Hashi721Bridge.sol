// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/interfaces/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC721MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol";

import "./HashiConnextAdapter.sol";
import "./interfaces/IWrappedHashi721.sol";

//TODO: remove when prod
import "hardhat/console.sol";

contract Hashi721Bridge is ERC165Upgradeable, HashiConnextAdapter {
  mapping(address => address) private _contracts;
  mapping(address => uint32) private _domains;
  mapping(address => mapping(uint256 => bytes32)) private _bridgeKeys;

  address private _nftImplementation;

  function initialize(
    uint32 selfDomain,
    address connext,
    address nftImplementation
  ) public initializer {
    __Hashi721Bridge_init(selfDomain, connext, nftImplementation);
  }

  function xSend(
    address processingNFTContractAddress,
    address from,
    address to,
    uint256 tokenId,
    uint32 destinationDomain,
    uint32 version,
    bool isTokenURIIncluded
  ) public {
    _validateAuthorization(processingNFTContractAddress, from, tokenId);
    bytes32 bridgeKey = _getBridgeKey(destinationDomain, version);
    address birthChainNFTContractAddress;
    uint32 birthChainDomain;
    string memory tokenURI;
    if (isTokenURIIncluded) {
      tokenURI = IERC721MetadataUpgradeable(processingNFTContractAddress).tokenURI(tokenId);
    }
    if (_contracts[processingNFTContractAddress] == address(0x0) && _domains[processingNFTContractAddress] == 0) {
      birthChainNFTContractAddress = processingNFTContractAddress;
      birthChainDomain = getSelfDomain();
      IERC721Upgradeable(birthChainNFTContractAddress).transferFrom(from, address(this), tokenId);
      bytes32 bridgeKey = _getBridgeKey(destinationDomain, version);
      _bridgeKeys[processingNFTContractAddress][tokenId] = bridgeKey;
    } else {
      birthChainNFTContractAddress = _contracts[processingNFTContractAddress];
      birthChainDomain = _domains[processingNFTContractAddress];
      require(destinationDomain == birthChainDomain, "Hashi721Bridge: invalid destination domain");
      IWrappedHashi721(processingNFTContractAddress).burn(tokenId);
    }
    bytes memory callData = abi.encodeWithSelector(
      this.xReceive.selector,
      birthChainNFTContractAddress,
      to,
      tokenId,
      birthChainDomain,
      version,
      tokenURI
    );
    _xcall(destinationDomain, version, callData);
  }

  function xReceive(
    address birthChainNFTContractAddress,
    address to,
    uint256 tokenId,
    uint32 birthChainDomain,
    uint32 version,
    string memory tokenURI
  ) public onlyExecutor(version) {
    uint32 selfDomain = getSelfDomain();
    if (birthChainDomain == selfDomain) {
      uint32 domain = _getOrigin();
      bytes32 bridgeKey = _getBridgeKey(domain, version);
      require(_bridgeKeys[birthChainNFTContractAddress][tokenId] == bridgeKey, "Hashi721Bridge: invalid bridge");
      IERC721Upgradeable(birthChainNFTContractAddress).safeTransferFrom(address(this), to, tokenId);
      delete _bridgeKeys[birthChainNFTContractAddress][tokenId];
    } else {
      bytes32 salt = keccak256(abi.encodePacked(birthChainDomain, birthChainNFTContractAddress));
      address processingNFTContractAddress = ClonesUpgradeable.predictDeterministicAddress(
        _nftImplementation,
        salt,
        address(this)
      );
      if (!AddressUpgradeable.isContract(processingNFTContractAddress)) {
        ClonesUpgradeable.cloneDeterministic(_nftImplementation, salt);
        _contracts[processingNFTContractAddress] = birthChainNFTContractAddress;
        _domains[processingNFTContractAddress] = birthChainDomain;
        IWrappedHashi721(processingNFTContractAddress).initialize();
      }
      IWrappedHashi721(processingNFTContractAddress).mint(to, tokenId, tokenURI);
    }
  }

  // solhint-disable-next-line func-name-mixedcase
  function __Hashi721Bridge_init(
    uint32 selfDomain,
    address connext,
    address nftImplementation
  ) internal onlyInitializing {
    __Ownable_init_unchained();
    __HashiConnextAdapter_init_unchained(selfDomain, connext);
    __Hashi721Bridge_init_unchained(nftImplementation);
  }

  // solhint-disable-next-line func-name-mixedcase
  function __Hashi721Bridge_init_unchained(address nftImplementation) internal onlyInitializing {
    _nftImplementation = nftImplementation;
  }

  function _validateAuthorization(
    address nftContractAddress,
    address from,
    uint256 tokenId
  ) internal view {
    require(
      IERC721Upgradeable(nftContractAddress).ownerOf(tokenId) == _msgSender() ||
        IERC721Upgradeable(nftContractAddress).getApproved(tokenId) == _msgSender() ||
        IERC721Upgradeable(nftContractAddress).isApprovedForAll(from, _msgSender()),
      "Hashi721Bridge: invalid sender"
    );

    require(IERC721Upgradeable(nftContractAddress).ownerOf(tokenId) == from, "Hashi721Bridge: invalid from");
  }
}
