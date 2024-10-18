//SPDX-License-Identifier: GPL-3.0

/*
      █████╗ ███╗   ██╗████████╗██╗███████╗██████╗ 
     ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝██╔══██╗
     ███████║██╔██╗ ██║   ██║   ██║█████╗  ██████╔╝
     ██╔══██║██║╚██╗██║   ██║   ██║██╔══╝  ██╔══██╗
     ██║  ██║██║ ╚████║   ██║   ██║███████╗██║  ██║
     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝╚═╝  ╚═╝                                      
*/

pragma solidity ^0.8.0;

contract FundFactoryStorage {

    address public masterFactory;
    address public implFund;
    address public implEquityConfig;
    address internal _proxy;

    event FundCreated(
        address _FundProxy,
        string mappingValue
    );

    event EquityConfigCreated(
        address _EquityConfigProxy,
        string mappingValue
    );

    event Whitelisted(
        address UserAddress,
        address OfferingAddress,
        string salt
    );
    
}