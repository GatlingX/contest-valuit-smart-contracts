// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

/**
 * @title TransferHelper
 * @dev Library for safely handling ERC20 token interactions and ETH transfers,
 *      ensuring proper execution and error handling.
 */
library TransferHelper {

    /**
     * @dev Safely approves the given spender to spend the specified amount of tokens.
     *      Ensures the call does not fail and that the return data (if any) is valid.
     * @param token The address of the ERC20 token.
     * @param to The address to approve as a spender.
     * @param value The amount of tokens to approve.
     */
    function safeApprove(
        address token,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            'TransferHelper::safeApprove: approve failed'
        );
    }

    /**
     * @dev Safely transfers the specified amount of tokens to the given recipient.
     *      Ensures the call does not fail and that the return data (if any) is valid.
     * @param token The address of the ERC20 token.
     * @param to The recipient address.
     * @param value The amount of tokens to transfer.
     */
    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            'TransferHelper::safeTransfer: transfer failed'
        );
    }

    /**
     * @dev Safely transfers the specified amount of tokens from one address to another.
     *      Ensures the call does not fail and that the return data (if any) is valid.
     * @param token The address of the ERC20 token.
     * @param from The address from which tokens are transferred.
     * @param to The recipient address.
     * @param value The amount of tokens to transfer.
     */
    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {

        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            'TransferHelper::transferFrom: transferFrom failed'
        );
    }

     /**
     * @dev Safely transfers ETH to the specified recipient.
     *      Ensures that the call does not fail.
     * @param to The recipient address.
     * @param value The amount of ETH to transfer.
     */
    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'TransferHelper::safeTransferETH: ETH transfer failed');
    }
}
