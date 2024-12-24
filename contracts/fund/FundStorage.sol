//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract FundStorage {

    string public fundName;
    string public cusip;

    address public token;
    address public factory;

    uint256 public propertyType;
    uint256 public NAVLaunchPrice;
    uint256 public projectedYield;
    uint256 public NAVLatestPrice;
    uint256 public minInvestment;
    uint256 public maxInvestment;
    uint256 public tokenPrice;
    uint16 public FEE_DENOMINATOR = 10000;

    bool public offChainPrice;

    mapping(string => bool) internal dividendStatus;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 
}
