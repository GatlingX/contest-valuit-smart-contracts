//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract FundFactoryStorage {

    address public masterFactory;
    address public implFund;
    address proxy;

    event FundCreated(
        address _FundProxy,
        string mappingValue
    );

    
}