//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract EquityConfigStorage {

    event ValuationUpdated(
        uint256 newValuation,
        string actionID
    );

    event MinimumInvestmentUpdated(
        uint256 newMinimumInvestment,
        string actionID
    );

    event MaximumInvestmentUpdated(
        uint256 newMaximumInvestment,
        string actionID
    );

    event ProjectedYieldUpdated(
        uint256 newProjectedYield,
        string actionID
    );

    event DERatioUpdated(
        string newDERatio,
        string actionID
    );

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
