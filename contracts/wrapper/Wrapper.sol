//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/wrapper/WrapperStorage.sol";
import "../roles/AgentRole.sol";
import "contracts/proxy/ProxyV1.sol";
import "contracts/token/IToken.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "contracts/onchainID/interface/IIdentity.sol";
import "contracts/escrow/TransferHelper.sol";


contract Wrapper is Ownable, WrapperStorage{

    constructor(address _erc20Impl) {
        require(_erc20Impl != address(0),"INVALID! Zero Address");
        implERC20 = _erc20Impl;
    }

    function setOnchainID(address _onChainID) public onlyOwner{
        wrapperOnchainID = _onChainID;
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
            require(success, "Wrap Contract Creation Failed");

        IIdentityRegistry ir = IToken(_erc3643).identityRegistry();

        ir.registerIdentity(address(this), IIdentity(wrapperOnchainID), _countryCode);

        getERC20[_erc3643] = _proxy;
        getERC3643[_proxy] = _erc3643;
        isWrapped[_erc3643] = true;
        
        emit WrapTokenCreated(_erc3643,_proxy);
    }

    function toERC20(address _erc3643, uint256 _amount) public {
        require(isWrapped[_erc3643] && getERC20[_erc3643] != address(0), "Wrap Token not created");

        TransferHelper.safeTransferFrom(_erc3643,msg.sender, address(this),_amount);
        IToken(getERC20[_erc3643]).mint(msg.sender, _amount);

        lockedERC3643[_erc3643] += _amount;

        emit TokenLocked(_erc3643, _amount);   
    }

    function toERC3643(address _erc20, uint256 _amount) public {
        require(getERC3643[_erc20] != address(0), "ERC3643 Token doesn't exist");

        IToken(_erc20).burn(msg.sender, _amount);
        TransferHelper.safeTransfer(getERC3643[_erc20], msg.sender, _amount);

        lockedERC3643[getERC3643[_erc20]] -= _amount;

        emit TokenUnlocked(getERC3643[_erc20], _amount);
    }
}