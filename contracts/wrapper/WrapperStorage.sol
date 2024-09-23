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
    
    event WrapTokenCreated(
        address _erc3643,
        address _erc20
    );

    event TokenLocked(
        address _erc3643,
        uint256 _amount
    );

    event TokenUnlocked(
        address _erc3643,
        uint256 _amount
    );

}