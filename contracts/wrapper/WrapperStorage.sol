//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

contract WrapperStorage {

    
    mapping(address => address) public getERC20;
    mapping(address => address) public getERC3643;    
    mapping(address => bool) public isWrapped;
    mapping(address => uint256) public lockedERC3643;

    address public implERC20;
    address internal _proxy;
    address public wrapperOnchainID;
    address public fundFactory;
    address public escrowController;
    address public stableCoin;
    
    event WrapTokenCreated(
        address _erc3643,
        address _erc20
    );

    event TokenLocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 _tax,
        uint256 timestamp
    );

    event TokenUnlocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 _tax,
        uint256 timestamp
    );

    event OnChainIDUpdated(
        address _newID
    );

    event FundFactoryUpdated(
        address fundFactory
    );

    event EscrowControllerUpdated(
        address escrowController
    );

    event StableCoinUpdated(
        address stableCoinAddress,
        string stableCoin
    );

}