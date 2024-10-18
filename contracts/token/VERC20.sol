// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VERC20 is ERC20Upgradeable, OwnableUpgradeable {
    
    function init(string memory name_, string memory symbol_, uint8 decimals_) external{
        __ERC20_init(name_,symbol_, decimals_);
        __Ownable_init();
    }

    function mint(address to, uint256 amount) public onlyOwner{
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner{
        _burn(from, amount);
    }
}