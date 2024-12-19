//SPDX-License-Identifier: GPL-3.0

import "contracts/proxy/ProxyV1.sol";
import "contracts/factory/FundFactoryStorage.sol";
import "contracts/fund/IFactory.sol";
import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


pragma solidity 0.8.17;

contract FundFactory is
    FundFactoryStorage,
    Initializable
{
    function init(address _factory) external initializer {
        masterFactory = _factory;
        adminWallet = msg.sender;
    }

    modifier onlyOwner(address _factory) {
        require(IFactory(_factory).owner() == msg.sender, "Only Owner can call");
        _;
    }

    function setImpl(
        address _implFund,
        address _implEquityConfig
    ) external onlyOwner(masterFactory){
        implFund = _implFund;
        implEquityConfig = _implEquityConfig;
        emit ImplementationsUpdated(implFund, implEquityConfig);
    }

    function setMasterFactory(address factory_) external onlyOwner(masterFactory){
        masterFactory = factory_;
        emit MasterFactoryUpdated(masterFactory);
    }

    function setAdminFee(address _token, uint16 _adminFee, string memory actionID) external onlyOwner(masterFactory){
        require(_adminFee >= 0 && _adminFee <=2000, "Fee Out of Bound");
        adminFee[_token] = _adminFee;
        emit AdminFeeUpdated(_token, _adminFee, actionID, block.timestamp);
    }

    function setAdminWallet(address _newWallet, string calldata _actionID) external onlyOwner(masterFactory){
        require(_newWallet != address(0),"Zero Address");
        adminWallet = _newWallet;
        emit AdminWalletUpdated(adminWallet, _actionID, block.timestamp);
    }

    function createFund (address _token, 
        bytes memory _data, 
        uint16 _adminFee,
        uint256 _totalTokenSupply,
        string memory mappingValue) external onlyOwner(masterFactory){

        require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

        address _proxy =address(new ProxyV1());

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
        string memory mappingValue) external onlyOwner(masterFactory){

            require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

            address _proxy =address(new ProxyV1());

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