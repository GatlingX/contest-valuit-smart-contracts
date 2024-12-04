// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEquityConfig {

    function getCurrentValuation() external view returns(uint256);

    function getMinInvestment() external view returns(uint256);

    function getMaxInvestment() external view returns(uint256);

    function getProjectedYield() external view returns(uint256);

    function getDERatio() external view returns(string memory);

    function getLaunchValuation() external view returns(uint256);

    function getPreviousValutaion() external view returns(uint256);
}

