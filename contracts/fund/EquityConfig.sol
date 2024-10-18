// SPDX-License-Identifier: GPL-3.0

/*
      █████╗ ███╗   ██╗████████╗██╗███████╗██████╗ 
     ██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝██╔══██╗
     ███████║██╔██╗ ██║   ██║   ██║█████╗  ██████╔╝
     ██╔══██║██║╚██╗██║   ██║   ██║██╔══╝  ██╔══██╗
     ██║  ██║██║ ╚████║   ██║   ██║███████╗██║  ██║
     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝╚═╝  ╚═╝                                      
*/

pragma solidity ^0.8.0;

import "contracts/fund/EquityConfigStorage.sol";
import "contracts/factory/ITREXFactory.sol";
import 'contracts/fund/ITKN.sol';
import 'contracts/escrow/TransferHelper.sol';
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract EquityConfig is Initializable, EquityConfigStorage, OwnableUpgradeable {

    function init(address _token, bytes memory _data) external initializer{
        _transferOwnership(msg.sender);
        factory = address(msg.sender);

        token = _token;
        fundName = IToken(_token).name();

        (minInvestment, 
        maxInvestment,
        launchValuation,
        projectedYield,
        DERatio) = abi.decode(_data, (uint256, uint256, uint256, uint256, string));
        currentValuation = launchValuation;
    }

    function setValuation(uint256 _latestValuation) external returns(bool){
        require(ITKN(token).isAgent(msg.sender), "Only Token Agent can call");
        previousValutaion = currentValuation;
        currentValuation = _latestValuation;
        return true;
    }

}
