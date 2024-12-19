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
import "contracts/compliance/modular/IModularCompliance.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


contract Wrapper is WrapperStorage,Initializable{

    function init(address _erc20Impl, address _fundFactory) public initializer{
        require(_erc20Impl != address(0) && _fundFactory != address(0),"INVALID! Zero Address");
        implERC20 = _erc20Impl;
        fundFactory = _fundFactory;
    }

    modifier onlyOwner(address _factory) {
        require(IFactory(_factory).owner() == msg.sender, "Only Owner can call");
        _;
    }


    function setOnchainID(address _onChainID) public onlyOwner((IFundFactory(fundFactory).getMasterFactory())){
        wrapperOnchainID = _onChainID;
        emit OnChainIDUpdated(_onChainID);
    }

    function setFundFactory(address fundFactory_) public onlyOwner((IFundFactory(fundFactory).getMasterFactory())){
        require(fundFactory_ != address(0),"INVALID! Zero Address");
        fundFactory = fundFactory_;
        emit FundFactoryUpdated(fundFactory_);
    }

    function setEscrowController(address escrowController_) public onlyOwner((IFundFactory(fundFactory).getMasterFactory())){
        require(escrowController_ != address(0),"INVALID! Zero Address");
        escrowController = escrowController_;
        emit EscrowControllerUpdated(escrowController_);
    }

    function setStableCoin(string calldata _stablecoin) public onlyOwner((IFundFactory(fundFactory).getMasterFactory())){
        require(IEscrowController(escrowController).getStableCoin(_stablecoin) != address(0), "Invalid Stable Coin!");
        stableCoin = IEscrowController(escrowController).getStableCoin(_stablecoin);
        emit StableCoinUpdated(stableCoin, _stablecoin);
    }

    function createWrapToken(address _erc3643, uint16 _countryCode) public {
        require(_erc3643 != address(0),"INVALID! Zero Address");
        require(!isWrapped[_erc3643], "Token already wrapped");
        require (AgentRole(_erc3643).isAgent(msg.sender), "Invalid Creator");
        require(IModularCompliance(IToken(_erc3643).compliance()).isWrapperSet(), "Wrapping disabled");
        require(IModularCompliance(IToken(_erc3643).compliance()).getWrapper() == address(this), "Invalid wrapper");

        string memory name = string.concat("VW",IToken(_erc3643).name());
        string memory symbol = string.concat("VW",IToken(_erc3643).symbol());
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
        require(IModularCompliance(IToken(_erc3643).compliance()).isWrapperSet(), "Wrapping disabled");
        require(IModularCompliance(IToken(_erc3643).compliance()).getWrapper() == address(this), "Invalid wrapper");

        TransferHelper.safeTransferFrom(
            _erc3643,
            msg.sender, 
            address(this),
            _amount);


        uint256 taxAmount = _takeTax(
                _erc3643,
                _amount,
                IToken(_erc3643).decimals(),
                IToken(stableCoin).decimals(),
                msg.sender,
                IFundFactory(fundFactory).getAdminWallet()
            );

            IToken(getERC20[_erc3643]).mint(msg.sender, _amount);
            lockedERC3643[_erc3643] += _amount;
            emit TokenLocked(_erc3643,getERC20[_erc3643], _amount, taxAmount, block.timestamp);
    }

    function toERC3643(address _erc20, uint256 _amount) public {
        require(getERC3643[_erc20] != address(0), "ERC3643 Token doesn't exist");

        uint256 taxAmount = _takeTax(
                getERC3643[_erc20],
                _amount,
                IToken(getERC3643[_erc20]).decimals(),
                IToken(stableCoin).decimals(),
                msg.sender,
                IFundFactory(fundFactory).getAdminWallet()
            );

        IToken(_erc20).burn(msg.sender, _amount);
            TransferHelper.safeTransfer(
            getERC3643[_erc20], 
            msg.sender, 
            _amount);
            lockedERC3643[getERC3643[_erc20]] -= _amount;
            emit TokenUnlocked(getERC3643[_erc20], _erc20, _amount, taxAmount, block.timestamp);
    }

    function _takeTax(
        address _erc3643,
        uint256 _amount,
        uint8 erc3643Decimals,
        uint8 stableCoinDecimals,
        address payer,
        address adminWallet
    ) internal returns(uint256){
        address fund = IFundFactory(fundFactory).getFund(_erc3643);
        uint8 fundType = IFundFactory(fundFactory).getAssetType(_erc3643);

        uint256 adminFee = IFundFactory(fundFactory).getAdminFee(_erc3643);
        
        if (adminFee == 0) return 0;

        uint256 netAssetValue = (fundType == 1)
            ? IFund(fund).getNAV()
            : IEquityConfig(fund).getCurrentValuation();

        require(IFundFactory(fundFactory).getTokenTotalSupply(_erc3643) > 0, "Token supply must be greater than zero");

        if(!IFund(fund).getOffChainPriceStatus()){
            // Calculate the token price in 18 decimals
            uint256 tokenPrice = (netAssetValue * (10 ** 18) / IFundFactory(fundFactory).getTokenTotalSupply(_erc3643));
            // Calculate the order value in stablecoin decimals
            uint256 orderValue = (((_amount / (10 ** erc3643Decimals)) * tokenPrice) * (10 ** stableCoinDecimals)) / (10 ** 18);
            // Calculate the admin fee (tax amount) in stablecoin decimals
            uint256 taxAmount = (orderValue * adminFee) / 10000;
            // Perform the tax transfer
            TransferHelper.safeTransferFrom(stableCoin, payer, adminWallet, taxAmount);
            return taxAmount;
        }
        else{
            //tokenPrice is with 6 decimals
            uint256 tokenPrice = IFund(fund).getOffChainPrice();
            uint256 orderValue = (((_amount / (10 ** erc3643Decimals)) * tokenPrice) * (10 ** stableCoinDecimals)) / (10 ** 6);
            uint256 taxAmount = (orderValue * adminFee) / 10000;
            // Perform the tax transfer
            TransferHelper.safeTransferFrom(stableCoin, payer, adminWallet, taxAmount);
            return taxAmount;
        }
    }
}