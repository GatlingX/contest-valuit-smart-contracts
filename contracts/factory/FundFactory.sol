//SPDX-License-Identifier: GPL-3.0

import "contracts/proxy/ProxyV1.sol";
import "contracts/fund/IFactory.sol";
import "contracts/token/IToken.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/factory/FundFactoryStorage.sol";


pragma solidity 0.8.17;

contract FundFactory is
    FundFactoryStorage, IFundFactory,
    Initializable
{
    function init(address _factory) external initializer {
        masterFactory = _factory;
        adminWallet = msg.sender;
    }

    modifier onlyOwner() {
        require(IFactory(masterFactory).owner() == msg.sender, "Only Owner can call");
        _;
    }

    function setImpl(
        address _implFund,
        address _implEquityConfig
    ) external onlyOwner{
        implFund = _implFund;
        implEquityConfig = _implEquityConfig;
        emit ImplementationsUpdated(implFund, implEquityConfig);
    }

    function setMasterFactory(address factory_) external onlyOwner{
        masterFactory = factory_;
        emit MasterFactoryUpdated(masterFactory);
    }

    function setFee(address _token, 
                uint16 _escrowFee,
                uint16 _wrapFee,
                uint16 _dividendFee,
                uint16 _redemptionFee,
                string memory actionID) external onlyOwner{
        require(!adminFeeSet[_token], "Admin Fee Reset Not Allowed!!");
        if((_escrowFee < 0 && _escrowFee >2000) && 
            (_wrapFee < 0 && _wrapFee >2000) &&
            (_dividendFee < 0 && _dividendFee > 2000) &&
            (_redemptionFee < 0 && _redemptionFee > 2000)){
                revert FeeOutOfBound();
        }

        Fee[_token].escrowFee = _escrowFee;
        Fee[_token].wrapFee = _wrapFee;
        Fee[_token].dividendFee = _dividendFee;
        Fee[_token].redemptionFee = _redemptionFee;

        adminFeeSet[_token] = true;
        
        emit AdminFeeUpdated(
                _token, 
                _escrowFee,
                _wrapFee,
                _dividendFee,
                _redemptionFee, 
                actionID, 
                block.timestamp);
        }

    function setAdminWallet(address _newWallet, string calldata _actionID) external onlyOwner{
        require(_newWallet != address(0),"Zero Address");
        adminWallet = _newWallet;
        emit AdminWalletUpdated(adminWallet, _actionID, block.timestamp);
    }

    function createFund (address _token, 
        bytes memory _data, 
        uint256 _totalTokenSupply,
        string memory mappingValue) external onlyOwner{

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

            fundLinked[_token] = _proxy;
            assetType[_token] = 1;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit FundCreated(_proxy,mappingValue);
    }

    function createEquityConfig (address _token, 
        bytes memory _data, 
        uint256 _totalTokenSupply,
        string memory mappingValue) external onlyOwner{

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

            fundLinked[_token] = _proxy;
            assetType[_token] = 2;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit EquityConfigCreated(_proxy, mappingValue);
    }

    function getEscrowFee(address _token) external view returns(uint16){
        return Fee[_token].escrowFee;
    }

    function getWrapFee(address _token) external view returns(uint16){
        return Fee[_token].wrapFee;
    }

    function getDividendFee(address _token) external view returns(uint16){
        return Fee[_token].dividendFee;
    }

    function getRedemptionFee(address _token) external view returns(uint16){
        return Fee[_token].redemptionFee;
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