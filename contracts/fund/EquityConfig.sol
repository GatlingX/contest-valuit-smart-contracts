// SPDX-License-Identifier: GPL-3.0


pragma solidity 0.8.17;

import "contracts/fund/EquityConfigStorage.sol";
import 'contracts/fund/ITKN.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


contract EquityConfig is Initializable, EquityConfigStorage {

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
    }

    modifier onlyAgent(address _token) {
        require(ITKN(_token).isAgent(msg.sender), "Only Token Agent can call");
        _;
    }

    function setValuation(uint256 _latestValuation, string memory actionID) external onlyAgent(token) returns(bool){
        previousValutaion = currentValuation;
        currentValuation = _latestValuation;
        emit ValuationUpdated(_latestValuation, actionID);
        return true;
    }

    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent(token){
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    function setMaxInvesrment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent(token){
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    function setProjectedYeild(uint256 _newProjectedYield, string memory actionID) external onlyAgent(token){
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

    function setDERatio(string memory _newDERatio, string memory actionID) external onlyAgent(token){
        DERatio = _newDERatio;
        emit DERatioUpdated(_newDERatio, actionID);
    }

    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent(token){
        tokenPrice = _newPrice;
    }

    function setOffChainPrice(bool _status) external onlyAgent(token){
        offChainPrice = _status;
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
}
