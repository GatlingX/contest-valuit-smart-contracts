// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEscrowController {

    /**
     * @dev Event emitted when an order is created.
     * @param _asset Address of the asset token.
     * @param _investor Address of the investor.
     * @param amountValue Amount of stablecoins deposited.
     * @param tokens Number of tokens purchased.
     * @param orderID Unique order identifier.
     * @param coin Type of stablecoin used.
     */
    event OrderCreated(
        address _asset,
        address _investor,
        uint256 amountValue,
        uint256 tokens,
        string orderID,
        string coin
    );

    /**
     * @dev Event emitted when an order is settled.
     * @param orderID Unique order identifier.
     * @param _Issuer Address of the agent processing the order.
     * @param amountValue Amount of stablecoins used.
     * @param tokens Number of tokens transferred.
     */
    event OrderSettled(
        string orderID,
        address _Issuer,
        uint256 amountValue,
        uint256 tokens
    );

    /**
     * @dev Event emitted when an order is rejected by an agent.
     * @param orderID Unique order identifier.
     * @param _Issuer Address of the agent who rejected the order.
     * @param refundedValue Amount of stablecoins refunded.
     */
    event OrderRejected(
        string orderID,
        address _Issuer,
        uint256 refundedValue
    );

    /**
     * @dev Event emitted when an order is cancelled.
     * @param orderID Unique order identifier.
     * @param userAddress Address of the investor who canceled the order.
     * @param orderValue Amount of stablecoins refunded.
     */
    event OrderCancelled(
        string orderID, 
        address userAddress, 
        uint256 orderValue
    );

    /**
     * @dev Emitted when a new stablecoin is set or updated.
     * @param coin The name of the stablecoin.
     * @param newAddress The address of the stablecoin contract.
     */
    event StableCoinUpdated(
        string coin,
        address newAddress
    );

    /**
     * @dev Emitted when new tokens are minted.
     * @param toAddress The address receiving the minted tokens.
     * @param amount The number of tokens minted.
     * @param orderID The unique identifier of the order associated with the minting.
     * @param token The address of the token being minted.
     */
    event TokensMinted(
        address toAddress, 
        uint256 amount, 
        string orderID,
        address token);

    /**
     * @dev Emitted when tokens are burned (removed from circulation).
     * @param fromAddress The address from which tokens are burned.
     * @param amount The number of tokens burned.
     * @param orderID The unique identifier of the order associated with the burning.
     * @param token The address of the token being burned.
     */
    event TokensBurned(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    /**
     * @dev Emitted when a user's tokens are frozen, restricting transfers.
     * @param fromAddress The address whose tokens are frozen.
     * @param amount The number of tokens frozen.
     * @param orderID The unique identifier of the order associated with the freeze.
     * @param token The address of the token being frozen.
     */
    event UserTokensFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    /**
     * @dev Emitted when a user's previously frozen tokens are unfrozen.
     * @param fromAddress The address whose tokens are unfrozen.
     * @param amount The number of tokens unfrozen.
     * @param orderID The unique identifier of the order associated with the unfreeze.
     * @param token The address of the token being unfrozen.
     */
    event UserTokensUnFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    /**
     * @dev Emitted when a forceful transfer of tokens is executed.
     * @param fromAddress The address from which tokens are forcibly transferred.
     * @param toAddress The recipient address of the forcibly transferred tokens.
     * @param amount The number of tokens transferred.
     * @param orderID The unique identifier of the order associated with the forced transfer.
     * @param token The address of the token being transferred.
     */
    event ForceTransferred(
        address fromAddress,
        address toAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    /**
     * @dev Emitted when a user's address is frozen or unfrozen.
     * @param userAddress The address of the user whose status is changed.
     * @param isFrozen A boolean indicating whether the address is frozen (true) or unfrozen (false).
     * @param actionID The unique identifier associated with the freezing/unfreezing action.
     * @param token The address of the token related to the action.
     */
    event UserAddressFrozen(
        address userAddress,
        bool isFrozen,
        string actionID,
        address token
    );

    /**
     * @dev Emitted when a user's identity is registered on-chain.
     * @param userAddress The address of the user whose identity is registered.
     * @param onchainID The address of the on-chain identity contract associated with the user.
     * @param userID The unique identifier of the registered user.
     */
    event UserIdentityRegistered(
        address userAddress, 
        address onchainID,
        string userID
    );

    /**
     * @dev Emitted when a user's identity is updated in the identity registry.
     * @param userAddress The address of the user whose identity was updated.
     * @param token The address of the token contract linked to the identity registry.
     * @param actionID The identifier for the update action.
     */
    event IdentityUpdated(
        address userAddress,
        address token,
        string actionID
    );

    /**
     * @dev Emitted when a user's country code is updated in the identity registry.
     * @param userAddress The address of the user whose country code was updated.
     * @param token The address of the token contract linked to the identity registry.
     * @param country The updated country code.
     * @param actionID The identifier for the update action.
     */
    event UserCountryUpdated(
        address userAddress,
        address token,
        uint16 country,
        string actionID
    );

    /**
     * @dev Emitted when a user's identity is deleted from the identity registry.
     * @param userAddress The address of the user whose identity was deleted.
     * @param token The address of the token contract linked to the identity registry.
     * @param actionID The identifier for the deletion action.
     */
    event UserIdentityDeleted(
        address userAddress,
        address token,
        string actionID
    );

    /**
     * @dev Emitted when a dividend is distributed to an investor.
     * @param investor The address of the investor receiving the dividend.
     * @param amount The amount of dividend distributed.
     * @param _userID The unique identifier of the investor.
     * @param _dividendID The unique identifier of the dividend distribution transaction.
     * @param token The address of the token associated with the dividend distribution.
     */
    event DividendDistributed(
        address investor,
        uint256 amount,
        string _userID,
        string _dividendID,
        address token
    );

    /**
     * @dev Emitted when a redemption occurs, burning tokens and transferring stablecoins.
     * @param token The address of the token being burned.
     * @param userAddress The address of the user redeeming the tokens.
     * @param tokensBurned The amount of tokens burned.
     * @param principalAmount The principal amount returned to the user.
     * @param profitAmount The profit amount (if applicable).
     * @param stableCoin The stablecoin used for transactions.
     * @param amountRedeemed The net amount received by the user after fees.
     * @param taxCollected The fee amount sent to the admin.
     * @param orderID The unique identifier of the redemption order.
     */
    event RedemptionAndBurn(
        address token,
        address userAddress,
        uint256 tokensBurned,
        uint256 principalAmount,
        uint256 profitAmount,
        string stableCoin,
        uint256 amountRedeemed,
        uint256 taxCollected,
        string orderID
    );

    /**
     * @dev Emitted when the master factory address is updated.
     * @param masterFactory The new address of the master factory.
     */
    event MasterFactoryUpdated(
        address masterFactory
    );

    /**
     * @dev Emitted when the fund factory address is updated.
     * @param fundFactory The new address of the fund factory.
     */
    event FundFactoryUpdated(
        address fundFactory
    );

    /**
     * @dev Emitted when the Net Asset Value (NAV) of an asset is updated.
     * @param assetAddress The address of the asset whose NAV was updated.
     * @param fundAddress The address of the fund managing the asset.
     * @param latestNAV The updated NAV value.
     * @param actionID The identifier for the NAV update action.
     */
    event NAVUpdated(
        address assetAddress,
        address fundAddress,
        uint256 latestNAV,
        string actionID
    );

    /**
     * @dev Emitted when the valuation of an equity asset is updated.
     * @param assetAddress The address of the asset whose valuation was updated.
     * @param equityAddress The address of the equity contract associated with the asset.
     * @param latestValuation The updated valuation amount.
     * @param actionID The identifier for the valuation update action.
     */
    event ValuationUpdated(
        address assetAddress,
        address equityAddress,
        uint256 latestValuation,
        string actionID
    );

    /**
     * @dev Retrieves the address of the stablecoin associated with the given name.
     * @param _stablecoin The name of the stablecoin (e.g., "usdc", "usdt").
     * @return The address of the stablecoin contract.
     */
    function getStableCoin(string calldata _stablecoin) external view returns(address);

    /**
     * @dev Retrieves the name of the stablecoin associated with the given address.
     * @param stableCoin The address of the stablecoin contract.
     * @return The name of the stablecoin (e.g., "usdc", "usdt").
     */
    function getStableCoinName(address stableCoin) external view returns(string memory);
}