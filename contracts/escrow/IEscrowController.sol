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

    function getStableCoin(string calldata _stablecoin) external view returns(address);

    function getStableCoinName(address stableCoin) external view returns(string memory);
}