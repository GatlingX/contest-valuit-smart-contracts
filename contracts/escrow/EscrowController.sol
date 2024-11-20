// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "contracts/escrow/EscrowStorage.sol";
import "../roles/AgentRole.sol";
import "contracts/token/IToken.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/registry/interface/IIdentityRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract EscrowController is OwnableUpgradeable, EscrowStorage{

    function init(address [] memory  stableCoin_, uint16 adminFee_) public initializer {
        stablecoin["usdc"] = stableCoin_[0];
        stablecoin["usdt"] = stableCoin_[1];
        stableCoinName[stableCoin_[0]] = "usdc";
        stableCoinName[stableCoin_[1]] = "usdt";
        adminFee = adminFee_; //1 Represents 0.01%
        adminWallet = msg.sender;
        __Ownable_init_unchained();
    } 

    function rescueAnyERC20Tokens(
        address _tokenAddr,
        address _to,
        uint128 _amount
    ) external onlyOwner {
        if(_tokenAddr == stablecoin["usdc"] || _tokenAddr == stablecoin["usdt"]){
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

    function setAdminFee(uint16 _fee, string calldata _id) public onlyOwner{
        require(_fee >= 0 && _fee < 10000, "Invalid Fee. Out of Range!");
        adminFee = _fee;
        emit AdminFeeUpdated(adminFee, _id, block.timestamp);
    }

    function setAdminWallet(address _newWallet, string calldata _id) public onlyOwner(){
        require(_newWallet != address(0),"Zero Address");
        adminWallet = _newWallet;
        emit AdminWalletUpdated(adminWallet, _id, block.timestamp);
    }

    function deposit(address _token, uint256 _amount, uint256 _tokens, string calldata orderID, string calldata coin) public{
        require(_token != address(0),"Zero Address not allowed");
        require(_amount > 0, "Amount should be greater than 0");
        require(IToken(_token).identityRegistry().isVerified(msg.sender), "Investor not whitelisted");
        require(!orderCreated[orderID], "Order Already Created");

        investorOrders[orderID].investor = msg.sender;
        investorOrders[orderID].asset = _token;
        investorOrders[orderID].value = _amount;
        investorOrders[orderID].tokens = _tokens;
        investorOrders[orderID].coin = coin;
        investorOrders[orderID].status = false;

        TransferHelper.safeTransferFrom(stablecoin[coin], msg.sender, address(this), _amount);

        receivedAmount[orderID] = _amount;
        orderCreated[orderID] = true;
        pendingOrderAmount[investorOrders[orderID].coin] += investorOrders[orderID].value;
        totalPendingOrderAmount += investorOrders[orderID].value;

        emit AmountReceived(_token, msg.sender, _amount, _tokens, orderID, coin);
    }

    function settlement(string calldata orderID) public {
        require (AgentRole(investorOrders[orderID].asset).isAgent(msg.sender), "Invalid Issuer");
        require (!investorOrders[orderID].status, "Order Already Settled");

        TransferHelper.safeTransfer(stablecoin[investorOrders[orderID].coin], 
                                    msg.sender, 
                                    investorOrders[orderID].value - ((investorOrders[orderID].value * adminFee)/10000));

        TransferHelper.safeTransfer(stablecoin[investorOrders[orderID].coin], 
                                    adminWallet, 
                                    (investorOrders[orderID].value * adminFee)/10000);
        
        IToken(investorOrders[orderID].asset).mint(investorOrders[orderID].investor, investorOrders[orderID].tokens);

        pendingOrderAmount[investorOrders[orderID].coin] -= investorOrders[orderID].value;
        totalPendingOrderAmount -= investorOrders[orderID].value;
        investorOrders[orderID].status = true;

        emit orderSettled(orderID, msg.sender, investorOrders[orderID].value, investorOrders[orderID].tokens);
    }

    function batchSettlement(string[] calldata orderIDs) public {
        for (uint256 i = 0; i < orderIDs.length; i++) {
            settlement(orderIDs[i]);
        }
    }

    function setStableCoin(string calldata coin, address _stablecoin) public onlyOwner{
        require(_stablecoin != address(0),"Zero Address");
        stablecoin[coin] = _stablecoin;
        stableCoinName[_stablecoin] = coin;
        emit StableCoinUpdated(coin, _stablecoin);
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