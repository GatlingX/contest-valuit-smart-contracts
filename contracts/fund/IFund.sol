// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface IFund {

    event NAVUpdated(
        uint256 latestNAV,
        string actionID
    );

    event MinimumInvestmentUpdated(
        uint256 newMinimumInvestment,
        string actionID
    );

    event MaximumInvestmentUpdated(
        uint256 newMaximumInvestment,
        string actionID
    );

    event ProjectedYieldUpdated(
        uint256 newProjectedYield,
        string actionID
    );

    event DividendDistributed(
        address investor,
        uint256 amount,
        string _userID,
        string _dividendID
    );

    /**
    @dev Retrieves the latest Net Asset Value (NAV) price from the APIConsumer contract.
    Updates the NAVLatestPrice variable with the retrieved value.
    Returns the updated NAVLatestPrice.
    Assumes that the apiConsumer variable is already initialized.
    This function is callable externally.
    */
    function getNAV() external returns (uint256);

    function getToken() external view returns (address);

    function getOffChainPrice() external view returns(uint256);

    function getOffChainPriceStatus() external view returns(bool);

    function shareDividend(address _address, 
                            uint256  _dividend,
                            string calldata _userIds,
                            string calldata _dividendIds,  
                            address stableCoin_,
                            address _agent) external;
}