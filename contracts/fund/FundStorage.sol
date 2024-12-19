//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract FundStorage {

    event NAVUpdated(
        uint256 latestNAV,
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

    event DividendDistributed(
        address investor,
        uint256 amount,
        string _userID,
        string _dividendID
    );

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

    bool public offChainPrice;

    mapping(string => bool) internal dividendStatus;
}
