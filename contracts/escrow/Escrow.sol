// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../roles/AgentRole.sol";
import "contracts/escrow/EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/token/IToken.sol";
import "../roles/AgentRole.sol";

contract Escrow is OwnableUpgradeable, EscrowStorage{

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
    

    function getStableCoin(string calldata _stablecoin) public view returns(address){
        return stablecoin[_stablecoin];
    }

    function getStableCoinName(address stableCoin) public view returns(string memory){
        return stableCoinName[stableCoin];
    }
}