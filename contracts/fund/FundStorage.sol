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

import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";

contract FundStorage {

    string public fundName;
    string public cusip;

    address public token;
    address public factory;

    uint256 public propertyType;
    uint256 public NAVLaunchPrice;
    uint256 public projectedYield;
    uint256 public NAVLatestPrice;
    uint256 public minInvestment;
    uint256 public maxInvestment;
}
