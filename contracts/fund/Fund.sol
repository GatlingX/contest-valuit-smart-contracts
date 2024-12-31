// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import 'contracts/fund/IFund.sol';
import 'contracts/fund/ITKN.sol';
import 'contracts/factory/IFundFactory.sol';
import 'contracts/escrow/TransferHelper.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/fund/FundStorage.sol";


contract Fund is IFund, Initializable, FundStorage{

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

    modifier onlyAgent() {
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
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

    function setNAV(uint256 _latestNAV, string memory actionID) external onlyAgent returns(bool){
        NAVLatestPrice = _latestNAV;
        emit NAVUpdated(_latestNAV, actionID);
        return true;
    }

    function setAssetPriceOffChain(uint256 _newPrice) external onlyAgent{
        tokenPrice = _newPrice;
    }

    function setOffChainPrice(bool _status) external onlyAgent{
        offChainPrice = _status;
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

    function setMinInvestment(uint256 _newMinInvestment, string memory actionID) external onlyAgent{
        minInvestment = _newMinInvestment;
        emit MinimumInvestmentUpdated(_newMinInvestment, actionID);
    }

    function setMaxInvestment(uint256 _newMaxInvestment, string memory actionID) external onlyAgent{
        maxInvestment = _newMaxInvestment;
        emit MaximumInvestmentUpdated(_newMaxInvestment, actionID);
    }

    function setProjectedYield(uint256 _newProjectedYield, string memory actionID) external onlyAgent{
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