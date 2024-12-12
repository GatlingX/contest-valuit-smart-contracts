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
        adminWallet = msg.sender;
    }

    function setImpl(
        address _implFund,
        address _implEquityConfig
    ) public {
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set implementation");
        implFund = _implFund;
        implEquityConfig = _implEquityConfig;
    }

    function setMasterFactory(address factory_) external{
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set master Factory");
        masterFactory = factory_;
    }

    function setAdminFee(address _token, uint16 _adminFee, string memory actionID) external {
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set implementation");
        adminFee[_token] = _adminFee;
        emit AdminFeeUpdated(_token, _adminFee, actionID, block.timestamp);
    }

    function setAdminWallet(address _newWallet, string calldata _actionID) external {
        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can set implementation");
        require(_newWallet != address(0),"Zero Address");
        adminWallet = _newWallet;
        emit AdminWalletUpdated(adminWallet, _actionID, block.timestamp);
    }

    function createFund (address _token, 
        bytes memory _data, 
        uint16 _adminFee,
        uint256 _totalTokenSupply,
        string memory mappingValue) public{

        require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can create");
        require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

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

            adminFee[_token] = _adminFee;
            fundLinked[_token] = _proxy;
            assetType[_token] = 1;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit FundCreated(_proxy,mappingValue);
    }

    function createEquityConfig (address _token, 
        bytes memory _data, 
        uint16 _adminFee,
        uint256 _totalTokenSupply,
        string memory mappingValue) public{

            require(IFactory(masterFactory).owner() == msg.sender,"Only Owner can create");
            require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

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

            adminFee[_token] = _adminFee;
            fundLinked[_token] = _proxy;
            assetType[_token] = 2;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit EquityConfigCreated(_proxy, mappingValue);
    }

    function getAdminFee(address _token) external view returns(uint16){
        return adminFee[_token];
    }

    function getAdminWallet() external view returns(address){
        return adminWallet;
    }

    function getFund(address _token) external view returns(address){
        return fundLinked[_token];
    }

    function getAssetType(address _token) external view returns(uint8){
        return assetType[_token];
    }

    function getMasterFactory() external view returns(address){
        return masterFactory;
    }

    function getTokenTotalSupply(address _token) external view returns(uint256){
        return tokenTotalSupply[_token];
    }
}