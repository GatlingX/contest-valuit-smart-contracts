//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

contract EscrowStorage {

    struct InvestorOrder{
        address investor;
        address asset;
        uint256 value;
        uint256 tokens;
        string coin;
        bool status;
    }

    uint256 public totalPendingOrderAmount;
    uint16 public FEE_DENOMINATOR;

    address public masterFactory;
    address public fundFactory;

    mapping(string => uint256) public pendingOrderAmount;
    mapping(string => address) internal stablecoin;
    mapping(address => string) internal stableCoinName;
    mapping(address => bool) public isStableCoin;
    mapping(string => InvestorOrder) public investorOrders;
    mapping(string => bool) public redemptionStatus;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 
}