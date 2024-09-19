//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

contract WrapperStorage {

    event wrapTokenCreated(
        address _erc3643,
        address _erc20
    );

    mapping(address => address) public getERC20;
    mapping(address => address) public getERC3643;    
    mapping(address => bool) public isWrapped;

    address public implERC20;
    address proxy;
}