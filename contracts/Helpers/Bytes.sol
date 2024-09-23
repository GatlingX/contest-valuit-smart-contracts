// SPDX-License-Identifier: MIT
// TechnicallyWeb3[utils/Bytes.sol] Updated version 0.0.7

pragma solidity ^0.8.17;

/**
 * @title Bytes Tools
 * @dev Utilities for working with bytes in Solidity
 */
library Bytes {

    function copyBytes(bytes memory inputBytes) private pure returns (bytes memory) {
        bytes memory copy = new bytes(inputBytes.length);
        uint256 max = inputBytes.length + 31;
        for (uint256 i=32; i<=max; i+=32)
        {
            assembly { mstore(add(copy, i), mload(add(inputBytes, i))) }
        }
        return copy;
    }

    /**
     * @dev Checks if the input bytes start with the specified prefix.
     * @param inputBytes The input bytes.
     * @param compareBytes The prefix to check.
     * @return True if the input bytes start with the prefix, false otherwise.
     */
    function startsWith(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (bool) {
        for (uint256 i; i < compareBytes.length; i++) {
            if (inputBytes[i] != compareBytes[i]) return false;
        }
        return true;
    }

    /**
     * @dev Checks if the input bytes end with the specified suffix.
     * @param inputBytes The input bytes.
     * @param compareBytes The suffix to check.
     * @return True if the input bytes end with the suffix, false otherwise.
     */
    function endsWith(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (bool) {
        for (uint256 i; i < compareBytes.length; i++) {
            if (inputBytes[inputBytes.length - i - 1] != compareBytes[compareBytes.length - i - 1]) return false;
        }
        return true;
    }

    /**
     * @dev Checks if the input bytes contain the specified substring.
     * @param inputBytes The input bytes.
     * @param compareBytes The substring to search for.
     * @return True if the input bytes contain the substring, false otherwise.
     */
    function includes(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (bool) {
        for (uint256 i; i <= inputBytes.length - compareBytes.length; i++) {
            uint256 compareLength = 0;
            for (uint256 j = 0; j < compareBytes.length; j++) {
                if (inputBytes[i + j] == compareBytes[j]) {
                    compareLength++;
                } else {
                    break;
                }
            }
            if (compareLength == compareBytes.length) return true;
        }
        return false;
    }

    /**
     * @dev Checks if two byte arrays are equal.
     * @param inputBytes The first byte array.
     * @param compareBytes The second byte array.
     * @return True if the byte arrays are equal, false otherwise.
     */
    function equals(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (bool) {
        if (inputBytes.length != compareBytes.length) return false;
        for (uint256 i; i < inputBytes.length; i++) {
            if (inputBytes[i] != compareBytes[i]) return false;
        }
        return true;
    }

    /**
     * @dev Returns the index of the first occurrence of a substring in the input bytes.
     * @param inputBytes The input bytes.
     * @param compareBytes The substring to search for.
     * @param startIndex The starting index for the search (optional).
     * @return The index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function indexOf(bytes memory inputBytes, bytes memory compareBytes, uint256 startIndex) internal pure returns (uint256) {
        uint256 index = startIndex;
        for (index; index <= inputBytes.length - compareBytes.length; index++) {
            uint256 compareLength = 0;
            for (uint256 j = 0; j < compareBytes.length; j++) {
                if (inputBytes[index + j] == compareBytes[j]) {
                    compareLength++;
                } else {
                    break;
                }
            }
            if (compareLength == compareBytes.length) return index;
        }
        return type(uint256).max;
    }

    /**
     * @dev Returns the index of the first occurrence of a substring in the input string.
     * @param inputBytes The input string.
     * @param compareBytes The substring to search for.
     * @return The index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function indexOf(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (uint256) {
        return indexOf(inputBytes, compareBytes, 0);
    }

    /**
     * @dev Returns the last index of the first occurrence of a substring in the input bytes.
     * @param inputBytes The input bytes.
     * @param compareBytes The substring to search for.
     * @return The last index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function lastIndexOf(bytes memory inputBytes, bytes memory compareBytes) internal pure returns (uint256) {
        uint256 index;
        for (index; index <= inputBytes.length - compareBytes.length; index++) {
            uint256 compareLength = 0;
            for (uint256 j = 0; j < compareBytes.length; j++) {
                if (inputBytes[inputBytes.length - (index + j) - 1] == compareBytes[compareBytes.length - j - 1]) {
                    compareLength++;
                } else {
                    break;
                }
            }
            if (compareLength == compareBytes.length) return inputBytes.length - compareBytes.length - index;
        }
        return type(uint256).max;
    }

    /**
     * @dev Returns a substring of the input bytes.
     * @param inputBytes The input bytes.
     * @param startIndex The starting index of the substring (inclusive).
     * @param endIndex The ending index of the substring (exclusive).
     * @return The substring.
     */
    function slice(bytes memory inputBytes, int256 startIndex, int256 endIndex) internal pure returns (bytes memory) {
        require(inputBytes.length > 0, "Cannot slice empty data");

        if (startIndex < 0) {
            startIndex = int256(inputBytes.length) + startIndex;
        }
        if (endIndex < 0) {
            endIndex = int256(inputBytes.length) + endIndex;
        }

        if (startIndex >= int256(inputBytes.length)) {
            startIndex = int256(inputBytes.length - 1);
        }
        if (endIndex >= int256(inputBytes.length)) {
            endIndex = int256(inputBytes.length - 1);
        }

        require(startIndex <= endIndex, "endIndex must come after startIndex");

        bytes memory outputBytes = new bytes(uint256(endIndex - startIndex));

        for (uint256 i; i < outputBytes.length; i++) {
            outputBytes[i] = inputBytes[uint256(startIndex) + i];
        }

        return outputBytes;
    }

    /**
     * @dev Splits the input bytes into an array of substrings using the specified delimiter.
     * @param inputBytes The input bytes.
     * @param delimiterBytes The delimiter used to split the bytes.
     * @return An array of substrings.
     */
    function split(bytes memory inputBytes, bytes memory delimiterBytes) internal pure returns (bytes[] memory) {
        uint256 currentIndex = 0;
        uint256 delimiterIndex = indexOf(inputBytes, delimiterBytes, currentIndex);
        uint256 arrayLength = 1;

        // Count the number of substrings
        for (arrayLength; delimiterIndex != type(uint256).max; arrayLength++) {
            currentIndex = delimiterIndex + delimiterBytes.length;
            delimiterIndex = indexOf(inputBytes, delimiterBytes, currentIndex);
        }

        // Initialize the output array
        bytes[] memory outputBytes = new bytes[](arrayLength);
        currentIndex = 0;

        // Split the input bytes
        for (uint256 i = 0; i < arrayLength - 1; i++) {
            delimiterIndex = indexOf(inputBytes, delimiterBytes, currentIndex);
            outputBytes[i] = slice(inputBytes, int256(currentIndex), int256(delimiterIndex));
            currentIndex = delimiterIndex + delimiterBytes.length;
        }
        // Add last slice
        outputBytes[outputBytes.length - 1] = slice(inputBytes, int256(currentIndex), int256(inputBytes.length));

        return outputBytes;
    }

    /**
     * @dev Converts the input bytes to lowercase.
     * @param inputBytes The input bytes.
     * @return The input bytes converted to lowercase.
     */
    function toLowerCase(bytes memory inputBytes) internal pure returns (bytes memory) {
        bytes memory outputBytes = copyBytes(inputBytes);
        for (uint256 i; i < inputBytes.length; i++) {
            // Check uppercase
            if (
                uint8(inputBytes[i]) > 64 && uint8(inputBytes[i]) < 91 || 
                uint8(inputBytes[i]) > 191 && uint8(inputBytes[i]) < 224
            ) {
                // Add 32 to make it lowercase
                unchecked {
                    outputBytes[i] = bytes1(uint8(inputBytes[i]) + 32);
                }
            }
        }
        return outputBytes;
    }

    /**
     * @dev Converts the input bytes to uppercase.
     * @param inputBytes The input bytes.
     * @return The input bytes converted to uppercase.
     */
    function toUpperCase(bytes memory inputBytes) internal pure returns (bytes memory) {
        bytes memory outputBytes = copyBytes(inputBytes);
        for (uint256 i; i < inputBytes.length; i++) {
            // Check lowercase
            if (
                uint8(inputBytes[i]) > 96 && uint8(inputBytes[i]) < 123 ||
                uint8(inputBytes[i]) > 223 && uint8(inputBytes[i]) < 256
            ) {
                // Subtract 32 to make it uppercase
                unchecked {
                    outputBytes[i] = bytes1(uint8(inputBytes[i]) - 32);
                }
            }
        }
        return outputBytes;
    }
}