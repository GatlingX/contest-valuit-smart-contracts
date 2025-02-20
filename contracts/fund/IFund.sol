// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface IFund {

    /**
     * @dev Emitted when the Net Asset Value (NAV) of the fund is updated.
     * @param latestNAV The updated NAV value.
     * @param actionID A unique identifier for the update action.
     */
    event NAVUpdated(
        uint256 latestNAV,
        string actionID
    );

    /**
     * @dev Emitted when the minimum investment amount is updated.
     * @param newMinimumInvestment The new minimum investment amount.
     * @param actionID A unique identifier for the update action.
     */
    event MinimumInvestmentUpdated(
        uint256 newMinimumInvestment,
        string actionID
    );

    /**
     * @dev Emitted when the maximum investment amount is updated.
     * @param newMaximumInvestment The new maximum investment amount.
     * @param actionID A unique identifier for the update action.
     */
    event MaximumInvestmentUpdated(
        uint256 newMaximumInvestment,
        string actionID
    );

    /**
     * @dev Emitted when the projected yield of the fund is updated.
     * @param newProjectedYield The updated projected yield percentage.
     * @param actionID A unique identifier for the update action.
     */
    event ProjectedYieldUpdated(
        uint256 newProjectedYield,
        string actionID
    );

    /**
     * @dev Emitted when a dividend is distributed to an investor.
     * @param investor The address of the investor receiving the dividend.
     * @param amount The net dividend amount received by the investor.
     * @param taxAmount The tax or fee deducted from the total dividend amount.
     * @param _userID A unique identifier for the investor.
     * @param _dividendID A unique identifier for the dividend distribution.
     */
    event DividendDistributed(
        address investor,
        uint256 amount,
        uint256 taxAmount,
        string _userID,
        string _dividendID
    );

    /**
     * @dev Emitted when the off-chain asset price is updated.
     * @param _newPrice The updated off-chain price of the asset.
     */
    event AssetPriceOffChainUpdated(
        uint256 _newPrice
    );

    /**
     * @dev Emitted when the off-chain pricing status is updated.
     * @param status A boolean indicating whether off-chain pricing is enabled (true) or disabled (false).
     */
    event OffChainPriceUpdated(
        bool status
    );

    /**
     * @dev Returns the latest Net Asset Value (NAV) of the fund.
     * @return The latest NAV price.
     */
    function getNAV() external returns (uint256);

    /**
     * @dev Returns the address of the token associated with the fund.
     * @return The token address.
     */
    function getToken() external view returns (address);

    /**
     * @dev Returns the current off-chain asset price.
     * @return The token price set off-chain.
     */
    function getOffChainPrice() external view returns(uint256);

    /**
     * @dev Returns the status of off-chain pricing.
     * @return True if off-chain pricing is enabled, otherwise false.
     */
    function getOffChainPriceStatus() external view returns(bool);

    /**
     * @dev Distributes dividends to an investor while deducting an admin fee.
     * @param _address The recipient investor's address.
     * @param _dividend The total dividend amount.
     * @param _userIds The unique identifier of the investor.
     * @param _dividendIds The unique identifier of the dividend distribution.
     * @param stableCoin_ The address of the stablecoin used for the dividend payment.
     * @param _agent The address of the agent initiating the distribution.
     */
    function shareDividend(address _address, 
                            uint256  _dividend,
                            string calldata _userIds,
                            string calldata _dividendIds,  
                            address stableCoin_,
                            address _agent) external;

    /**
     * @dev Updates the Net Asset Value (NAV) of the fund.
     * @param _latestNAV The updated NAV value.
     * @param actionID A unique identifier for the update action.
     * @return True if the update is successful.
     */
    function setNAV(uint256 _latestNAV, string memory actionID) external returns(bool);
}