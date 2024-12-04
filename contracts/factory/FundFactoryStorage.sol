//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract FundFactoryStorage {

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
        uint16 newFee,
        string id,
        uint256 timeStamp
    );

    event AdminWalletUpdated(
        address newAdminWallet,
        string id,
        uint256 timeStamp
    );

    mapping(address => uint16) internal adminFee;
    mapping(address => address) internal fundLinked;
    mapping(address => uint8) internal assetType;
    mapping(address => uint256) internal tokenTotalSupply;

    address public masterFactory;
    address public implFund;
    address public implEquityConfig;
    address internal _proxy;
    address internal adminWallet;
    
}