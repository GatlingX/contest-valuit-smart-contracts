// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEquityConfig {

    /**
     * @dev Emitted when the valuation of the equity is updated.
     * @param newValuation The new valuation amount.
     * @param actionID A unique identifier for the valuation update action.
     */
    event ValuationUpdated(
        uint256 newValuation,
        string actionID
    );

    /**
     * @dev Emitted when the minimum investment amount is updated.
     * @param newMinimumInvestment The new minimum investment value.
     * @param actionID A unique identifier for the update action.
     */
    event MinimumInvestmentUpdated(
        uint256 newMinimumInvestment,
        string actionID
    );

    /**
     * @dev Emitted when the maximum investment amount is updated.
     * @param newMaximumInvestment The new maximum investment value.
     * @param actionID A unique identifier for the update action.
     */
    event MaximumInvestmentUpdated(
        uint256 newMaximumInvestment,
        string actionID
    );

    /**
     * @dev Emitted when the projected yield percentage is updated.
     * @param newProjectedYield The new projected yield value.
     * @param actionID A unique identifier for the update action.
     */
    event ProjectedYieldUpdated(
        uint256 newProjectedYield,
        string actionID
    );

    /**
     * @dev Emitted when the Debt-to-Equity (D/E) ratio is updated.
     * @param newDERatio The new D/E ratio.
     * @param actionID A unique identifier for the update action.
     */
    event DERatioUpdated(
        string newDERatio,
        string actionID
    );

    /**
     * @dev Emitted when dividends are distributed to an investor.
     * @param investor The address of the investor receiving the dividend.
     * @param amount The net dividend amount received by the investor.
     * @param taxAmount The amount deducted as tax or fees from the dividend.
     * @param _userID The unique identifier of the investor.
     * @param _dividendID The unique identifier of the dividend distribution.
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
     * @param _newPrice The new asset price set off-chain.
     */
    event AssetPriceOffChainUpdated(
        uint256 _newPrice
    );

    /**
     * @dev Emitted when the status of off-chain pricing is updated.
     * @param status A boolean indicating whether off-chain pricing is enabled (true) or disabled (false).
     */
    event OffChainPriceUpdated(
        bool status
    );

    /**
     * @dev Retrieves the current valuation of the equity.
     * @return The current valuation amount.
     */
    function getCurrentValuation() external view returns(uint256);

    /**
     * @dev Retrieves the minimum investment amount.
     * @return The minimum investment amount.
     */
    function getMinInvestment() external view returns(uint256);

    /**
     * @dev Retrieves the maximum investment amount.
     * @return The maximum investment amount.
     */
    function getMaxInvestment() external view returns(uint256);

    /**
     * @dev Retrieves the projected yield percentage.
     * @return The projected yield value.
     */
    function getProjectedYield() external view returns(uint256);

    /**
     * @dev Retrieves the Debt-to-Equity (D/E) ratio.
     * @return The D/E ratio as a string.
     */
    function getDERatio() external view returns(string memory);

    /**
     * @dev Retrieves the launch valuation of the equity.
     * @return The launch valuation amount.
     */
    function getLaunchValuation() external view returns(uint256);

    /**
     * @dev Retrieves the previous valuation of the equity.
     * @return The previous valuation amount.
     */
    function getPreviousValutaion() external view returns(uint256);

    /**
     * @dev Retrieves the off-chain asset price.
     * @return The latest off-chain asset price.
     */
    function getOffChainPrice() external view returns(uint256);

    /**
     * @dev Retrieves the status of off-chain pricing.
     * @return A boolean indicating whether off-chain pricing is enabled.
     */
    function getOffChainPriceStatus() external view returns(bool);
    
    /**
     * @dev Retrieves the token address associated with this equity configuration.
     * @return The address of the token.
     */
    function getToken() view external returns (address);

    /**
     * @dev Updates the valuation of the equity.
     * @param _latestValuation The new valuation amount.
     * @param actionID A unique identifier for the update action.
     * @return A boolean indicating whether the operation was successful.
     */
    function setValuation(uint256 _latestValuation, string memory actionID) external returns(bool);
}

