// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEscrowController {

    event AmountReceived(
        address _asset,
        address _investor,
        uint256 amountValue,
        uint256 tokens,
        string orderID,
        string coin
    );

    event OrderSettled(
        string orderID,
        address _Issuer,
        uint256 amountValue,
        uint256 tokens
    );

    event OrderRejected(
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
        string orderID,
        address token);

    event TokensBurned(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    event UserTokensFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    event UserTokensUnFrozen(
        address fromAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    event ForceTransferred(
        address fromAddress,
        address toAddress, 
        uint256 amount, 
        string orderID,
        address token
    );

    event UserAddressFrozen(
        address userAddress,
        bool isFrozen,
        string actionID,
        address token
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
        string _dividendID,
        address token
    );

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

    function getStableCoin(string calldata _stablecoin) external view returns(address);

    function getStableCoinName(address stableCoin) external view returns(string memory);
}