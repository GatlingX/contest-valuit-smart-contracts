// SPDX-License-Identifier: GPL-3.0


pragma solidity 0.8.17;

import "contracts/fund/ITKN.sol";
import "contracts/fund/IEquityConfig.sol";
import 'contracts/factory/IFundFactory.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/fund/EquityConfigStorage.sol";
import 'contracts/escrow/TransferHelper.sol';


contract EquityConfig is Initializable, EquityConfigStorage, IEquityConfig {

    /**
     * @dev Initializes the EquityConfig contract with token details and investment parameters.
     * @param _token The address of the token associated with this equity configuration.
     * @param _data Encoded data containing minInvestment, maxInvestment, launchValuation, projectedYield, and DERatio.
     */
    function init(address _token, bytes memory _data) external initializer{
        factory = address(msg.sender);

        token = _token;
        fundName = IToken(_token).name();

        (minInvestment, 
        maxInvestment,
        launchValuation,
        projectedYield,
        DERatio) = abi.decode(_data, (uint256, uint256, uint256, uint256, string));
        currentValuation = launchValuation;
        FEE_DENOMINATOR = 10000;
    }

    /**
     * @dev Modifier to restrict function access to only agents of the associated token.
     */
    modifier onlyAgent() {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        _;
    }

    /**
     * @dev Distributes dividends to an investor, deducting applicable fees.
     * @param _address The investor's address receiving the dividend.
     * @param _dividend The total dividend amount.
     * @param _userIds The unique user ID associated with the investor.
     * @param _dividendIds The unique ID associated with the dividend.
     * @param stableCoin_ The address of the stablecoin used for dividend distribution.
     * @param _agent The agent responsible for processing the dividend distribution.
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
     *  @dev See {IEquityConfig-setValuation}.
     */
    function setValuation(uint256 _latestValuation, string memory actionID) external onlyAgent returns(bool){
        previousValutaion = currentValuation;
        currentValuation = _latestValuation;
        emit ValuationUpdated(_latestValuation, actionID);
        return true;
    }

    /**
     * @dev Updates the minimum investment amount.
     * @param _newMinInvestment The new minimum investment value.
     * @param actionID A unique identifier for the update action.
     */
    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent{
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    /**
     * @dev Updates the maximum investment amount.
     * @param _newMaxInvestment The new maximum investment value.
     * @param actionID A unique identifier for the update action.
     */
    function setMaxInvesrment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent{
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    /**
     * @dev Updates the projected yield percentage.
     * @param _newProjectedYield The new projected yield value.
     * @param actionID A unique identifier for the update action.
     */
    function setProjectedYeild(uint256 _newProjectedYield, string memory actionID) external onlyAgent{
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

    /**
     * @dev Updates the Debt-to-Equity (D/E) ratio.
     * @param _newDERatio The new D/E ratio.
     * @param actionID A unique identifier for the update action.
     */
    function setDERatio(string memory _newDERatio, string memory actionID) external onlyAgent{
        DERatio = _newDERatio;
        emit DERatioUpdated(_newDERatio, actionID);
    }

    /**
     * @dev Updates the off-chain asset price.
     * @param _newPrice The new asset price.
     */
    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent{
        tokenPrice = _newPrice;
        emit AssetPriceOffChainUpdated(_newPrice);
    }

    /**
     * @dev Enables or disables off-chain pricing.
     * @param _status The new status for off-chain pricing (true = enabled, false = disabled).
     */
    function setOffChainPrice(bool _status) external onlyAgent{
        offChainPrice = _status;
        emit OffChainPriceUpdated(_status);
    }

    /**
     *  @dev See {IEquityConfig-getCurrentValuation}.
     */
    function getCurrentValuation() external view returns(uint256){
        return currentValuation;
    }

    /**
     *  @dev See {IEquityConfig-getMinInvestment}.
     */
    function getMinInvestment() external view returns(uint256){
        return minInvestment;
    }

    /**
     *  @dev See {IEquityConfig-getMaxInvestment}.
     */
    function getMaxInvestment() external view returns(uint256){
        return maxInvestment;
    }

    /**
     *  @dev See {IEquityConfig-getProjectedYield}.
     */
    function getProjectedYield() external view returns(uint256){
        return projectedYield;
    }

    /**
     *  @dev See {IEquityConfig-getDERatio}.
     */
    function getDERatio() external view returns(string memory){
        return DERatio;
    }

    /**
     *  @dev See {IEquityConfig-getLaunchValuation}.
     */
    function getLaunchValuation() external view returns(uint256){
        return launchValuation;
    }

    /**
     *  @dev See {IEquityConfig-getPreviousValutaion}.
     */
    function getPreviousValutaion() external view returns(uint256){
        return previousValutaion;
    }

    /**
     *  @dev See {IEquityConfig-getOffChainPrice}.
     */
    function getOffChainPrice() public view returns(uint256){
        return tokenPrice;
    }

    /**
     *  @dev See {IEquityConfig-getOffChainPriceStatus}.
     */
    function getOffChainPriceStatus() public view returns(bool){
        return offChainPrice;
    }

    /**
     *  @dev See {IEquityConfig-getToken}.
     */
    function getToken() view external returns (address){
        return token;
    }
}
