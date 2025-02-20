// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

contract MCStorage {

    /**
     * @dev Emitted when the wrapper contract status is updated.
     * 
     * @param Wrapper The address of the wrapper contract.
     * @param _status The new status of the wrapper (true if set, false if removed).
     */
    event WrapperUpdated(
        address Wrapper,
        bool _status
    );

    /// token linked to the compliance contract
    address internal _tokenBound;

    /// Array of modules bound to the compliance
    address[] internal _modules;

    /// Mapping of module binding status
    mapping(address => bool) internal _moduleBound;

    /// Boolean flag indicating whether a wrapper contract has been set.
    bool public wrapperSet;

    /// Address of the wrapper contract.
    address public wrapper;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     */
    uint256[49] private __gap;
}
