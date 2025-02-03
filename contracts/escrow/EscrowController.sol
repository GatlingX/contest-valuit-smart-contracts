// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "../roles/AgentRole.sol";
import "contracts/token/IToken.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/factory/ITREXFactory.sol";
import "contracts/fund/IFund.sol";
import "contracts/fund/IEquityConfig.sol";
import "contracts/escrow/IEscrowController.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "contracts/escrow/EscrowStorage.sol";

contract EscrowController is OwnableUpgradeable, EscrowStorage, IEscrowController{

    function init(address [] memory  stableCoin_, address _masterFactory, address _fundFactory) external initializer {
        stablecoin["usdc"] = stableCoin_[0];
        stablecoin["usdt"] = stableCoin_[1];
        stableCoinName[stableCoin_[0]] = "usdc";
        stableCoinName[stableCoin_[1]] = "usdt";
        isStableCoin[stableCoin_[0]] = true;
        isStableCoin[stableCoin_[1]] = true;
        FEE_DENOMINATOR = 10000;
        masterFactory = _masterFactory;
        fundFactory = _fundFactory;
        __Ownable_init_unchained();
    } 

    modifier onlyAgent(address _token) {
        require(AgentRole(_token).isAgent(msg.sender), "Invalid Agent");
        _;
    }

    modifier onlyAgentOrTA(address _token) {
        require(
            AgentRole(_token).isAgent(msg.sender) || AgentRole(_token).isTA(msg.sender),
            "Invalid Agent"
        );
        _;
    }


    function rescueAnyERC20Tokens(address _tokenAddr, address _to, uint128 _amount) external onlyOwner {
        TransferHelper.safeTransfer(
            _tokenAddr,
            _to,
            _amount
        );
    }


    function deposit(address _token, uint256 _amount, uint256 _tokens, string calldata orderID, string calldata coin) external {
        require(_amount > 0, "Amount should be greater than 0");
        require(IToken(_token).identityRegistry().isVerified(msg.sender), "Investor not whitelisted");
        require(investorOrders[orderID].investor == address(0), "Order Already Created");
        require(ITREXFactory(masterFactory).tokenDeployedByMe(_token),"Asset not allowed");
        require(stablecoin[coin] != address(0), "Unsupported stablecoin");
        require(IToken(stablecoin[coin]).allowance(msg.sender, address(this)) >= _amount, "Insufficient Allowance");

        investorOrders[orderID].investor = msg.sender;
        investorOrders[orderID].asset = _token;
        investorOrders[orderID].value = _amount;
        investorOrders[orderID].tokens = _tokens;
        investorOrders[orderID].coin = coin;
        investorOrders[orderID].status = false;

        pendingOrderAmount[investorOrders[orderID].coin] += _amount;
        totalPendingOrderAmount += _amount;

        emit OrderCreated(_token, msg.sender, _amount, _tokens, orderID, coin);
    }

    function settlement(string calldata orderID) public onlyAgent(investorOrders[orderID].asset){
        InvestorOrder storage order = investorOrders[orderID];

        require(order.investor != address(0), "Order does not exist");
        require (!order.status, "Order Already Settled");

        uint16 escrowFee = IFundFactory(fundFactory).getEscrowFee(order.asset);
        uint256 adminFeeAmount = (order.value * escrowFee) / FEE_DENOMINATOR;
        uint256 netAmount = order.value - adminFeeAmount;

        pendingOrderAmount[order.coin] -= order.value;
        totalPendingOrderAmount -= order.value;
        order.status = true;

        TransferHelper.safeTransferFrom(stablecoin[order.coin], 
                                        order.investor,
                                        msg.sender, 
                                        netAmount);

        TransferHelper.safeTransferFrom(stablecoin[order.coin], 
                                        order.investor,
                                        IFundFactory(fundFactory).getAdminWallet(), 
                                        adminFeeAmount);
        
        IToken(order.asset).mint(order.investor, order.tokens);
        emit OrderSettled(orderID, msg.sender, order.value, order.tokens);
    }

    function cancelOrder(string calldata orderID) external {
        InvestorOrder storage order = investorOrders[orderID];

        require(order.investor == msg.sender, "Only Creator can cancel the order");
        require(!order.status, "Order Executed");

        pendingOrderAmount[order.coin] -= order.value;
        totalPendingOrderAmount -= order.value;

        order.status = true;

        emit OrderCancelled(orderID, msg.sender, order.value);
    }

    function rejectOrder(string calldata orderID) external onlyAgent(investorOrders[orderID].asset){
        InvestorOrder storage order = investorOrders[orderID];

        require(order.investor != address(0), "Order does not exist");
        require(!order.status, "Order Executed");

        pendingOrderAmount[order.coin] -= order.value;
        totalPendingOrderAmount -= order.value;

        order.status = true;

        emit OrderRejected(orderID, msg.sender, order.value);
    }

    function redemptionAndBurn(address _token,
            address _userAddress, 
            uint256 _burnAmount, 
            uint256 _principalAmount, 
            uint256 _profitAmount, 
            string calldata coin,
            string calldata orderID) public onlyAgent(_token){

                require(ITREXFactory(masterFactory).tokenDeployedByMe(_token),"Asset not allowed");
                require(_token != address(0),"Zero Address not allowed");
                require(_burnAmount > 0 && _principalAmount > 0, "Amount should be greater than 0");
                require(stablecoin[coin] != address(0), "Unsupported stablecoin");
                require(!redemptionStatus[orderID], "Duplicate Redemption Order");

                if(_profitAmount == 0){
                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, _userAddress, _principalAmount);
                    IToken(_token).burn(_userAddress, _burnAmount);

                    emit RedemptionAndBurn(_token, _userAddress, _burnAmount, _principalAmount, _profitAmount, coin, _principalAmount, 0, orderID);
                } else {
                    uint16 redemptionFee = IFundFactory(fundFactory).getRedemptionFee(_token);
                    uint256 adminFeeAmount = (_profitAmount * redemptionFee) / FEE_DENOMINATOR;
                    uint256 netAmount = _principalAmount - adminFeeAmount;

                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, _userAddress, netAmount);
                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, IFundFactory(fundFactory).getAdminWallet(), adminFeeAmount);
                    IToken(_token).burn(_userAddress, _burnAmount);

                    redemptionStatus[orderID] = true;

                    emit RedemptionAndBurn(_token, _userAddress, _burnAmount, _principalAmount, _profitAmount, coin, netAmount, adminFeeAmount, orderID);
                }
    }

    function batchSettlement(string[] calldata orderIDs) external {
        for (uint256 i = 0; i < orderIDs.length; i++) {
            settlement(orderIDs[i]);
        }
    }

    function batchRedemptionAndBurn(address _token,
            address[] calldata _userAddress, 
            uint256[] calldata _burnAmount, 
            uint256[] calldata _principalAmount, 
            uint256[] calldata _profitAmount, 
            string calldata coin,
            string[] calldata orderID
            ) external {
                require(_userAddress.length == _burnAmount.length && 
                    _burnAmount.length == _principalAmount.length &&
                    _principalAmount.length == _profitAmount.length &&
                    _profitAmount.length == orderID.length,"Array length mismatch");
                for (uint16 i = 0; i < orderID.length; i++) {
                    redemptionAndBurn(_token, _userAddress[i], _burnAmount[i], _principalAmount[i], _profitAmount[i], coin, orderID[i]);
        }
    }

    function setStableCoin(string calldata coin, address _stablecoin) external onlyOwner{
        require(_stablecoin != address(0),"Zero Address");
        require(stablecoin[coin] == address(0), "Stablecoin in use, update disallowed");
        stablecoin[coin] = _stablecoin;
        stableCoinName[_stablecoin] = coin;
        isStableCoin[_stablecoin] = true;
        emit StableCoinUpdated(coin, _stablecoin);
    }

    function setMasterFactory(address _masterFactory) external onlyOwner{
        require(_masterFactory != address(0), "Invalid Zero Address");
        masterFactory = _masterFactory;
        emit MasterFactoryUpdated(masterFactory);
    }

    function setFundFactory(address _fundFactory) external onlyOwner{
        require(_fundFactory != address(0), "Invalid Zero Address");
        fundFactory = _fundFactory;
        emit FundFactoryUpdated(_fundFactory);
    }

    function setNAV(address _token, uint256 _latestNAV, string memory actionID) external onlyAgent(_token){
        require(_token != address(0), "Invalid Zero Address");
        address fund = IFundFactory(fundFactory).getFund(_token);
        IFund(fund).setNAV(_latestNAV, actionID);

        emit NAVUpdated(_token, fund, _latestNAV, actionID);
    }

    function setValuation(address _token, uint _latestValuation, string memory actionID) external onlyAgent(_token){
        require(_token != address(0), "Invalid Zero Address");
        address fund = IFundFactory(fundFactory).getFund(_token);
        IEquityConfig(fund).setValuation(_latestValuation, actionID);

        emit ValuationUpdated(_token, fund, _latestValuation, actionID);
    }

    function batchMintTokens(address _token, address[] calldata _toList, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgent(_token){
        require(_toList.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _toList.length; i++){
            IToken(_token).mint(_toList[i], _amounts[i]);
            emit TokensMinted(_toList[i], _amounts[i], orderIDs[i], _token);
        }
    }

    function batchBurnTokens(address _token, address[] calldata _fromList, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgent(_token){
        require(_fromList.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _fromList.length; i++){
            IToken(_token).burn(_fromList[i], _amounts[i]);
            emit TokensBurned(_fromList[i], _amounts[i], orderIDs[i], _token);
        }
    }

    function batchFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).freezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensFrozen(_userAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    function batchUnFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).unfreezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensUnFrozen(_userAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    function batchForceTransferTokens(address _token, address[] calldata _userAddresses, address[] calldata _toAddresses,uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).forcedTransfer(_userAddresses[i], _toAddresses[i], _amounts[i]);
            emit ForceTransferred(_userAddresses[i], _toAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    function batchSetAddressFrozen(address _token, address[] calldata _userAddresses, bool[] calldata _freeze, string[] calldata actionIDs) external onlyAgent(_token){
        require(_userAddresses.length == _freeze.length && _freeze.length == actionIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).setAddressFrozen(_userAddresses[i], _freeze[i]);
            emit UserAddressFrozen(_userAddresses[i], _freeze[i], actionIDs[i], _token);
        }
    }

    function batchRegisterIdentity(
        address[] calldata _userAddress,
        IIdentity[] calldata _onchainID,
        uint16[] calldata _country,
        string[] calldata _userIDs,
        address _token
    ) external {
        IIdentityRegistry ir = IToken(_token).identityRegistry();
        require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
        require(_userAddress.length == _onchainID.length &&
             _onchainID.length == _country.length && 
             _country.length == _userIDs.length, "Array length mismatch");
        for(uint i=0; i < _userAddress.length; i++){
            IIdentityRegistry(ir).registerIdentity(_userAddress[i], _onchainID[i], _country[i]);
            emit UserIdentityRegistered(_userAddress[i], address(_onchainID[i]), _userIDs[i]);
        }
    }

    function batchShareDividend(
        address _fund,
        address[] calldata _address, 
        uint256[] calldata _dividend,
        string[] calldata _userIds,
        string[] calldata _dividendIds,  
        address stableCoin_
    )external {
        require(AgentRole(IFund(_fund).getToken()).isAgent(msg.sender), "Invalid Issuer");
        require(_address.length == _dividend.length &&
             _dividend.length == _userIds.length && 
             _userIds.length == _dividendIds.length, "Array length mismatch");
        for(uint i=0; i < _address.length; i++){
            IFund(_fund).shareDividend(_address[i], _dividend[i], _userIds[i], _dividendIds[i], stableCoin_, msg.sender);
            emit DividendDistributed(_address[i], _dividend[i], _userIds[i], _dividendIds[i], address(IFund(_fund).getToken()));
        }
    }

    function callUpdateIdentity(
        address _userAddress,
        IIdentity _identity,
        address _token,
        string calldata actionID
    ) external {
        IIdentityRegistry ir = IToken(_token).identityRegistry();
        require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
        IIdentityRegistry(ir).updateIdentity(_userAddress, _identity);
        emit IdentityUpdated(_userAddress, _token, actionID);
    }
 
    function callUpdateCountry(
        address _userAddress,
        uint16 _country,
        address _token,
        string calldata actionID
    ) external {
        IIdentityRegistry ir = IToken(_token).identityRegistry();
        require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
        IIdentityRegistry(ir).updateCountry(_userAddress, _country);
        emit UserCountryUpdated(_userAddress, _token, _country, actionID);
    }

    function callDeleteIdentity(address _userAddress, address _token, string calldata actionID) external {
        IIdentityRegistry ir = IToken(_token).identityRegistry();
        require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
        IIdentityRegistry(ir).deleteIdentity(_userAddress);
        emit UserIdentityDeleted(_userAddress, _token, actionID);
    }

    function getStableCoin(string calldata _stablecoin) public view returns(address){
        return stablecoin[_stablecoin];
    }

    function getStableCoinName(address stableCoin) public view returns(string memory){
        return stableCoinName[stableCoin];
    }

}