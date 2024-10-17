//SPDX-License-Identifier: GPL-3.0

import "contracts/proxy/ProxyV1.sol";
import "contracts/factory/FundFactoryStorage.sol";
import "contracts/fund/IFactory.sol";
import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";
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
        address _implFund,
        address _implEquityConfig
    ) public {
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set implementation");
        implFund = _implFund;
        implEquityConfig = _implEquityConfig;
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

    function createEquityConfig (address _token, 
        bytes memory _data, 
        string memory mappingValue) public{

            require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can create");

            _proxy =address(new ProxyV1());

            (bool success, ) = _proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implEquityConfig)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

            (success, ) = _proxy.call(
                abi.encodeWithSelector(
                    0xc0d91eaf, _token, _data
                ));
            require(success, "Equity Configuration Intiatialization Failed");

            emit EquityConfigCreated(_proxy, mappingValue);
        }

    
    function batchWhitelist(
        address _token,
        address[] calldata _userAddresses,
        IIdentity[] calldata _identities,
        uint16[] calldata _countries,
        string[] calldata _salts) public {
            IIdentityRegistry ir = IToken(_token).identityRegistry();
            require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
            require(_userAddresses.length == _identities.length &&
            _identities.length == _countries.length &&
            _countries.length == _salts.length, "Invalid Inputs");

            for(uint i=0; i<_userAddresses.length; i++){
                IIdentityRegistry(ir).registerIdentity(_userAddresses[i], _identities[i], _countries[i]);
                emit Whitelisted(_userAddresses[i], _token, _salts[i]);
            }
    }
}