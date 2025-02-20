//SPDX-License-Identifier: GPL-3.0

import "contracts/proxy/ProxyV1.sol";
import "contracts/fund/IFactory.sol";
import "contracts/token/IToken.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "../roles/AgentRole.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/factory/FundFactoryStorage.sol";


pragma solidity 0.8.17;

contract FundFactory is
    FundFactoryStorage, IFundFactory,
    Initializable
{
    /**
     * @dev Initializes the contract with the given master factory address.
     *      This function can only be called once due to the `initializer` modifier.
     * @param _factory Address of the master factory contract.
     */
    function init(address _factory) external initializer {
        masterFactory = _factory;
        adminWallet = msg.sender;
    }

    /**
     * @dev Modifier to restrict access to only the owner of the master factory.
     */
    modifier onlyOwner() {
        require(IFactory(masterFactory).owner() == msg.sender, "Only Owner can call");
        _;
    }

    /**
     * @dev Sets the implementation addresses for Fund and Equity Configuration.
     *      Can only be called by the owner.
     * @param _implFund Address of the Fund implementation contract.
     * @param _implEquityConfig Address of the Equity Configuration implementation contract.
     */
    function setImpl(
        address _implFund,
        address _implEquityConfig
    ) external onlyOwner{
        implFund = _implFund;
        implEquityConfig = _implEquityConfig;
        emit ImplementationsUpdated(implFund, implEquityConfig);
    }

    /**
     * @dev Updates the master factory address.
     *      Can only be called by the owner.
     * @param factory_ New master factory address.
     */
    function setMasterFactory(address factory_) external onlyOwner{
        masterFactory = factory_;
        emit MasterFactoryUpdated(masterFactory);
    }

    /**
     * @dev Sets various fee parameters for a given token.
     *      The fee values must not exceed 20% (2000 basis points).
     *      Once set, admin fees cannot be reset.
     *      Can only be called by the owner.
     * @param _token Address of the token.
     * @param _escrowFee Fee for escrow transactions (in basis points).
     * @param _wrapFee Fee for wrapping assets (in basis points).
     * @param _dividendFee Fee for dividend distributions (in basis points).
     * @param _redemptionFee Fee for token redemptions (in basis points).
     * @param actionID Unique identifier for tracking the action.
     */
    function setFee(address _token, 
                uint16 _escrowFee,
                uint16 _wrapFee,
                uint16 _dividendFee,
                uint16 _redemptionFee,
                string memory actionID) external onlyOwner{
        require(!adminFeeSet[_token], "Admin Fee Reset Not Allowed!!");
        if (
                _escrowFee > 2000 ||
                _wrapFee > 2000 ||
                _dividendFee > 2000 ||
                _redemptionFee > 2000
            ) {
                revert FeeOutOfBound();
            }


        Fee[_token].escrowFee = _escrowFee;
        Fee[_token].wrapFee = _wrapFee;
        Fee[_token].dividendFee = _dividendFee;
        Fee[_token].redemptionFee = _redemptionFee;

        adminFeeSet[_token] = true;
        
        emit AdminFeeUpdated(
                _token, 
                _escrowFee,
                _wrapFee,
                _dividendFee,
                _redemptionFee, 
                actionID, 
                block.timestamp);
        }

    /**
     * @dev Updates the admin wallet address.
     *      Can only be called by the owner.
     * @param _newWallet New admin wallet address.
     * @param _actionID Unique identifier for tracking the action.
     */
    function setAdminWallet(address _newWallet, string calldata _actionID) external onlyOwner{
        require(_newWallet != address(0),"Zero Address");
        adminWallet = _newWallet;
        emit AdminWalletUpdated(adminWallet, _actionID, block.timestamp);
    }

    /**
     * @dev Creates a new fund contract and links it to the specified token.
     *      Uses a proxy contract for upgradeability.
     *      Can only be called by the owner.
     * @param _token Address of the token to be linked to the fund.
     * @param _data Initialization data for the fund.
     * @param _totalTokenSupply Total supply of the fund tokens.
     * @param mappingValue Identifier for mapping the created fund.
     */
    function createFund (address _token, 
        bytes memory _data, 
        uint256 _totalTokenSupply,
        string memory mappingValue) external onlyOwner{

        require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

        address _proxy =address(new ProxyV1());

        (bool success, ) = _proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implFund)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

            (success, ) = _proxy.call(
                abi.encodeWithSelector(
                    0xc0d91eaf, _token, _data
                ));
            require(success, "FUND Intiatialization Failed");

            fundLinked[_token] = _proxy;
            assetType[_token] = 1;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit FundCreated(_proxy,mappingValue);
    }

    /**
     * @dev Creates a new equity configuration contract and links it to the specified token.
     *      Uses a proxy contract for upgradeability.
     *      Can only be called by the owner.
     * @param _token Address of the token to be linked to the equity configuration.
     * @param _data Initialization data for the equity configuration.
     * @param _totalTokenSupply Total supply of the equity tokens.
     * @param mappingValue Identifier for mapping the created equity configuration.
     */
    function createEquityConfig (address _token, 
        bytes memory _data, 
        uint256 _totalTokenSupply,
        string memory mappingValue) external onlyOwner{

            require(fundLinked[_token] == address(0), "Token already linked to a Fund or Equity");

            address _proxy =address(new ProxyV1());

            (bool success, ) = _proxy.call(
                abi.encodeWithSelector(0x3659cfe6, implEquityConfig)
            );
            require(success, "Proxy Upgrade Failed");
            success = false;

            (success, ) = _proxy.call(
                abi.encodeWithSelector(
                    0xc0d91eaf, _token, _data
                ));
            require(success, "Equity Configuration Intiatialization Failed");

            fundLinked[_token] = _proxy;
            assetType[_token] = 2;
            tokenTotalSupply[_token] = _totalTokenSupply;
            emit EquityConfigCreated(_proxy, mappingValue);
    }

    // Getter functions

    /**
     *  @dev See {IFundFactory-getEscrowFee}.
     */
    function getEscrowFee(address _token) external view returns(uint16){
        return Fee[_token].escrowFee;
    }

    /**
     *  @dev See {IFundFactory-getWrapFee}.
     */
    function getWrapFee(address _token) external view returns(uint16){
        return Fee[_token].wrapFee;
    }

    /**
     *  @dev See {IFundFactory-getDividendFee}.
     */
    function getDividendFee(address _token) external view returns(uint16){
        return Fee[_token].dividendFee;
    }

    /**
     *  @dev See {IFundFactory-getRedemptionFee}.
     */
    function getRedemptionFee(address _token) external view returns(uint16){
        return Fee[_token].redemptionFee;
    }

    /**
     *  @dev See {IFundFactory-getAdminWallet}.
     */
    function getAdminWallet() external view returns(address){
        return adminWallet;
    }

    /**
     *  @dev See {IFundFactory-getFund}.
     */
    function getFund(address _token) external view returns(address){
        return fundLinked[_token];
    }

    /**
     *  @dev See {IFundFactory-getAssetType}.
     */
    function getAssetType(address _token) external view returns(uint8){
        return assetType[_token];
    }

    /**
     *  @dev See {IFundFactory-getMasterFactory}.
     */
    function getMasterFactory() external view returns(address){
        return masterFactory;
    }

    /**
     *  @dev See {IFundFactory-getTokenTotalSupply}.
     */
    function getTokenTotalSupply(address _token) external view returns(uint256){
        return tokenTotalSupply[_token];
    }
}