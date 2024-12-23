//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

contract WrapperStorage {

    
    mapping(address => address) public getERC20;
    mapping(address => address) public getERC3643;    
    mapping(address => bool) public isWrapped;
    mapping(address => uint256) public lockedERC3643;

    address public implERC20;
    address internal _proxy;
    address public wrapperOnchainID;
    address public fundFactory;
    address public escrowController;
    address public stableCoin;

    /**
     * @dev Storage gap to reserve space for future upgrades.
     */
    uint256[50] private __gap; 

}