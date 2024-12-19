//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

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

    bool public offChainPrice;
}
