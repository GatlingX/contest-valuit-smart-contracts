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

    event orderRejected(
        string orderID,
        address _Issuer,
        uint256 refundedValue
    );

    event StableCoinUpdated(
        string coin,
        address newAddress
    );

    event TokensMinted(
        address toAddress, 
        uint256 amount, 
        string orderID);

    event TokensBurned(
        address fromAddress, 
        uint256 amount, 
        string orderID
    );

    event UserTokensFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID
    );

    event UserTokensUnFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID
    );

    event ForceTransferred(
        address fromAddress,
        address toAddress, 
        uint256 amount, 
        string orderID
    );

    event UserAddressFrozen(
        address userAddress,
        bool isFrozen,
        string actionID
    );

    event UserIdentityRegistered(
        address userAddress, 
        address onchainID,
        string userID
    );

    event IdentityUpdated(
        address userAddress,
        address token,
        string actionID
    );

    event UserCountryUpdated(
        address userAddress,
        address token,
        uint16 country,
        string actionID
    );

    event UserIdentityDeleted(
        address userAddress,
        address token,
        string actionID
    );

    event DividendDistributed(
        address investor,
        uint256 amount,
        string _userID,
        string _dividendID
    );
    


    struct InvestorOrder{
        address investor;
        address asset;
        uint256 value;
        uint256 tokens;
        string coin;
        bool status;
    }
    
    uint256 public totalPendingOrderAmount;

    address public masterFactory;

    mapping(string => uint256) public pendingOrderAmount;
    mapping(string => address) internal stablecoin;
    mapping(address => string) internal stableCoinName;
    mapping(address => bool) public isStableCoin;
    mapping(string => InvestorOrder) public investorOrders;
    mapping(string => uint256) public receivedAmount;
    mapping(address => mapping(string => bool)) public orderCreated;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 
}