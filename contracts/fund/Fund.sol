// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import 'contracts/fund/IFund.sol';
import 'contracts/fund/ITKN.sol';
import 'contracts/factory/IFundFactory.sol';
import 'contracts/escrow/TransferHelper.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/fund/FundStorage.sol";


contract Fund is IFund, Initializable, FundStorage{

    /**
     * @dev Initializes the Fund contract with token details and initial parameters.
     * @param _token The address of the token associated with the fund.
     * @param _data Encoded data containing fund-specific parameters.
     */
    function init(address _token, bytes memory _data) external initializer{
        factory = address(msg.sender);

        token = _token;
        fundName = IToken(_token).name();

        (propertyType, 
        NAVLaunchPrice,
        cusip,
        projectedYield) = abi.decode(_data, (uint256, uint256, string, uint256));

        _setValues(_data);
        FEE_DENOMINATOR = 10000;
    }

    /**
     * @dev Modifier to restrict function access to only agents of the token.
     */
    modifier onlyAgent() {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        _;
    }

    /**
     *  @dev See {IFund-getNAV}.
     */
    function getNAV() view external returns (uint256){
        return NAVLatestPrice;
    }

    /**
     *  @dev See {IFund-getToken}.
     */
    function getToken() view external returns (address){
        return token;
    }

    /**
     * @dev Checks the status of a dividend distribution.
     * @param _id The unique identifier of the dividend.
     * @return True if the dividend has been distributed, otherwise false.
     */
    function getDividendStatus(string calldata _id) public view returns(bool){
        return dividendStatus[_id];
    }

    /**
     *  @dev See {IFund-getOffChainPrice}.
     */
    function getOffChainPrice() public view returns(uint256){
        return tokenPrice;
    }

    /**
     *  @dev See {IFund-getOffChainPriceStatus}.
     */
    function getOffChainPriceStatus() public view returns(bool){
        return offChainPrice;
    }

    /**
     *  @dev See {IFund-setNAV}.
     */
    function setNAV(uint256 _latestNAV, string memory actionID) external onlyAgent returns(bool){
        NAVLatestPrice = _latestNAV;
        emit NAVUpdated(_latestNAV, actionID);
        return true;
    }

    /**
     * @dev Updates the off-chain asset price.
     * @param _newPrice The new off-chain asset price.
     */
    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent{
        tokenPrice = _newPrice;
        emit AssetPriceOffChainUpdated(_newPrice);
    }

    /**
     * @dev Enables or disables the use of off-chain pricing.
     * @param _status A boolean indicating whether off-chain pricing is enabled (true) or disabled (false).
     */
    function setOffChainPrice(bool _status) external onlyAgent{
        offChainPrice = _status;
        emit OffChainPriceUpdated(_status);
    }

    /**
     *  @dev See {IFund-shareDividend}.
     */
    function shareDividend(address _address, 
                            uint256 _dividend,
                            string calldata _userIds,
                            string calldata _dividendIds,  
                            address stableCoin_,
                            address _agent) external onlyAgent{
        require(!dividendStatus[_dividendIds],"Dividend Already Distributed");

        uint16 dividendFee = IFundFactory(factory).getDividendFee(token);
        address adminWallet = IFundFactory(factory).getAdminWallet();
        uint256 adminFeeAmount = (_dividend * dividendFee) / FEE_DENOMINATOR;
        uint256 netAmount = _dividend - adminFeeAmount;

        dividendStatus[_dividendIds] = true;

        TransferHelper.safeTransferFrom(stableCoin_, _agent, _address, netAmount);
        TransferHelper.safeTransferFrom(stableCoin_, _agent, adminWallet, adminFeeAmount);
        emit DividendDistributed(_address, netAmount, adminFeeAmount, _userIds, _dividendIds);
    }

    /**
     * @dev Updates the minimum investment amount.
     * @param _newMinInvestment The new minimum investment amount.
     * @param actionID A unique identifier for the update action.
     */
    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent{
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    /**
     * @dev Updates the maximum investment amount.
     * @param _newMaxInvestment The new maximum investment amount.
     * @param actionID A unique identifier for the update action.
     */
    function setMaxInvestment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent{
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    /**
     * @dev Updates the projected yield of the fund.
     * @param _newProjectedYield The new projected yield percentage.
     * @param actionID A unique identifier for the update action.
     */
    function setProjectedYield(uint256 _newProjectedYield, string memory actionID) external onlyAgent{
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

    /**
     * @dev Internal function to decode and set various fund parameters.
     * @param _data Encoded data containing additional fund settings.
     */
    function _setValues (bytes memory _data) internal{
        (, 
        ,
        ,
        ,
        NAVLatestPrice,
        minInvestment,
        maxInvestment) = abi.decode(_data, (uint256, uint256, string, uint256, uint256, uint256, uint256));
    }
}