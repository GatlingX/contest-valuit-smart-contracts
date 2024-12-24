//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

contract FundFactoryStorage {

    struct Fees {
        uint16 escrowFee;
        uint16 wrapFee;
        uint16 dividendFee;
        uint16 redemptionFee;
    }

    error FeeOutOfBound();

    mapping(address => Fees) internal Fee;
    mapping(address => address) internal fundLinked;
    mapping(address => uint8) internal assetType;
    mapping(address => uint256) internal tokenTotalSupply;
    mapping(address => bool) internal adminFeeSet;

    address public masterFactory;
    address public implFund;
    address public implEquityConfig;
    address internal adminWallet;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 
    
}