// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IFundFactory {

    /**
     * @dev Emitted when a new Fund contract is created.
     * @param _FundProxy The address of the newly created Fund proxy contract.
     * @param mappingValue A unique identifier or mapping value associated with the Fund.
     */
    event FundCreated(
        address _FundProxy,
        string mappingValue
    );

    /**
     * @dev Emitted when a new Equity Configuration contract is created.
     * @param _EquityConfigProxy The address of the newly created Equity Configuration proxy contract.
     * @param mappingValue A unique identifier or mapping value associated with the Equity Configuration.
     */
    event EquityConfigCreated(
        address _EquityConfigProxy,
        string mappingValue
    );

    /**
     * @dev Emitted when a user is whitelisted for a specific offering.
     * @param UserAddress The address of the user being whitelisted.
     * @param OfferingAddress The address of the offering for which the user is whitelisted.
     * @param salt A unique identifier or additional metadata related to the whitelisting process.
     */
    event Whitelisted(
        address UserAddress,
        address OfferingAddress,
        string salt
    );

    /**
     * @dev Emitted when administrative fees for a token are updated.
     * @param token The address of the token for which the fees are updated.
     * @param escrowFee The updated escrow fee (in basis points).
     * @param wrapFee The updated wrap fee (in basis points).
     * @param dividendFee The updated dividend fee (in basis points).
     * @param redemptionFee The updated redemption fee (in basis points).
     * @param id A unique identifier for the fee update action.
     * @param timeStamp The timestamp when the fee update was performed.
     */
    event AdminFeeUpdated(
        address token,
        uint16 escrowFee,
        uint16 wrapFee,
        uint16 dividendFee,
        uint16 redemptionFee,
        string id,
        uint256 timeStamp
    );

    /**
     * @dev Emitted when the administrative wallet address is updated.
     * @param newAdminWallet The new administrative wallet address.
     * @param id A unique identifier for the wallet update action.
     * @param timeStamp The timestamp when the wallet update was performed.
     */
    event AdminWalletUpdated(
        address newAdminWallet,
        string id,
        uint256 timeStamp
    );

    /**
     * @dev Emitted when the implementations for Fund and Equity Configuration are updated.
     * @param FundImplementation The address of the new Fund implementation contract.
     * @param EquityConfigImplementation The address of the new Equity Configuration implementation contract.
     */
    event ImplementationsUpdated(
        address FundImplementation,
        address EquityConfigImplementation
    );

    /**
     * @dev Emitted when the Master Factory contract address is updated.
     * @param MasterFactory The new address of the Master Factory contract.
     */
    event MasterFactoryUpdated(
        address MasterFactory
    );

    /**
     * @dev Returns the escrow fee for the given token.
     * @param _token Address of the token.
     * @return Escrow fee in basis points.
     */
    function getEscrowFee(address _token) external view returns(uint16);

    /**
     * @dev Returns the wrap fee for the given token.
     * @param _token Address of the token.
     * @return Wrap fee in basis points.
     */
    function getWrapFee(address _token) external view returns(uint16);

    /**
     * @dev Returns the dividend fee for the given token.
     * @param _token Address of the token.
     * @return Dividend fee in basis points.
     */
    function getDividendFee(address _token) external view returns(uint16);

    /**
     * @dev Returns the redemption fee for the given token.
     * @param _token Address of the token.
     * @return Redemption fee in basis points.
     */
    function getRedemptionFee(address _token) external view returns(uint16);

    /**
     * @dev Returns the admin wallet address.
     * @return Address of the admin wallet.
     */
    function getAdminWallet() external view returns(address);

    /**
     * @dev Returns the address of the master factory contract.
     * @return Address of the master factory.
     */
    function getMasterFactory() external view returns(address);

    /**
     * @dev Returns the address of the fund linked to the given token.
     * @param _token Address of the token.
     * @return Address of the linked fund.
     */
    function getFund(address _token) external view returns(address);

    /**
     * @dev Returns the asset type associated with a given token.
     * @param _token The address of the token whose asset type is being queried.
     * @return The asset type of the token (e.g., 1 for Fund, 2 for Equity).
     */
    function getAssetType(address _token) external view returns(uint8);

    /**
     * @dev Returns the total token supply for a given token.
     * @param _token The address of the token whose total supply is being queried.
     * @return The total supply of the specified token.
     */
    function getTokenTotalSupply(address _token) external view returns(uint256);
}
