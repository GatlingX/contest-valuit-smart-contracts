// SPDX-License-Identifier: MIT
// TechnicallyWeb3[utils/String.sol] Updated version 0.0.5

pragma solidity ^0.8.17;

import "./Bytes.sol";

/**
 * @title String Tools
 * @dev Utilities for working with strings in Solidity
 */
library String {
    using Bytes for bytes;

    /**
     * @dev Returns the length of the input string in bytes.
     * @param inputString The input string.
     * @return The length of the input string in bytes.
     */
    function length(string memory inputString) internal pure returns (uint256) {
        bytes memory inputBytes = bytes(inputString);
        return inputBytes.length;
    }

    /**
     * @dev Returns the character at the specified index in the input string.
     * @param inputString The input string.
     * @param charIndex The index of the character to retrieve.
     * @return The character at the specified index.
     */
    function charAt(string memory inputString, uint256 charIndex) internal pure returns (string memory) {
        require(charIndex < bytes(inputString).length, "charIndex out of inputString bounds");
        return string(abi.encodePacked(bytes(inputString)[charIndex]));
    }

    /**
     * @dev Checks if the input string starts with the specified prefix.
     * @param inputString The input string.
     * @param compareString The prefix to check.
     * @return True if the input string starts with the prefix, false otherwise.
     */
    function startsWith(string memory inputString, string memory compareString) internal pure returns (bool) {
        return bytes(inputString).startsWith(bytes(compareString));
    } 

    /**
     * @dev Checks if the input string ends with the specified suffix.
     * @param inputString The input string.
     * @param compareString The suffix to check.
     * @return True if the input string ends with the suffix, false otherwise.
     */
    function endsWith(string memory inputString, string memory compareString) internal pure returns (bool) {
        return bytes(inputString).endsWith(bytes(compareString));
    }

    /**
     * @dev Checks if the input string contains the specified substring.
     * @param inputString The input string.
     * @param compareString The substring to search for.
     * @return True if the input string contains the substring, false otherwise.
     */
    function includes(string memory inputString, string memory compareString) internal pure returns (bool) {
        return bytes(inputString).includes(bytes(compareString));
    }

    /**
     * @dev Checks if two strings are equal.
     * @param inputString The first string.
     * @param compareString The second string.
     * @return True if the strings are equal, false otherwise.
     */
    function equals(string memory inputString, string memory compareString) internal pure returns (bool) {
        return bytes(inputString).equals(bytes(compareString));
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
     * @dev Returns the index of the first occurrence of a substring in the input string.
     * @param inputString The input string.
     * @param compareString The substring to search for.
     * @param startIndex The starting index for the search (optional).
     * @return The index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function indexOf(string memory inputString, string memory compareString, uint256 startIndex) internal pure returns (uint256) {
        return bytes(inputString).indexOf(bytes(compareString), startIndex);
    }

    /**
     * @dev Returns the index of the first occurrence of a substring in the input string.
     * @param inputString The input string.
     * @param compareString The substring to search for.
     * @return The index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function indexOf(string memory inputString, string memory compareString) internal pure returns (uint256) {
        return indexOf(inputString, compareString, 0);
    }

    /**
     * @dev Returns the last index of the first occurrence of a substring in the input string.
     * @param inputString The input string.
     * @param compareString The substring to search for.
     * @return The last index of the first occurrence of the substring, or type(uint256).max if not found.
     */
    function lastIndexOf(string memory inputString, string memory compareString) internal pure returns (uint256) {
        return bytes(inputString).lastIndexOf(bytes(compareString));
    }

    /**
     * @dev Returns a substring of the input string.
     * @param inputString The input string.
     * @param startIndex The starting index of the substring (inclusive).
     * @param endIndex The ending index of the substring (exclusive).
     * @return The substring.
     */
    function slice(string memory inputString, int256 startIndex, int256 endIndex) internal pure returns (string memory) {
        return string(bytes(inputString).slice(startIndex, endIndex));
    }

    /**
     * @dev Splits the input string into an array of substrings using the specified delimiter.
     * @param inputString The input string.
     * @param delimiterString The delimiter used to split the string.
     * @return An array of substrings.
     */
    function split(string memory inputString, string memory delimiterString) internal pure returns (string[] memory) {
        bytes[] memory bytesArray = bytes(inputString).split(bytes(delimiterString));
        string[] memory stringArray = new string[](bytesArray.length);
        for (uint256 i; i < bytesArray.length; i++) {
            stringArray[i] = string(bytesArray[i]);
        }
        return stringArray;
    }

    /**
     * @dev Converts the input string to lowercase.
     * @param inputString The input string.
     * @return The input string converted to lowercase.
     */
    function toLowerCase(string memory inputString) internal pure returns (string memory) {
        return string(bytes(inputString).toLowerCase());
    }

    /**
     * @dev Converts the input string to uppercase.
     * @param inputString The input string.
     * @return The input string converted to uppercase.
     */
    function toUpperCase(string memory inputString) internal pure returns (string memory) {
        return string(bytes(inputString).toUpperCase());
    }
}
