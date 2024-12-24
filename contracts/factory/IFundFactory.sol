// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IFundFactory {

    event FundCreated(
        address _FundProxy,
        string mappingValue
    );

    event EquityConfigCreated(
        address _EquityConfigProxy,
        string mappingValue
    );

    event Whitelisted(
        address UserAddress,
        address OfferingAddress,
        string salt
    );

    event AdminFeeUpdated(
        address token,
        uint16 escrowFee,
        uint16 wrapFee,
        uint16 dividendFee,
        uint16 redemptionFee,
        string id,
        uint256 timeStamp
    );

    event AdminWalletUpdated(
        address newAdminWallet,
        string id,
        uint256 timeStamp
    );

    event ImplementationsUpdated(
        address FundImplementation,
        address EquityConfigImplementation
    );

    event MasterFactoryUpdated(
        address MasterFactory
    );

    function getEscrowFee(address _token) external view returns(uint16);

    function getWrapFee(address _token) external view returns(uint16);

    function getDividendFee(address _token) external view returns(uint16);

    function getRedemptionFee(address _token) external view returns(uint16);

    function getAdminWallet() external view returns(address);

    function getMasterFactory() external view returns(address);

    function getFund(address _token) external view returns(address);

    function getAssetType(address _token) external view returns(uint8);

    function getTokenTotalSupply(address _token) external view returns(uint256);
}
