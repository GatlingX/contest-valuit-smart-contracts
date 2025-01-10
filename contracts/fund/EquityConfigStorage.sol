//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract EquityConfigStorage {

    string public fundName;
    string internal DERatio;

    address public token;
    address public factory;

    uint256 internal minInvestment;
    uint256 internal maxInvestment;
    uint256 internal launchValuation;
    uint256 internal projectedYield;
    uint256 internal previousValutaion;
    uint256 internal currentValuation;
    uint256 public tokenPrice;
    uint16 public FEE_DENOMINATOR;

    bool public offChainPrice;

    mapping(string => bool) internal dividendStatus;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 
}
