// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IWrapper {

     event WrapTokenCreated(
        address _erc3643,
        address _erc20
    );

    event TokenLocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 _tax,
        uint256 timestamp
    );

    event TokenUnlocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 _tax,
        uint256 timestamp
    );

    event OnChainIDUpdated(
        address _newID
    );

    event FundFactoryUpdated(
        address fundFactory
    );

    event EscrowControllerUpdated(
        address escrowController
    );

    event StableCoinUpdated(
        address stableCoinAddress,
        string stableCoin
    );

}

