// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.17;

interface IWrapper {

    /**
     * @dev Emitted when a new wrapped ERC20 token is created for an ERC3643-compliant asset.
     * @param _erc3643 The address of the original ERC3643 token.
     * @param _erc20 The address of the newly created wrapped ERC20 token.
     */
     event WrapTokenCreated(
        address _erc3643,
        address _erc20
    );

    /**
     * @dev Emitted when ERC3643 tokens are locked in the contract and an equivalent amount of wrapped ERC20 tokens are minted.
     * @param _erc3643 The address of the locked ERC3643 token.
     * @param _erc20 The address of the corresponding wrapped ERC20 token.
     * @param _amount The amount of tokens locked.
     * @param _tax The tax amount deducted in stablecoin.
     * @param timestamp The timestamp when the locking operation occurred.
     */
    event TokenLocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 _tax,
        uint256 timestamp
    );

    /**
     * @dev Emitted when wrapped ERC20 tokens are burned, and the corresponding ERC3643 tokens are released.
     * @param _erc3643 The address of the released ERC3643 token.
     * @param _erc20 The address of the corresponding wrapped ERC20 token.
     * @param _amount The amount of tokens unlocked.
     * @param timestamp The timestamp when the unlocking operation occurred.
     */
    event TokenUnlocked(
        address _erc3643,
        address _erc20,
        uint256 _amount,
        uint256 timestamp
    );

    /**
     * @dev Emitted when the on-chain identity of the wrapper contract is updated.
     * @param _newID The new on-chain identity address.
     */
    event OnChainIDUpdated(
        address _newID
    );

    /**
     * @dev Emitted when the Fund Factory contract address is updated.
     * @param fundFactory The new Fund Factory contract address.
     */
    event FundFactoryUpdated(
        address fundFactory
    );

    /**
     * @dev Emitted when the escrow controller address is updated.
     * @param escrowController The new escrow controller contract address.
     */
    event EscrowControllerUpdated(
        address escrowController
    );

    /**
     * @dev Emitted when the stablecoin used for transactions is updated.
     * @param stableCoinAddress The address of the new stablecoin contract.
     * @param stableCoin The identifier of the new stablecoin.
     */
    event StableCoinUpdated(
        address stableCoinAddress,
        string stableCoin
    );

}

