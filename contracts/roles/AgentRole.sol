// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Roles.sol";

contract AgentRole is Ownable {
    using Roles for Roles.Role;

    Roles.Role private _agents;
    Roles.Role private _tAs;

    /**
     * @dev Emitted when an agent is added.
     * @param _agent The address of the agent added.
     */
    event AgentAdded(address indexed _agent);

    /**
     * @dev Emitted when an agent is removed.
     * @param _agent The address of the agent removed.
     */
    event AgentRemoved(address indexed _agent);

    /**
     * @dev Emitted when a transfer agent (TA) is added.
     * @param _agent The address of the TA added.
     */
    event taAdded(address indexed _agent);

    /**
     * @dev Emitted when a transfer agent (TA) is removed.
     * @param _agent The address of the TA removed.
     */
    event taRemoved(address indexed _agent);

    ///modifiers

    /**
     * @dev Modifier to restrict function access to only agents.
     * Reverts if the caller is not an agent.
     */
    modifier onlyAgent() {
        require(isAgent(msg.sender), "AgentRole: caller does not have the Agent role");
        _;
    }

    /**
     * @dev Modifier to restrict function access to agents or transfer agents (TAs).
     * Reverts if the caller is neither an agent nor a TA.
     */
    modifier onlyAgents() {
        require(isAgent(msg.sender) || isTA(msg.sender), "AgentRole or TARole: caller does not have the Agent role or TARole");
        _;
    }

    /**
     * @dev Adds an agent role to the specified address.
     * Can only be called by the contract owner.
     * @param _agent The address to be assigned as an agent.
     * Requirements:
     * - `_agent` must not be the zero address.
     */
    function addAgent(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _agents.add(_agent);
        emit AgentAdded(_agent);
    }

    /**
     * @dev Removes an agent role from the specified address.
     * Can only be called by the contract owner.
     * @param _agent The address to be removed from the agent role.
     * Requirements:
     * - `_agent` must not be the zero address.
     */
    function removeAgent(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _agents.remove(_agent);
        emit AgentRemoved(_agent);
    }

    /**
     * @dev Checks if an address has the agent role.
     * @param _agent The address to check.
     * @return `true` if the address is an agent, `false` otherwise.
     */
    function isAgent(address _agent) public view returns (bool) {
        return _agents.has(_agent);
    }

    /**
     * @dev Adds a transfer agent (TA) role to the specified address.
     * Can only be called by the contract owner.
     * @param _agent The address to be assigned as a TA.
     * Requirements:
     * - `_agent` must not be the zero address.
     */
    function addTA(address _agent) public onlyOwner{
        require(_agent != address(0), "invalid argument - zero address");
        _tAs.add(_agent);
        emit taAdded(_agent);
    }

    /**
     * @dev Removes a transfer agent (TA) role from the specified address.
     * Can only be called by the contract owner.
     * @param _agent The address to be removed from the TA role.
     * Requirements:
     * - `_agent` must not be the zero address.
     */
    function removeTA(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _tAs.remove(_agent);
        emit taRemoved(_agent);
    }

    /**
     * @dev Checks if an address has the transfer agent (TA) role.
     * @param _agent The address to check.
     * @return `true` if the address is a TA, `false` otherwise.
     */
    function isTA(address _agent) public view returns (bool) {
        return _tAs.has(_agent);
    }
}
