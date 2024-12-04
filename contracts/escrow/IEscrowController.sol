// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IEscrowController {

    function getStableCoin(string calldata _stablecoin) external view returns(address);

    function getStableCoinName(address stableCoin) external view returns(string memory);
}