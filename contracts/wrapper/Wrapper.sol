//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "contracts/wrapper/WrapperStorage.sol";
import "../roles/AgentRole.sol";
import "contracts/proxy/ProxyV1.sol";
import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "contracts/onchainID/interface/IIdentity.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/fund/IFactory.sol";
import "contracts/escrow/IEscrowController.sol";
import "contracts/fund/IFund.sol";
import "contracts/fund/IEquityConfig.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract Wrapper is WrapperStorage,Initializable,OwnableUpgradeable{

    function init(address _erc20Impl, address _fundFactory) public initializer{
        require(_erc20Impl != address(0) && _fundFactory != address(0),"INVALID! Zero Address");
        implERC20 = _erc20Impl;
        fundFactory = _fundFactory;
        __Ownable_init_unchained();
    }

    function setOnchainID(address _onChainID) public {
        require(IFactory(IFundFactory(fundFactory).getMasterFactory()).owner() == msg.sender,"Only Owner can call");
        wrapperOnchainID = _onChainID;
    }

    function setFundFactory(address fundFactory_) public {
        require(fundFactory_ != address(0),"INVALID! Zero Address");
        require(IFactory(IFundFactory(fundFactory).getMasterFactory()).owner() == msg.sender,"Only Owner can call");
        fundFactory = fundFactory_;
    }

    function setEscrowController(address escrowController_) public {
        require(escrowController_ != address(0),"INVALID! Zero Address");
        require(IFactory(IFundFactory(fundFactory).getMasterFactory()).owner() == msg.sender,"Only Owner can call");
        escrowController = escrowController_;
    }

    function setStableCoin(string calldata _stablecoin) public {
        require(IFactory(IFundFactory(fundFactory).getMasterFactory()).owner() == msg.sender,"Only Owner can call");
        require(IEscrowController(escrowController).getStableCoin(_stablecoin) != address(0), "Invalid Stable Coin!");
        stableCoin = IEscrowController(escrowController).getStableCoin(_stablecoin);
    }

    function createWrapToken(address _erc3643, uint16 _countryCode) public {
        require(_erc3643 != address(0),"INVALID! Zero Address");
        require(!isWrapped[_erc3643], "Token already wrapped");
        require (AgentRole(_erc3643).isAgent(msg.sender), "Invalid Creator");

        string memory name = string.concat("W",IToken(_erc3643).name());
        string memory symbol = string.concat("W",IToken(_erc3643).symbol());
        uint8 decimals = IToken(_erc3643).decimals();

        _proxy =address(new ProxyV1());

        (bool success, ) = _proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implERC20)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

        (success, ) = _proxy.call(
            abi.encodeWithSelector(
                0xf57b0182, name, symbol, decimals
            ));
            require(success, "Wrap Contract Initialization Failed");

        IIdentityRegistry ir = IToken(_erc3643).identityRegistry();

        ir.registerIdentity(address(this), IIdentity(wrapperOnchainID), _countryCode);

        getERC20[_erc3643] = _proxy;
        getERC3643[_proxy] = _erc3643;
        isWrapped[_erc3643] = true;
        
        emit WrapTokenCreated(_erc3643,_proxy);
    }

    function toERC20(address _erc3643, uint256 _amount) public {
        require(isWrapped[_erc3643] && getERC20[_erc3643] != address(0), "Wrap Token not created");

        address fund = IFundFactory(fundFactory).getFund(_erc3643);
        uint8 fundType = IFundFactory(fundFactory).getAssetType(_erc3643);

        if(fundType == 1){

            TransferHelper.safeTransferFrom(
            _erc3643,
            msg.sender, 
            address(this),
            _amount);

            if(IFundFactory(fundFactory).getAdminFee(_erc3643) != 0){
                uint256 tokenPrice = (IFund(fund).getNAV() * 10 ** 18 / IFundFactory(fundFactory).getTokenTotalSupply(_erc3643));
                uint256 orderValue = (((_amount/(10**IToken(_erc3643).decimals())) * tokenPrice) * (10**IToken(stableCoin).decimals()))/10 ** 18;
                uint256 taxAmount = (orderValue * IFundFactory(fundFactory).getAdminFee(_erc3643))/10000;
                TransferHelper.safeTransferFrom(
                stableCoin,
                msg.sender, 
                IFundFactory(fundFactory).getAdminWallet(),
                taxAmount);
            }
            
            IToken(getERC20[_erc3643]).mint(msg.sender, _amount);
            lockedERC3643[_erc3643] += _amount;
            emit TokenLocked(_erc3643, _amount);
        }

        if(fundType == 2){

            TransferHelper.safeTransferFrom(
            _erc3643,
            msg.sender, 
            address(this),
            _amount);

            if(IFundFactory(fundFactory).getAdminFee(_erc3643) != 0){
                uint256 tokenPrice = (IEquityConfig(fund).getCurrentValuation() * 10 ** 18 / IFundFactory(fundFactory).getTokenTotalSupply(_erc3643));
                uint256 orderValue = (((_amount/(10**IToken(_erc3643).decimals())) * tokenPrice) * (10**IToken(stableCoin).decimals()))/10 ** 18;
                uint256 taxAmount = (orderValue * IFundFactory(fundFactory).getAdminFee(_erc3643))/10000;
                TransferHelper.safeTransferFrom(
                stableCoin,
                msg.sender, 
                IFundFactory(fundFactory).getAdminWallet(),
                taxAmount);
            }

            IToken(getERC20[_erc3643]).mint(msg.sender, _amount);
            lockedERC3643[_erc3643] += _amount;
            emit TokenLocked(_erc3643, _amount);
        }
    }

    function toERC3643(address _erc20, uint256 _amount) public {
        require(getERC3643[_erc20] != address(0), "ERC3643 Token doesn't exist");

        address fund = IFundFactory(fundFactory).getFund(getERC3643[_erc20]);
        uint8 fundType = IFundFactory(fundFactory).getAssetType(getERC3643[_erc20]);

        if(fundType == 1){

            if(IFundFactory(fundFactory).getAdminFee(getERC3643[_erc20]) != 0){
                uint256 tokenPrice = (IFund(fund).getNAV() * 10 ** 18 / IFundFactory(fundFactory).getTokenTotalSupply(getERC3643[_erc20]));
                uint256 orderValue = (((_amount/(10**IToken(getERC3643[_erc20]).decimals())) * tokenPrice) * (10**IToken(stableCoin).decimals()))/10 ** 18;
                uint256 taxAmount = (orderValue * IFundFactory(fundFactory).getAdminFee(getERC3643[_erc20]))/10000;
                TransferHelper.safeTransferFrom(
                stableCoin,
                msg.sender, 
                IFundFactory(fundFactory).getAdminWallet(),
                taxAmount);
            }

            IToken(_erc20).burn(msg.sender, _amount);
            TransferHelper.safeTransfer(
            getERC3643[_erc20], 
            msg.sender, 
            _amount);
            lockedERC3643[getERC3643[_erc20]] -= _amount;
            emit TokenUnlocked(getERC3643[_erc20], _amount);
        }

        if(fundType == 2){

            if(IFundFactory(fundFactory).getAdminFee(getERC3643[_erc20]) != 0){
                uint256 tokenPrice = (IEquityConfig(fund).getCurrentValuation() * 10 ** 18/ IFundFactory(fundFactory).getTokenTotalSupply(getERC3643[_erc20]));
                uint256 orderValue = (((_amount/(10**IToken(getERC3643[_erc20]).decimals())) * tokenPrice) * (10**IToken(stableCoin).decimals()))/10 ** 18;
                uint256 taxAmount = (orderValue * IFundFactory(fundFactory).getAdminFee(getERC3643[_erc20]))/10000;
                TransferHelper.safeTransferFrom(
                stableCoin,
                msg.sender, 
                IFundFactory(fundFactory).getAdminWallet(),
                taxAmount);
            }
           
            IToken(_erc20).burn(msg.sender, _amount);
            TransferHelper.safeTransfer(
            getERC3643[_erc20], 
            msg.sender, 
            _amount);
            lockedERC3643[getERC3643[_erc20]] -= _amount;
            emit TokenUnlocked(getERC3643[_erc20], _amount);
        }
    }
}