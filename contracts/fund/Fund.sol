// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import 'contracts/fund/IFund.sol';
import "contracts/fund/FundStorage.sol";
import 'contracts/fund/ITKN.sol';
import 'contracts/escrow/TransferHelper.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


contract Fund is IFund, Initializable, FundStorage {

    function init(address _token, bytes memory _data) external initializer{
        factory = address(msg.sender);

        token = _token;
        fundName = IToken(_token).name();

        (propertyType, 
        NAVLaunchPrice,
        cusip,
        projectedYield) = abi.decode(_data, (uint256, uint256, string, uint256));

        _setValues(_data);
    }

    modifier onlyAgent(address _token) {
        require(ITKN(_token).isAgent(msg.sender), "Only Token Agent can call");
        _;
    }

    function getNAV() view external returns (uint256){
        return NAVLatestPrice;
    }

    function getToken() view external returns (address){
        return token;
    }

    function getDividendStatus(string calldata _id) public view returns(bool){
        return dividendStatus[_id];
    }

    function getOffChainPrice() public view returns(uint256){
        return tokenPrice;
    }

    function getOffChainPriceStatus() public view returns(bool){
        return offChainPrice;
    }

    function setNAV(uint256 _latestNAV, string memory actionID) external onlyAgent(token) returns(bool){
        NAVLatestPrice = _latestNAV;
        emit NAVUpdated(_latestNAV, actionID);
        return true;
    }

    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent(token){
        tokenPrice = _newPrice;
    }

    function setOffChainPrice(bool _status) external onlyAgent(token){
        offChainPrice = _status;
    }

    function shareDividend(address _address, 
                            uint256 _dividend,
                            string calldata _userIds,
                            string calldata _dividendIds,  
                            address stableCoin_,
                            address _agent) public onlyAgent(token){
        require(!dividendStatus[_dividendIds],"Dividend Already Distributed");
    
        TransferHelper.safeTransferFrom(stableCoin_, _agent, _address, _dividend);
        dividendStatus[_dividendIds] = true;
        emit DividendDistributed(_address, _dividend, _userIds, _dividendIds);
        
    }

    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent(token){
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    function setMaxInvestment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent(token){
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    function setProjectedYield(uint256 _newProjectedYield, string memory actionID) external onlyAgent(token){
        projectedYield = _newProjectedYield;
        emit ProjectedYieldUpdated(_newProjectedYield, actionID);
    }

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