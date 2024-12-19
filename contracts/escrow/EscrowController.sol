// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "contracts/escrow/EscrowStorage.sol";
import "../roles/AgentRole.sol";
import "contracts/token/IToken.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "contracts/factory/IFundFactory.sol";
import "contracts/factory/ITREXFactory.sol";
import "contracts/fund/IFund.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract EscrowController is OwnableUpgradeable, EscrowStorage{

    function init(address [] memory  stableCoin_, address _masterFactory) public initializer {
        stablecoin["usdc"] = stableCoin_[0];
        stablecoin["usdt"] = stableCoin_[1];
        stableCoinName[stableCoin_[0]] = "usdc";
        stableCoinName[stableCoin_[1]] = "usdt";
        isStableCoin[stableCoin_[0]] = true;
        isStableCoin[stableCoin_[1]] = true;
        masterFactory = _masterFactory;
        __Ownable_init_unchained();
    } 

    function rescueAnyERC20Tokens(
        address _tokenAddr,
        address _to,
        uint128 _amount
    ) external onlyOwner {
        if(isStableCoin[_tokenAddr]){
            SafeERC20.safeTransfer(
                IERC20(_tokenAddr),
                _to,
                IToken(_tokenAddr).balanceOf(address(this)) - pendingOrderAmount[stableCoinName[_tokenAddr]]
            );
        } else{
                SafeERC20.safeTransfer(
                    IERC20(_tokenAddr),
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

        investorOrders[orderID].investor = msg.sender;
        investorOrders[orderID].asset = _token;
        investorOrders[orderID].value = _amount;
        investorOrders[orderID].tokens = _tokens;
        investorOrders[orderID].coin = coin;
        investorOrders[orderID].status = false;

        TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, address(this), _amount);

        receivedAmount[orderID] = _amount;
        orderCreated[msg.sender][orderID] = true;
        pendingOrderAmount[investorOrders[orderID].coin] += investorOrders[orderID].value;
        totalPendingOrderAmount += investorOrders[orderID].value;

        emit AmountReceived(_token, msg.sender, _amount, _tokens, orderID, coin);
    }

    function settlement(string calldata orderID, address fundFactory) public {
        require(orderCreated[investorOrders[orderID].investor][orderID], "Order does not exist");
        require (AgentRole(investorOrders[orderID].asset).isAgent(msg.sender), "Invalid Issuer");
        require (!investorOrders[orderID].status, "Order Already Settled");


        uint16 adminFee = IFundFactory(fundFactory).getAdminFee(investorOrders[orderID].asset);

        TransferHelper.safeTransfer(stablecoin[investorOrders[orderID].coin], 
                                    msg.sender, 
                                    investorOrders[orderID].value - ((investorOrders[orderID].value * adminFee)/10000));

        TransferHelper.safeTransfer(stablecoin[investorOrders[orderID].coin], 
                                    IFundFactory(fundFactory).getAdminWallet(), 
                                    (investorOrders[orderID].value * adminFee)/10000);
        
        IToken(investorOrders[orderID].asset).mint(investorOrders[orderID].investor, investorOrders[orderID].tokens);

        pendingOrderAmount[investorOrders[orderID].coin] -= investorOrders[orderID].value;
        totalPendingOrderAmount -= investorOrders[orderID].value;
        investorOrders[orderID].status = true;

        emit OrderSettled(orderID, msg.sender, investorOrders[orderID].value, investorOrders[orderID].tokens);
    }

    function rejectOrder(string calldata orderID) external {
        require(orderCreated[investorOrders[orderID].investor][orderID], "Order does not exist");
        require (AgentRole(investorOrders[orderID].asset).isAgent(msg.sender), "Invalid Issuer");
        require (!investorOrders[orderID].status, "Order Executed");
        TransferHelper.safeTransfer(stablecoin[investorOrders[orderID].coin], 
                                    investorOrders[orderID].investor, 
                                    investorOrders[orderID].value);
        pendingOrderAmount[investorOrders[orderID].coin] -= investorOrders[orderID].value;
        totalPendingOrderAmount -= investorOrders[orderID].value;
        investorOrders[orderID].status = true;

        emit OrderRejected(orderID, msg.sender, investorOrders[orderID].value);
    }

    function batchSettlement(string[] calldata orderIDs,address fundFactory) public {
        for (uint256 i = 0; i < orderIDs.length; i++) {
            settlement(orderIDs[i], fundFactory);
        }
    }

    function setStableCoin(string calldata coin, address _stablecoin) public onlyOwner{
        require(_stablecoin != address(0),"Zero Address");
        require(stablecoin[coin] == address(0), "Stablecoin in use, update disallowed");
        stablecoin[coin] = _stablecoin;
        stableCoinName[_stablecoin] = coin;
        isStableCoin[_stablecoin] = true;
        emit StableCoinUpdated(coin, _stablecoin);
    }

    function setMasterFactory(address _masterFactory) public onlyOwner{
        require(_masterFactory != address(0), "Invalid Zero Address");
        masterFactory = _masterFactory;
    }

    function batchMintTokens(address _token, address[] calldata _toList, uint256[] calldata _amounts, string[] calldata orderIDs) external{
        require (AgentRole(_token).isAgent(msg.sender), "Invalid Issuer");
        for(uint i = 0; i < _toList.length; i++){
            IToken(_token).mint(_toList[i], _amounts[i]);
            emit TokensMinted(_toList[i], _amounts[i], orderIDs[i]);
        }
    }

    function batchBurnTokens(address _token, address[] calldata _fromList, uint256[] calldata _amounts, string[] calldata orderIDs) external{
        require (AgentRole(_token).isAgent(msg.sender), "Invalid Issuer");
        for(uint i = 0; i < _fromList.length; i++){
            IToken(_token).burn(_fromList[i], _amounts[i]);
            emit TokensBurned(_fromList[i], _amounts[i], orderIDs[i]);
        }
    }

    function batchFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external{
        require (AgentRole(_token).isAgent(msg.sender) || AgentRole(_token).isTA(msg.sender), "Invalid Agent");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).freezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensFrozen(_userAddresses[i], _amounts[i], orderIDs[i]);
        }
    }

    function batchUnFreezePartialTokens(address _token, address[] calldata _userAddresses, uint256[] calldata _amounts, string[] calldata orderIDs) external {
        require (AgentRole(_token).isAgent(msg.sender) || AgentRole(_token).isTA(msg.sender), "Invalid Agent");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).unfreezePartialTokens(_userAddresses[i], _amounts[i]);
            emit UserTokensUnFrozen(_userAddresses[i], _amounts[i], orderIDs[i]);
        }
    }

    function batchForceTransferTokens(address _token, address[] calldata _userAddresses, address[] calldata _toAddresses,uint256[] calldata _amounts, string[] calldata orderIDs) external {
        require (AgentRole(_token).isAgent(msg.sender) || AgentRole(_token).isTA(msg.sender), "Invalid Agent");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).forcedTransfer(_userAddresses[i], _toAddresses[i], _amounts[i]);
            emit ForceTransferred(_userAddresses[i], _toAddresses[i], _amounts[i], orderIDs[i]);
        }
    }

    function batchSetAddressFrozen(address _token, address[] calldata _userAddresses, bool[] calldata _freeze, string[] calldata actionIDs) external {
        require (AgentRole(_token).isAgent(msg.sender), "Invalid Agent");
        for(uint i = 0; i < _userAddresses.length; i++){
            IToken(_token).setAddressFrozen(_userAddresses[i], _freeze[i]);
            emit UserAddressFrozen(_userAddresses[i], _freeze[i], actionIDs[i]);
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
        for(uint i=0; i < _address.length; i++){
            IFund(_fund).shareDividend(_address[i], _dividend[i], _userIds[i], _dividendIds[i], stableCoin_, msg.sender);
            emit DividendDistributed(_address[i], _dividend[i], _userIds[i], _dividendIds[i]);
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