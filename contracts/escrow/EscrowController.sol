// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "../roles/AgentRole.sol";
import "contracts/token/IToken.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/factory/ITREXFactory.sol";
import "contracts/fund/IFund.sol";
import "contracts/escrow/IEscrowController.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "contracts/escrow/EscrowStorage.sol";

contract EscrowController is OwnableUpgradeable, EscrowStorage, IEscrowController{

    function init(address [] memory  stableCoin_, address _masterFactory) external initializer {
        stablecoin["usdc"] = stableCoin_[0];
        stablecoin["usdt"] = stableCoin_[1];
        stableCoinName[stableCoin_[0]] = "usdc";
        stableCoinName[stableCoin_[1]] = "usdt";
        isStableCoin[stableCoin_[0]] = true;
        isStableCoin[stableCoin_[1]] = true;
        FEE_DENOMINATOR = 10000;
        masterFactory = _masterFactory;
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


    function rescueAnyERC20Tokens(
        address _tokenAddr,
        address _to,
        uint128 _amount
    ) external onlyOwner {
        if(isStableCoin[_tokenAddr]){
            TransferHelper.safeTransfer(
                _tokenAddr,
                _to,
                IToken(_tokenAddr).balanceOf(address(this)) - pendingOrderAmount[stableCoinName[_tokenAddr]]
            );
        } else{
                TransferHelper.safeTransfer(
                    _tokenAddr,
                    _to,
                    _amount
                );
            }    
    }

    function deposit(address _token, uint256 _amount, uint256 _tokens, string calldata orderID, string calldata coin) external {
        require(_token != address(0),"Zero Address not allowed");
        require(_amount > 0, "Amount should be greater than 0");
        require(IToken(_token).identityRegistry().isVerified(msg.sender), "Investor not whitelisted");
        require(!orderCreated[msg.sender][orderID], "Order Already Created");
        require(ITREXFactory(masterFactory).tokenDeployedByMe(_token),"Asset not allowed");
        require(stablecoin[coin] != address(0), "Unsupported stablecoin");
        require(IToken(stablecoin[coin]).allowance(msg.sender, address(this)) >= _amount, "Insufficient Allowance");

        investorOrders[orderID].investor = msg.sender;
        investorOrders[orderID].asset = _token;
        investorOrders[orderID].value = _amount;
        investorOrders[orderID].tokens = _tokens;
        investorOrders[orderID].coin = coin;
        investorOrders[orderID].status = false;

        orderCreated[msg.sender][orderID] = true;
        pendingOrderAmount[investorOrders[orderID].coin] += _amount;
        totalPendingOrderAmount += _amount;

        emit OrderCreated(_token, msg.sender, _amount, _tokens, orderID, coin);
    }

    function settlement(string calldata orderID, address fundFactory) public onlyAgent(investorOrders[orderID].asset){
        require(orderCreated[investorOrders[orderID].investor][orderID], "Order does not exist");
        require (!investorOrders[orderID].status, "Order Already Settled");

        uint16 escrowFee = IFundFactory(fundFactory).getEscrowFee(investorOrders[orderID].asset);
        uint256 orderValue = investorOrders[orderID].value;
        uint256 orderTokens = investorOrders[orderID].tokens;
        uint256 adminFeeAmount = (orderValue * escrowFee) / FEE_DENOMINATOR;
        uint256 netAmount = orderValue - adminFeeAmount;

        pendingOrderAmount[investorOrders[orderID].coin] -= orderValue;
        totalPendingOrderAmount -= orderValue;
        investorOrders[orderID].status = true;

        TransferHelper.safeTransferFrom(stablecoin[investorOrders[orderID].coin], 
                                        investorOrders[orderID].investor,
                                        msg.sender, 
                                        netAmount);

        TransferHelper.safeTransferFrom(stablecoin[investorOrders[orderID].coin], 
                                        investorOrders[orderID].investor,
                                        IFundFactory(fundFactory).getAdminWallet(), 
                                        adminFeeAmount);
        
        IToken(investorOrders[orderID].asset).mint(investorOrders[orderID].investor, orderTokens);
        emit OrderSettled(orderID, msg.sender, orderValue, orderTokens);
    }

    function cancelOrder(string calldata orderID) external {
        require(investorOrders[orderID].investor == msg.sender, "Only Creator can cancel the order");
        require(orderCreated[investorOrders[orderID].investor][orderID], "Order does not exist");
        require (!investorOrders[orderID].status, "Order Executed");

        uint256 orderValue = investorOrders[orderID].value;

        pendingOrderAmount[investorOrders[orderID].coin] -= orderValue;
        totalPendingOrderAmount -= orderValue;
        investorOrders[orderID].status = true;

        emit OrderCancelled(orderID, msg.sender, orderValue);
    }

    function rejectOrder(string calldata orderID) external onlyAgent(investorOrders[orderID].asset){
        require(orderCreated[investorOrders[orderID].investor][orderID], "Order does not exist");
        require (!investorOrders[orderID].status, "Order Executed");

        uint256 orderValue = investorOrders[orderID].value;

        pendingOrderAmount[investorOrders[orderID].coin] -= orderValue;
        totalPendingOrderAmount -= orderValue;
        investorOrders[orderID].status = true;

        emit OrderRejected(orderID, msg.sender, orderValue);
    }

    function redemptionAndBurn(address _token,
            address _userAddress, 
            uint256 _burnAmount, 
            uint256 _principalAmount, 
            uint256 _profitAmount, 
            string calldata coin,
            address fundFactory,
            string calldata orderID) public onlyAgent(_token){

                require(ITREXFactory(masterFactory).tokenDeployedByMe(_token),"Asset not allowed");
                require(_token != address(0),"Zero Address not allowed");
                require(_burnAmount > 0 && _principalAmount > 0, "Amount should be greater than 0");
                require(stablecoin[coin] != address(0), "Unsupported stablecoin");

                if(_profitAmount == 0){
                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, _userAddress, _principalAmount);
                    IToken(_token).burn(_userAddress, _burnAmount);

                    emit RedemptionAndBurn(_token, _userAddress, _burnAmount, _principalAmount, _profitAmount, coin, _principalAmount, 0, orderID);
                } else{
                    uint16 redemptionFee = IFundFactory(fundFactory).getRedemptionFee(_token);
                    uint256 adminFeeAmount = (_profitAmount * redemptionFee) / FEE_DENOMINATOR;
                    uint256 netAmount = _principalAmount - adminFeeAmount;

                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, _userAddress, netAmount);
                    TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, IFundFactory(fundFactory).getAdminWallet(), adminFeeAmount);
                    IToken(_token).burn(_userAddress, _burnAmount);

                    emit RedemptionAndBurn(_token, _userAddress, _burnAmount, _principalAmount, _profitAmount, coin, netAmount, adminFeeAmount, orderID);
                }
    }

    function batchSettlement(string[] calldata orderIDs,address fundFactory) external {
        for (uint256 i = 0; i < orderIDs.length; i++) {
            settlement(orderIDs[i], fundFactory);
        }
    }

    function batchRedemptionAndBurn(address _token,
            address[] calldata _userAddress, 
            uint256[] calldata _burnAmount, 
            uint256[] calldata _principalAmount, 
            uint256[] calldata _profitAmount, 
            string calldata coin,
            address fundFactory,
            string[] calldata orderID
            ) external {
                require(_userAddress.length == _burnAmount.length && 
                    _burnAmount.length == _principalAmount.length &&
                    _principalAmount.length == _profitAmount.length &&
                    _profitAmount.length == orderID.length,"Array length mismatch");
                for (uint16 i = 0; i < orderID.length; i++) {
                    redemptionAndBurn(_token, _userAddress[i], _burnAmount[i], _principalAmount[i], _profitAmount[i], coin,fundFactory, orderID[i]);
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