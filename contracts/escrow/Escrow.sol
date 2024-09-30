// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../roles/AgentRole.sol";
import "contracts/escrow/EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/escrow/TransferHelper.sol";
import "contracts/token/IToken.sol";
import "../roles/AgentRole.sol";

contract Escrow is Ownable, EscrowStorage{

    constructor(address stableCoin_, uint8 adminFee_) {
        stableCoin = stableCoin_;
        adminFee = adminFee_; //1 Represents 0.01%
    } 

    function rescueAnyERC20Tokens(
        address _tokenAddr,
        address _to,
        uint128 _amount
    ) external onlyOwner {
        if(_tokenAddr == stableCoin){
            SafeERC20.safeTransfer(
                IERC20(_tokenAddr),
                _to,
                IToken(stableCoin).balanceOf(address(this)) - pendingOrderAmount
            );
        } else{
                SafeERC20.safeTransfer(
                    IERC20(_tokenAddr),
                    _to,
                    _amount
                );
            }    
    }

    function setAdminFee(uint8 _fee) public onlyOwner{
        require(_fee >= 0, "Cannot be less than 0");
        adminFee = _fee;
    }

    function deposit(address _token, uint256 _amount, string memory orderID) public{
        require(_token != address(0),"Zero Address not allowed");
        require(_amount > 0, "Amount should be greater than 0");
        require(IToken(_token).identityRegistry().isVerified(msg.sender), "Investor not whitelisted");
        require(!orderCreated[orderID], "Order Already Created");

        investorOrders[orderID].investor = msg.sender;
        investorOrders[orderID].asset = _token;
        investorOrders[orderID].value = _amount;
        investorOrders[orderID].status = false;

        TransferHelper.safeTransferFrom(stableCoin, msg.sender, address(this), _amount);

        receivedAmount[orderID] = _amount;
        orderCreated[orderID] = true;
        pendingOrderAmount += investorOrders[orderID].value;

        emit AmountReceived(_token, msg.sender, _amount, orderID);
    }

    function settlement(string memory orderID) public {
        require (AgentRole(investorOrders[orderID].asset).isAgent(msg.sender), "Invalid Issuer");

        TransferHelper.safeTransfer(stableCoin, 
                                    msg.sender, 
                                    investorOrders[orderID].value - ((investorOrders[orderID].value * adminFee)/10000));

        TransferHelper.safeTransfer(stableCoin, 
                                    owner(), 
                                    (investorOrders[orderID].value * adminFee)/10000);

        pendingOrderAmount -= investorOrders[orderID].value;
        investorOrders[orderID].status = true;

        emit orderSettled(orderID, msg.sender, investorOrders[orderID].value);
    }
    

    function getStableCoin() public view returns(address){
        return stableCoin;
    }
}