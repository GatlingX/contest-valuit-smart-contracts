//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract EquityConfigStorage {

    string public fundName;
    string public DERatio;

    address public token;
    address public factory;

    uint256 public minInvestment;
    uint256 public maxInvestment;
    uint256 public launchValuation;
    uint256 public projectedYield;
    uint256 public previousValutaion;
    uint256 public currentValuation;
}
