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
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";



contract Wrapper is WrapperStorage,Initializable,OwnableUpgradeable{

    function init(address _erc20Impl) public initializer{
        require(_erc20Impl != address(0),"INVALID! Zero Address");
        implERC20 = _erc20Impl;
        __Ownable_init_unchained();
    }

    function setOnchainID(address _onChainID) public onlyOwner{
        wrapperOnchainID = _onChainID;
    }

    function setFundFactory(address fundFactory_) public onlyOwner{
        fundFactory = fundFactory_;
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

        uint16 adminFee = IFundFactory(fundFactory).getAdminFee(_erc3643);

        TransferHelper.safeTransferFrom(
            _erc3643,
            msg.sender, 
            address(this),
            _amount - ((_amount * adminFee)/10000));
        TransferHelper.safeTransferFrom(
            _erc3643,
            msg.sender, 
            IFundFactory(fundFactory).getAdminWallet(),
            (_amount * adminFee)/10000);

        IToken(getERC20[_erc3643]).mint(msg.sender, _amount - ((_amount * adminFee)/10000));

        lockedERC3643[_erc3643] += _amount - ((_amount * adminFee)/10000);

        emit TokenLocked(_erc3643, _amount - ((_amount * adminFee)/10000));
    }

    function toERC3643(address _erc20, uint256 _amount) public {
        require(getERC3643[_erc20] != address(0), "ERC3643 Token doesn't exist");

        uint16 adminFee = IFundFactory(fundFactory).getAdminFee(getERC3643[_erc20]);

        IToken(_erc20).burn(msg.sender, _amount);
        TransferHelper.safeTransfer(
            getERC3643[_erc20], 
            msg.sender, 
            _amount - ((_amount * adminFee)/10000));
        TransferHelper.safeTransfer(
            getERC3643[_erc20], 
            IFundFactory(fundFactory).getAdminWallet(), 
            ((_amount * adminFee)/10000));

        lockedERC3643[getERC3643[_erc20]] -= _amount;

        emit TokenUnlocked(getERC3643[_erc20], _amount);
    }
}