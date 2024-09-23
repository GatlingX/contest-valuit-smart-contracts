//SPDX-License-Identifier: GPL-3.0

import "contracts/proxy/ProxyV1.sol";
import "contracts/factory/FundFactoryStorage.sol";
import "contracts/fund/IFactory.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


pragma solidity ^0.8.0;

contract FundFactory is
    FundFactoryStorage,
    Initializable,OwnableUpgradeable
{
    function init(address _factory) public initializer {
        __Ownable_init_unchained();
        masterFactory = _factory;
    }

    function setImpl(
        address _implFund
    ) public {
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set implementation");
        implFund = _implFund;
    }

    function createFund (address _token, 
        bytes memory _data, 
        string memory mappingValue) public{

        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can create");

        _proxy =address(new ProxyV1());

        (bool success, ) = _proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implFund)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

        (success, ) = _proxy.call(
            abi.encodeWithSelector(
                0xc0d91eaf, _token, _data
            ));
            require(success, "FUND Intiatialization Failed");

            emit FundCreated(_proxy,mappingValue);
    }

}