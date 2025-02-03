// SPDX-License-Identifier: GPL-3.0


pragma solidity 0.8.17;

import "contracts/fund/ITKN.sol";
import "contracts/fund/IEquityConfig.sol";
import 'contracts/factory/IFundFactory.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/fund/EquityConfigStorage.sol";
import 'contracts/escrow/TransferHelper.sol';


contract EquityConfig is Initializable, EquityConfigStorage, IEquityConfig {

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

    modifier onlyAgent() {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        _;
    }

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

    function setValuation(uint256 _latestValuation, string memory actionID) external onlyAgent returns(bool){
        previousValutaion = currentValuation;
        currentValuation = _latestValuation;
        emit ValuationUpdated(_latestValuation, actionID);
        return true;
    }

    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent{
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    function setMaxInvesrment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent{
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    function setProjectedYeild(uint256 _newProjectedYield, string memory actionID) external onlyAgent{
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

    function setDERatio(string memory _newDERatio, string memory actionID) external onlyAgent{
        DERatio = _newDERatio;
        emit DERatioUpdated(_newDERatio, actionID);
    }

    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent{
        tokenPrice = _newPrice;
        emit AssetPriceOffChainUpdated(_newPrice);
    }

    function setOffChainPrice(bool _status) external onlyAgent{
        offChainPrice = _status;
        emit OffChainPriceUpdated(_status);
    }

    function getCurrentValuation() external view returns(uint256){
        return currentValuation;
    }

    function getMinInvestment() external view returns(uint256){
        return minInvestment;
    }

    function getMaxInvestment() external view returns(uint256){
        return maxInvestment;
    }

    function getProjectedYield() external view returns(uint256){
        return projectedYield;
    }

    function getDERatio() external view returns(string memory){
        return DERatio;
    }

    function getLaunchValuation() external view returns(uint256){
        return launchValuation;
    }

    function getPreviousValutaion() external view returns(uint256){
        return previousValutaion;
    }

    function getOffChainPrice() public view returns(uint256){
        return tokenPrice;
    }

    function getOffChainPriceStatus() public view returns(bool){
        return offChainPrice;
    }

    function getToken() view external returns (address){
        return token;
    }
}
