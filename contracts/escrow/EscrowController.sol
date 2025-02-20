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

/**
 * @title EscrowController
 * @dev Manages escrow functionalities including deposits, settlements, redemptions, and administrative controls.
 */
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

    ///modifiers
    /**
     * @dev Modifier to restrict access to only agent roles.
     * @param _token Address of the token.
     */
    modifier onlyAgent(address _token) {
        require(AgentRole(_token).isAgent(msg.sender), "Invalid Agent");
        _;
    }

    /**
     * @dev Modifier to restrict access to agent or transfer agent roles.
     * @param _token Address of the token.
     */
    modifier onlyAgentOrTA(address _token) {
        require(
            AgentRole(_token).isAgent(msg.sender) || AgentRole(_token).isTA(msg.sender),
            "Invalid Agent"
        );
        _;
    }

    /**
     * @dev Allows the owner to rescue any ERC20 tokens sent to the contract.
     * @param _tokenAddr Address of the ERC20 token.
     * @param _to Recipient address.
     * @param _amount Amount to transfer.
     */
    function rescueAnyERC20Tokens(address _tokenAddr, address _to, uint128 _amount) external onlyOwner {
        TransferHelper.safeTransfer(
            _tokenAddr,
            _to,
            _amount
        );
    }

    /**
     * @dev Deposits stablecoins into the escrow contract for an asset purchase.
     * @param _token Address of the asset token.
     * @param _amount Amount of stablecoins to deposit.
     * @param _tokens Amount of tokens to purchase.
     * @param orderID Unique order identifier.
     * @param coin Type of stablecoin used.
     */
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

    /**
     * @dev Settles an order by transferring funds from the investor to the agent and admin, 
     *      and mints tokens to the investor.
     * @param orderID The unique identifier of the order to be settled.
     * Requirements:
     * - The order must exist.
     * - The order must not already be settled.
     * - Transfers the net amount to the agent.
     * - Transfers the escrow fee to the admin.
     * - Mints the corresponding tokens to the investor.
     * Emits an {OrderSettled} event.
     */
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

    /**
     * @dev Cancels an order, removing its pending amount and marking it as settled.
     * @param orderID The unique identifier of the order to be canceled.
     * Requirements:
     * - Only the order creator (investor) can cancel it.
     * - The order must not have been executed already.
     * Emits an {OrderCancelled} event.
     */
    function cancelOrder(string calldata orderID) external {
        InvestorOrder storage order = investorOrders[orderID];

        require(order.investor == msg.sender, "Only Creator can cancel the order");
        require(!order.status, "Order Executed");

        pendingOrderAmount[order.coin] -= order.value;
        totalPendingOrderAmount -= order.value;

        order.status = true;

        emit OrderCancelled(orderID, msg.sender, order.value);
    }

    /**
     * @dev Rejects an order by marking it as settled and removing its pending amount.
     * @param orderID The unique identifier of the order to be rejected.
     * Requirements:
     * - Only the agent of the asset can reject the order.
     * - The order must exist.
     * - The order must not already be executed.
     * Emits an {OrderRejected} event.
     */
    function rejectOrder(string calldata orderID) external onlyAgent(investorOrders[orderID].asset){
        InvestorOrder storage order = investorOrders[orderID];

        require(order.investor != address(0), "Order does not exist");
        require(!order.status, "Order Executed");

        pendingOrderAmount[order.coin] -= order.value;
        totalPendingOrderAmount -= order.value;

        order.status = true;

        emit OrderRejected(orderID, msg.sender, order.value);
    }

    /**
     * @dev Handles token redemption by burning the investor’s tokens and transferring stablecoin back.
     * @param _token The address of the token to be burned.
     * @param _userAddress The investor’s address.
     * @param _burnAmount The amount of tokens to be burned.
     * @param _principalAmount The principal amount to be returned.
     * @param _profitAmount The profit amount (if applicable).
     * @param coin The stablecoin used for the transaction.
     * @param orderID The unique identifier of the redemption order.
     * Requirements:
     * - The asset must be deployed by the sender.
     * - Token address must not be zero.
     * - Burn and principal amounts must be greater than zero.
     * - Stablecoin must be supported.
     * - Order ID must not have been processed already.
     * Emits a {RedemptionAndBurn} event.
     */
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

                    redemptionStatus[orderID] = true;

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

    /**
     * @dev Settles multiple orders in a batch.
     * @param orderIDs An array of order IDs to be settled.
     * Calls `settlement` function for each order in the batch.
     */
    function batchSettlement(string[] calldata orderIDs) external {
        for (uint i = 0; i < orderIDs.length; i++) {
            settlement(orderIDs[i]);
        }
    }

    /**
     * @dev Processes multiple redemptions and token burns in a batch.
     * @param _token The address of the token being burned.
     * @param _userAddress An array of user addresses.
     * @param _burnAmount An array of burn amounts corresponding to users.
     * @param _principalAmount An array of principal amounts corresponding to users.
     * @param _profitAmount An array of profit amounts corresponding to users.
     * @param coin The stablecoin used for transactions.
     * @param orderID An array of order IDs for the redemptions.
     * Requirements:
     * - All input arrays must have the same length.
     * Calls `redemptionAndBurn` for each order in the batch.
     */
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
                for (uint i = 0; i < orderID.length; i++) {
                    redemptionAndBurn(_token, _userAddress[i], _burnAmount[i], _principalAmount[i], _profitAmount[i], coin, orderID[i]);
        }
    }

    /**
     * @dev Sets a stablecoin address for a specific currency.
     * @param coin The symbol of the stablecoin (e.g., "USDT", "USDC").
     * @param _stablecoin The contract address of the stablecoin.
     * Requirements:
     * - Only the owner can call this function.
     * - The stablecoin address cannot be zero.
     * - The stablecoin for the given symbol should not already be set.
     * Emits a {StableCoinUpdated} event.
     */
    function setStableCoin(string calldata coin, address _stablecoin) external onlyOwner{
        require(_stablecoin != address(0),"Zero Address");
        require(stablecoin[coin] == address(0), "Stablecoin in use, update disallowed");
        stablecoin[coin] = _stablecoin;
        stableCoinName[_stablecoin] = coin;
        isStableCoin[_stablecoin] = true;
        emit StableCoinUpdated(coin, _stablecoin);
    }

    /**
     * @dev Sets the master factory contract address.
     * @param _masterFactory The new master factory contract address.
     * Requirements:
     * - Only the owner can call this function.
     * - The address cannot be zero.
     * Emits a {MasterFactoryUpdated} event.
     */
    function setMasterFactory(address _masterFactory) external onlyOwner{
        require(_masterFactory != address(0), "Invalid Zero Address");
        masterFactory = _masterFactory;
        emit MasterFactoryUpdated(masterFactory);
    }

    /**
     * @dev Sets the fund factory contract address.
     * @param _fundFactory The new fund factory contract address.
     * Requirements:
     * - Only the owner can call this function.
     * - The address cannot be zero.
     * Emits a {FundFactoryUpdated} event.
     */
    function setFundFactory(address _fundFactory) external onlyOwner{
        require(_fundFactory != address(0), "Invalid Zero Address");
        fundFactory = _fundFactory;
        emit FundFactoryUpdated(_fundFactory);
    }

    /**
     * @dev Updates the Net Asset Value (NAV) of a given token.
     * @param _token The address of the token.
     * @param _latestNAV The latest NAV value.
     * @param actionID The identifier for the NAV update action.
     * Requirements:
     * - Only the agent of the token can call this function.
     * - The token address cannot be zero.
     * Emits a {NAVUpdated} event.
     */
    function setNAV(address _token, uint256 _latestNAV, string memory actionID) external onlyAgent(_token){
        require(_token != address(0), "Invalid Zero Address");
        address fund = IFundFactory(fundFactory).getFund(_token);
        IFund(fund).setNAV(_latestNAV, actionID);

        emit NAVUpdated(_token, fund, _latestNAV, actionID);
    }

    /**
     * @dev Updates the valuation of a given token.
     * @param _token The address of the token.
     * @param _latestValuation The latest valuation amount.
     * @param actionID The identifier for the valuation update action.
     * Requirements:
     * - Only the agent of the token can call this function.
     * - The token address cannot be zero.
     * Emits a {ValuationUpdated} event.
     */
    function setValuation(address _token, uint _latestValuation, string memory actionID) external onlyAgent(_token){
        require(_token != address(0), "Invalid Zero Address");
        address fund = IFundFactory(fundFactory).getFund(_token);
        IEquityConfig(fund).setValuation(_latestValuation, actionID);

        emit ValuationUpdated(_token, fund, _latestValuation, actionID);
    }

    /**
     * @dev Mints tokens to different addresses in a batch operation.
     * @param _token The address of the token being minted.
     * @param _toList The list of recipient addresses.
     * @param _amounts The list of amounts to be minted.
     * @param orderIDs The list of order IDs associated with the minting.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent of the token can call this function.
     * Emits multiple {TokensMinted} events.
     */
    function batchMintTokens(address _token, address[] calldata _toList, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgent(_token){
        require(_toList.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _toList.length; i++){
            IToken(_token).mint(_toList[i], _amounts[i]);
            emit TokensMinted(_toList[i], _amounts[i], orderIDs[i], _token);
        }
    }

    /**
     * @dev Burns tokens from different addresses in a batch operation.
     * @param _token The address of the token being burned.
     * @param _fromList The list of addresses whose tokens will be burned.
     * @param _amounts The list of amounts to be burned.
     * @param orderIDs The list of order IDs associated with the burning.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent of the token can call this function.
     * Emits multiple {TokensBurned} events.
     */
    function batchBurnTokens(address _token, address[] calldata _fromList, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgent(_token){
        require(_fromList.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _fromList.length; i++){
            IToken(_token).burn(_fromList[i], _amounts[i]);
            emit TokensBurned(_fromList[i], _amounts[i], orderIDs[i], _token);
        }
    }

    /**
     * @dev Freezes a partial amount of tokens for multiple users.
     * @param _token The address of the token.
     * @param _userAddresses The list of user addresses.
     * @param _amounts The list of token amounts to be frozen.
     * @param orderIDs The list of order IDs associated with the freezing.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent or transfer agent (TA) can call this function.
     * Emits multiple {UserTokensFrozen} events.
     */
    function batchFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).freezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensFrozen(_userAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    /**
     * @dev Unfreezes a partial amount of tokens for multiple users.
     * @param _token The address of the token.
     * @param _userAddresses The list of user addresses.
     * @param _amounts The list of token amounts to be unfrozen.
     * @param orderIDs The list of order IDs associated with the unfreezing.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent or transfer agent (TA) can call this function.
     * Emits multiple {UserTokensUnFrozen} events.
     */
    function batchUnFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).unfreezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensUnFrozen(_userAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    /**
     * @dev Forcefully transfers tokens from one address to another for multiple users.
     * @param _token The address of the token.
     * @param _userAddresses The list of sender addresses.
     * @param _toAddresses The list of recipient addresses.
     * @param _amounts The list of token amounts to be transferred.
     * @param orderIDs The list of order IDs associated with the forced transfer.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent or transfer agent (TA) can call this function.
     * Emits multiple {ForceTransferred} events.
     */
    function batchForceTransferTokens(address _token, address[] calldata _userAddresses, address[] calldata _toAddresses,uint256[] calldata _amounts, string[] calldata orderIDs) external onlyAgentOrTA(_token){
        require(_userAddresses.length == _amounts.length && _amounts.length == orderIDs.length && orderIDs.length == _toAddresses.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).forcedTransfer(_userAddresses[i], _toAddresses[i], _amounts[i]);
            emit ForceTransferred(_userAddresses[i], _toAddresses[i], _amounts[i], orderIDs[i], _token);
        }
    }

    /**
     * @dev Freezes or unfreezes multiple user addresses.
     * @param _token The address of the token.
     * @param _userAddresses The list of user addresses.
     * @param _freeze The list of boolean values indicating whether to freeze (true) or unfreeze (false) each user.
     * @param actionIDs The list of action IDs associated with the freezing/unfreezing.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only the agent of the token can call this function.
     * Emits multiple {UserAddressFrozen} events.
     */
    function batchSetAddressFrozen(address _token, address[] calldata _userAddresses, bool[] calldata _freeze, string[] calldata actionIDs) external onlyAgent(_token){
        require(_userAddresses.length == _freeze.length && _freeze.length == actionIDs.length, "Array length mismatch");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).setAddressFrozen(_userAddresses[i], _freeze[i]);
            emit UserAddressFrozen(_userAddresses[i], _freeze[i], actionIDs[i], _token);
        }
    }

    /**
     * @dev Registers multiple user identities in batch.
     * @param _userAddress The list of user addresses.
     * @param _onchainID The list of corresponding on-chain identities.
     * @param _country The list of country codes.
     * @param _userIDs The list of user IDs.
     * @param _token The address of the token.
     * Requirements:
     * - All input arrays must be of the same length.
     * - The caller must be an Identity Registry Agent.
     * Emits multiple {UserIdentityRegistered} events.
     */
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

    /**
     * @dev Distributes dividends to multiple users in batch.
     * @param _fund The address of the fund distributing the dividends.
     * @param _address The list of recipient addresses.
     * @param _dividend The list of dividend amounts.
     * @param _userIds The list of user IDs.
     * @param _dividendIds The list of dividend distribution IDs.
     * @param stableCoin_ The stablecoin used for dividend distribution.
     * Requirements:
     * - All input arrays must be of the same length.
     * - Only an authorized agent can call this function.
     * Emits multiple {DividendDistributed} events.
     */
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

    /**
     * @dev Updates the identity of a user in the identity registry.
     * @param _userAddress The address of the user whose identity is being updated.
     * @param _identity The new identity contract associated with the user.
     * @param _token The address of the token contract linked to the identity registry.
     * @param actionID The identifier for the update action.
     * Requirements:
     * - Caller must be an Identity Registry Agent.
     * Emits an {IdentityUpdated} event.
     */
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
 
    /**
     * @dev Updates the country code of a user in the identity registry.
     * @param _userAddress The address of the user whose country code is being updated.
     * @param _country The new country code to be assigned.
     * @param _token The address of the token contract linked to the identity registry.
     * @param actionID The identifier for the update action.
     * Requirements:
     * - Caller must be an Identity Registry Agent.
     * Emits a {UserCountryUpdated} event.
     */
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

    /**
     * @dev Deletes a user's identity from the identity registry.
     * @param _userAddress The address of the user whose identity is being removed.
     * @param _token The address of the token contract linked to the identity registry.
     * @param actionID The identifier for the deletion action.
     * Requirements:
     * - Caller must be an Identity Registry Agent.
     * Emits a {UserIdentityDeleted} event.
     */
    function callDeleteIdentity(address _userAddress, address _token, string calldata actionID) external {
        IIdentityRegistry ir = IToken(_token).identityRegistry();
        require(AgentRole(address(ir)).isAgent(msg.sender),"Not an Identity Registry Agent");
        IIdentityRegistry(ir).deleteIdentity(_userAddress);
        emit UserIdentityDeleted(_userAddress, _token, actionID);
    }

    /**
     *  @dev See {IEscrowController-getStableCoin}.
     */
    function getStableCoin(string calldata _stablecoin) public view returns(address){
        return stablecoin[_stablecoin];
    }

    /**
     *  @dev See {IEscrowController-getStableCoinName}.
     */
    function getStableCoinName(address stableCoin) public view returns(string memory){
        return stableCoinName[stableCoin];
    }

}