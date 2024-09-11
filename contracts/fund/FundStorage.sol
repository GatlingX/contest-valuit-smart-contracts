pragma solidity ^0.8.0;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract FundStorage {

    string public fundName;

    address public token;
    address public factory;

    uint256 public yieldType;
    uint256 public propertyType;
    uint256 public AssetUnderManagement;
    uint256 public NAVLaunchPrice;
    uint256 public NAVLatestPrice;
    uint256 public cusip;
    uint256 public spvValuation;
}
