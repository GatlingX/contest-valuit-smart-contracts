// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IFundFactory {

    function getAdminFee(address _token) external view returns(uint16);

    function getAdminWallet() external view returns(address);

    function getMasterFactory() external view returns(address);

    function getFund(address _token) external view returns(address);

    function getAssetType(address _token) external view returns(uint8);

    function getTokenTotalSupply(address _token) external view returns(uint256);
}
