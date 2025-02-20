// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

/// @dev interface
interface ITKN {

 
    /**
     * @dev Returns the total Supply of the token.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Checks if a given address is an authorized agent for the token.
     * @param _agent The address to verify.
     * @return A boolean indicating whether the address is an authorized agent (true) or not (false).
     */
    function isAgent(address _agent) external view returns (bool);

     /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

}
