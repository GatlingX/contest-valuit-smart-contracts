// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "../IModularCompliance.sol";
import "../../../token/IToken.sol";
import "../../../roles/AgentRole.sol";
import "./AbstractModuleUpgradeable.sol";

contract HoldTimeModule is AbstractModuleUpgradeable {

    /// Mapping for hold time time frames
    mapping(address => uint256) public holdTime;
    mapping(address => bool) public isHoldTimeSet;

    event HoldTimeUpdated(address indexed compliance, uint256 holdTimeValue);

    constructor() {
        _disableInitializers();
    }

    /**
     * @dev initializes the contract and sets the initial state.
     * @notice This function should only be called once during the contract deployment.
     */
    function initialize() external initializer {
        __AbstractModule_init();
    }

    /**
     * @dev Sets the hold time for the caller, ensuring it is in the future and can only be set once.
     * 
     * Requirements:
     * - `holdTime_` must be greater than the current block timestamp.
     * - The caller must not have set a hold time before.
     * - Function can only be called by a contract with the `onlyComplianceCall` modifier.
     * 
     * Emits a {HoldTimeUpdated} event upon successful execution.
     * 
     * @param holdTime_ The future timestamp until which the caller's hold period remains active.
    */
    function setHoldTime(uint256 holdTime_) external onlyComplianceCall {
        require(holdTime_ > block.timestamp, "Hold Time cannot be less than current timestamp"); 
        require(!isHoldTimeSet[msg.sender], "Reset of Hold Time not allowed");

        holdTime[msg.sender] = holdTime_;
        isHoldTimeSet[msg.sender] = true;

        emit HoldTimeUpdated(msg.sender, holdTime_);
    }

    /**
     *  @dev See {IModule-moduleTransferAction}.
     */
    function moduleTransferAction(address _from, address /*_to*/, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleMintAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleMintAction(address _to, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleBurnAction}.
     */
    // solhint-disable-next-line no-empty-blocks
    function moduleBurnAction(address _from, uint256 _value) external override onlyComplianceCall {}

    /**
     *  @dev See {IModule-moduleCheck}.
     */
    function moduleCheck(
        address _from,
        address /*_to*/,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        if (_from == address(0)) {
            return true;
        }
        else if (_isTokenAgent(_compliance, _from)) {
            return true;
        }
        else if(block.timestamp < holdTime[_compliance]){
            return false;
        }
        return true;
    }

    /**
    *  @dev getter for `holdTime` variable
    *  @param _compliance the Compliance smart contract to be checked
    *  returns holdTime
    */
    function getHoldTime(address _compliance) external view returns (uint256) {
        return holdTime[_compliance];
    }

    /**
     *  @dev See {IModule-canComplianceBind}.
     */
    function canComplianceBind(address /*_compliance*/) external view override returns (bool) {
        return true;

    }

    /**
     *  @dev See {IModule-isPlugAndPlay}.
     */
    function isPlugAndPlay() external pure override returns (bool) {
        return false;
    }

    /**
     * @dev Checks if a hold time has been set for the given compliance address.
     *
     * @param _compilance The address to check if a hold time has been set.
     * @return bool Returns `true` if a hold time has been set for the given address, otherwise `false`.
     */
    function isHoldtimeSet(address _compilance) external view returns(bool) {
        return isHoldTimeSet[_compilance];
    }

    /**
     *  @dev See {IModule-name}.
     */
    function name() public pure returns (string memory _name) {
        return "HoldTimeModule";
    }

    /**
    *  @dev checks if the given user address is an agent of token
    *  @param compliance the Compliance smart contract to be checked
    *  @param _userAddress ONCHAIN identity of the user
    *  internal function, can be called only from the functions of the Compliance smart contract
    */
    function _isTokenAgent(address compliance, address _userAddress) internal view returns (bool) {
        return AgentRole(IModularCompliance(compliance).getTokenBound()).isAgent(_userAddress);
    }
}
