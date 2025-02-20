// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "contracts/Helpers/ERC20Upgradeable.sol";
import "contracts/Helpers/OwnableUpgradeable.sol";

contract VERC20 is ERC20Upgradeable, OwnableUpgradeable {
    
    /**
     * @dev Initializes the ERC20 token with a name, symbol, and decimals.
     * Also initializes the Ownable contract to set the deployer as the initial owner.
     * This function can only be called once due to the `initializer` modifier.
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     * @param decimals_ The number of decimal places the token supports.
     */
    function init(string memory name_, string memory symbol_, uint8 decimals_) external initializer{
        __ERC20_init(name_,symbol_, decimals_);
        __Ownable_init();
    }

    /**
     * @dev Mints new tokens and assigns them to the specified address.
     * Can only be called by the contract owner.
     * @param to The address to receive the minted tokens.
     * @param amount The number of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner{
        _mint(to, amount);
    }

    /**
     * @dev Burns a specified number of tokens from a given address.
     * Can only be called by the contract owner.
     * @param from The address from which tokens will be burned.
     * @param amount The number of tokens to burn.
     */
    function burn(address from, uint256 amount) public onlyOwner{
        _burn(from, amount);
    }
}