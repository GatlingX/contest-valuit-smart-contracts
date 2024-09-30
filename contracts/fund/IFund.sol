// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface IFund {

    /**
    @dev Calculates and returns the Assets Under Management (AUM) of the fund.
    Multiplies the circulating supply by the latest Net Asset Value (NAV) price to calculate the AUM.
    Assumes that the NAVLatestPrice and token variables are already initialized.
    Returns the calculated AUM.
    This function is callable externally.
    */
    function getAUM() external returns (uint256);

    /**
    @dev Retrieves the latest Net Asset Value (NAV) price from the APIConsumer contract.
    Updates the NAVLatestPrice variable with the retrieved value.
    Returns the updated NAVLatestPrice.
    Assumes that the apiConsumer variable is already initialized.
    This function is callable externally.
    */
    function getNAV() external returns (uint256);
}