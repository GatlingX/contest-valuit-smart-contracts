//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract EscrowStorage {

    event AmountReceived(
        address _asset,
        address _investor,
        uint256 amountValue,
        string orderID
    );

    event orderSettled(
        string orderID,
        address _Issuer,
        uint256 amountValue
    );

    struct InvestorOrder{
        address investor;
        address asset;
        uint256 value;
        bool status;
    }

    uint8 public adminFee;
    uint256 public pendingOrderAmount;

    address public stableCoin;

    // uint256 public orderID;

    mapping(string => InvestorOrder) public investorOrders;
    mapping(string => uint256) public receivedAmount;
    mapping(string => bool) public orderCreated;
}