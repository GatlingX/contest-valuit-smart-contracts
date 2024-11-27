// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IFundFactory {

    function getAdminFee(address _token) external view returns(uint16);

    function getAdminWallet() external view returns(address);
}
