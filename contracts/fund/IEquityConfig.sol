// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEquityConfig {

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

    event DividendDistributed(
        address investor,
        uint256 amount,
        uint256 taxAmount,
        string _userID,
        string _dividendID
    );

    function getCurrentValuation() external view returns(uint256);

    function getMinInvestment() external view returns(uint256);

    function getMaxInvestment() external view returns(uint256);

    function getProjectedYield() external view returns(uint256);

    function getDERatio() external view returns(string memory);

    function getLaunchValuation() external view returns(uint256);

    function getPreviousValutaion() external view returns(uint256);

    function getOffChainPrice() external view returns(uint256);

    function getOffChainPriceStatus() external view returns(bool);
}

