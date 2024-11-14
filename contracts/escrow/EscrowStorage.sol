//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract EscrowStorage {

    event AmountReceived(
        address _asset,
        address _investor,
        uint256 amountValue,
        uint256 tokens,
        string orderID,
        string coin
    );

    event orderSettled(
        string orderID,
        address _Issuer,
        uint256 amountValue,
        uint256 tokens
    );

    event AdminFeeUpdated(
        uint16 newFee,
        string id,
        uint256 timeStamp
    );

    event AdminWalletUpdated(
        address newAdminWallet,
        string id,
        uint256 timeStamp
    );

    event StableCoinUpdated(
        string coin,
        address newAddress
    );

    struct InvestorOrder{
        address investor;
        address asset;
        uint256 value;
        uint256 tokens;
        string coin;
        bool status;
    }

    address public adminWallet;
    uint16 public adminFee;
    uint256 public totalPendingOrderAmount;

    mapping(string => uint256) public pendingOrderAmount;
    mapping(string => address) internal stablecoin;
    mapping(address => string) internal stableCoinName;
    mapping(string => InvestorOrder) public investorOrders;
    mapping(string => uint256) public receivedAmount;
    mapping(string => bool) public orderCreated;
}