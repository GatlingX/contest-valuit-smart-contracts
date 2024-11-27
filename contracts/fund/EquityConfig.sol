// SPDX-License-Identifier: GPL-3.0


pragma solidity ^0.8.0;

import "contracts/fund/EquityConfigStorage.sol";
import "contracts/factory/ITREXFactory.sol";
import 'contracts/fund/ITKN.sol';
import 'contracts/escrow/TransferHelper.sol';
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract EquityConfig is Initializable, EquityConfigStorage, OwnableUpgradeable {

    function init(address _token, bytes memory _data) external initializer{
        _transferOwnership(msg.sender);
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

    function setValuation(uint256 _latestValuation, string memory actionID) external returns(bool){
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        previousValutaion = currentValuation;
        currentValuation = _latestValuation;
        emit ValuationUpdated(_latestValuation, actionID);
        return true;
    }

    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    function setMaxInvesrment(uint256 _newMaxInvestment, string memory actionID) external {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    function setProjectedYeild(uint256 _newProjectedYield, string memory actionID) external {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

    function setDERatio(string memory _newDERatio, string memory actionID) external {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        DERatio = _newDERatio;
        emit DERatioUpdated(_newDERatio, actionID);
    }

}
