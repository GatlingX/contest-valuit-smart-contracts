// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./Roles.sol";

contract AgentRole is Ownable {
    using Roles for Roles.Role;

    Roles.Role private _agents;
    Roles.Role private _tAs;

    event AgentAdded(address indexed _agent);
    event AgentRemoved(address indexed _agent);
    event taAdded(address indexed _agent);
    event taRemoved(address indexed _agent);

    modifier onlyAgent() {
        require(isAgent(msg.sender), "AgentRole: caller does not have the Agent role");
        _;
    }

    modifier onlyAgents() {
        require(isAgent(msg.sender) || isTA(msg.sender), "AgentRole or TARole: caller does not have the Agent role or TARole");
        _;
    }

    function addAgent(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _agents.add(_agent);
        emit AgentAdded(_agent);
    }

    function removeAgent(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _agents.remove(_agent);
        emit AgentRemoved(_agent);
    }

    function isAgent(address _agent) public view returns (bool) {
        return _agents.has(_agent);
    }

    function addTA(address _agent) public onlyOwner{
        require(_agent != address(0), "invalid argument - zero address");
        _tAs.add(_agent);
        emit taAdded(_agent);
    }

    function removeTA(address _agent) public onlyOwner {
        require(_agent != address(0), "invalid argument - zero address");
        _tAs.remove(_agent);
        emit taRemoved(_agent);
    }

    function isTA(address _agent) public view returns (bool) {
        return _tAs.has(_agent);
    }
}
