//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/wrapper/WrapperStorage.sol";
import "../roles/AgentRole.sol";
import "contracts/proxy/ProxyV1.sol";
import "contracts/token/IToken.sol";


contract Wrapper is Ownable, WrapperStorage{

    constructor(address _erc20Impl) {
        require(_erc20Impl != address(0),"INVALID! Zero Address");
        implERC20 = _erc20Impl;
    }

    function createWrapToken(address _erc3643) public {
        require(_erc3643 != address(0),"INVALID! Zero Address");
        require(!isWrapped[_erc3643], "Token already wrapped");
        require (AgentRole(_erc3643).isAgent(msg.sender), "Invalid Creator");

        string memory name = string.concat("W",IToken(_erc3643).name());
        string memory symbol = string.concat("W",IToken(_erc3643).symbol());
        uint8 decimals = IToken(_erc3643).decimals();

        proxy =address(new ProxyV1());

        (bool success, ) = proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implERC20)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

        (success, ) = proxy.call(
            abi.encodeWithSelector(
                0xf57b0182, name, symbol, decimals
            ));
            require(success, "Wrap Contract Creation Failed");

        getERC20[_erc3643] = proxy;
        getERC3643[proxy] = _erc3643;
        isWrapped[_erc3643] = true;
        
        emit wrapTokenCreated(_erc3643,proxy);
    }

    function toERC20() public {

    }
}