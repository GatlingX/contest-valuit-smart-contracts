// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "../roles/AgentRole.sol";
import "../token/IToken.sol";
import "../registry/interface/IClaimTopicsRegistry.sol";
import "../registry/interface/IIdentityRegistry.sol";
import "../compliance/modular/IModularCompliance.sol";
import "../registry/interface/ITrustedIssuersRegistry.sol";
import "../registry/interface/IIdentityRegistryStorage.sol";
import "../proxy/authority/ITREXImplementationAuthority.sol";
import "../proxy/TokenProxy.sol";
import "../proxy/ClaimTopicsRegistryProxy.sol";
import "../proxy/IdentityRegistryProxy.sol";
import "../proxy/IdentityRegistryStorageProxy.sol";
import "../proxy/TrustedIssuersRegistryProxy.sol";
import "../proxy/ModularComplianceProxy.sol";
import "./ITREXFactory.sol";
import "contracts/onchainID/factory/IIdFactory.sol";


contract TREXFactory is ITREXFactory, Ownable {

    /// the address of the implementation authority contract used in the tokens deployed by the factory
    address private _implementationAuthority;

    /// the address of the Identity Factory used to deploy token OIDs
    address private _idFactory;

    /// mapping containing info about the token contracts corresponding to salt already used for CREATE2 deployments
    mapping(string => address) public tokenDeployed;
    mapping(address => bool) public deployedByMe;

    address public wrapper;

    /// constructor is setting the implementation authority and the Identity Factory of the TREX factory
    constructor(address implementationAuthority_, address idFactory_, address wrapper_) {
        setImplementationAuthority(implementationAuthority_);
        setIdFactory(idFactory_);
        setWrapper(wrapper_);
    }

    /**
     *  @dev See {ITREXFactory-deployTREXSuite}.
     */
    // solhint-disable-next-line code-complexity, function-max-lines
    function deployTREXSuite(string memory _salt, TokenDetails calldata _tokenDetails, ClaimDetails calldata
        _claimDetails)
    external override onlyOwner {
        require(tokenDeployed[_salt] == address(0)
        , "token already deployed");
        require((_claimDetails.issuers).length == (_claimDetails.issuerClaims).length
        , "claim pattern not valid");
        require((_claimDetails.issuers).length <= 5
        , "max 5 claim issuers at deployment");
        require((_claimDetails.claimTopics).length <= 5
        , "max 5 claim topics at deployment");
        require((_tokenDetails.irAgents).length <= 5 && (_tokenDetails.tokenAgents).length <= 5
        , "max 5 agents at deployment");
        require((_tokenDetails.complianceModules).length <= 30
        , "max 30 module actions at deployment");
        require((_tokenDetails.complianceModules).length >= (_tokenDetails.complianceSettings).length
        , "invalid compliance pattern");

        ITrustedIssuersRegistry tir = ITrustedIssuersRegistry(_deployTIR(_salt, _implementationAuthority));
        IClaimTopicsRegistry ctr = IClaimTopicsRegistry(_deployCTR(_salt, _implementationAuthority));
        IModularCompliance mc = IModularCompliance(_deployMC(_salt, _implementationAuthority));
        IIdentityRegistryStorage irs;
        if (_tokenDetails.irs == address(0)) {
            irs = IIdentityRegistryStorage(_deployIRS(_salt, _implementationAuthority));
        }
        else {
            irs = IIdentityRegistryStorage(_tokenDetails.irs);
        }
        IIdentityRegistry ir = IIdentityRegistry(_deployIR(_salt, _implementationAuthority, address(tir),
            address(ctr), address(irs)));
        IToken token = IToken(_deployToken
            (
                _salt,
                _implementationAuthority,
                address(ir),
                address(mc),
                _tokenDetails.name,
                _tokenDetails.symbol,
                _tokenDetails.decimals,
                _tokenDetails.ONCHAINID
            ));
        if(_tokenDetails.ONCHAINID == address(0)) {
            address _tokenID = IIdFactory(_idFactory).createTokenIdentity(address(token), _tokenDetails.owner, _salt);
            token.setOnchainID(_tokenID);
        }
        for (uint256 i = 0; i < (_claimDetails.claimTopics).length; i++) {
            ctr.addClaimTopic(_claimDetails.claimTopics[i]);
        }
        for (uint256 i = 0; i < (_claimDetails.issuers).length; i++) {
            tir.addTrustedIssuer(IClaimIssuer((_claimDetails).issuers[i]), _claimDetails.issuerClaims[i]);
        }
        irs.bindIdentityRegistry(address(ir));
        AgentRole(address(ir)).addAgent(address(token));
        for (uint256 i = 0; i < (_tokenDetails.irAgents).length; i++) {
            AgentRole(address(ir)).addAgent(_tokenDetails.irAgents[i]);
        }
        for (uint256 i = 0; i < (_tokenDetails.tokenAgents).length; i++) {
            AgentRole(address(token)).addAgent(_tokenDetails.tokenAgents[i]);
        }
        for (uint256 i=0; i < (_tokenDetails.transferAgents).length; i++){
            AgentRole(address(token)).addTA(_tokenDetails.transferAgents[i]);
            AgentRole(address(ir)).addAgent(_tokenDetails.transferAgents[i]);
        }
        for (uint256 i = 0; i < (_tokenDetails.complianceModules).length; i++) {
            if (!mc.isModuleBound(_tokenDetails.complianceModules[i])) {
                mc.addModule(_tokenDetails.complianceModules[i]);
            }
            if (i < (_tokenDetails.complianceSettings).length) {
                mc.callModuleFunction(_tokenDetails.complianceSettings[i], _tokenDetails.complianceModules[i]);
            }
        }
        if(_tokenDetails.wrap){
            mc.setWrapper(wrapper, true);
        }
        tokenDeployed[_salt] = address(token);
        deployedByMe[address(token)] = true;
        (Ownable(address(token))).transferOwnership(_tokenDetails.owner);
        (Ownable(address(ir))).transferOwnership(_tokenDetails.owner);
        (Ownable(address(tir))).transferOwnership(_tokenDetails.owner);
        (Ownable(address(ctr))).transferOwnership(_tokenDetails.owner);
        (Ownable(address(mc))).transferOwnership(_tokenDetails.owner);
        emit TREXSuiteDeployed(address(token), address(ir), address(irs), address(tir), address(ctr), address(mc), _salt);
    }

    /**
     *  @dev See {ITREXFactory-recoverContractOwnership}.
     */
    function recoverContractOwnership(address _contract, address _newOwner) external override onlyOwner {
        (Ownable(_contract)).transferOwnership(_newOwner);
    }

    /**
     *  @dev See {ITREXFactory-getImplementationAuthority}.
     */
    function getImplementationAuthority() external override view returns(address) {
        return _implementationAuthority;
    }

    /**
     *  @dev See {ITREXFactory-getIdFactory}.
     */
    function getIdFactory() external override view returns(address) {
        return _idFactory;
    }

    /**
     *  @dev See {ITREXFactory-getToken}.
     */
    function getToken(string calldata _salt) external override view returns(address) {
        return tokenDeployed[_salt];
    }

    /**
     *  @dev See {ITREXFactory-tokenDeployedByMe}.
     */
    function tokenDeployedByMe(address _token)external override view returns(bool) {
        return deployedByMe[_token];
    }

    /**
     *  @dev See {ITREXFactory-setImplementationAuthority}.
     */
    function setImplementationAuthority(address implementationAuthority_) public override onlyOwner {
        require(implementationAuthority_ != address(0), "invalid argument - zero address");
        // should not be possible to set an implementation authority that is not complete
        require(
            (ITREXImplementationAuthority(implementationAuthority_)).getTokenImplementation() != address(0)
            && (ITREXImplementationAuthority(implementationAuthority_)).getCTRImplementation() != address(0)
            && (ITREXImplementationAuthority(implementationAuthority_)).getIRImplementation() != address(0)
            && (ITREXImplementationAuthority(implementationAuthority_)).getIRSImplementation() != address(0)
            && (ITREXImplementationAuthority(implementationAuthority_)).getMCImplementation() != address(0)
            && (ITREXImplementationAuthority(implementationAuthority_)).getTIRImplementation() != address(0),
            "invalid Implementation Authority");
        _implementationAuthority = implementationAuthority_;
        emit ImplementationAuthoritySet(implementationAuthority_);
    }

    /**
     *  @dev See {ITREXFactory-setIdFactory}.
     */
    function setIdFactory(address idFactory_) public override onlyOwner {
        require(idFactory_ != address(0), "invalid argument - zero address");
        _idFactory = idFactory_;
        emit IdFactorySet(idFactory_);
    }

    /**
     * @dev Sets the address of the wrapper contract.
     * Can only be called by the contract owner.
     * @param wrapper_ The address of the new wrapper contract.
     * Requirements:
     * - `wrapper_` must not be the zero address.
     */
    function setWrapper(address wrapper_) public onlyOwner {
        require(wrapper_ != address(0), "invalid argument - zero address");
        wrapper = wrapper_;
    }

    /// deploy function with create2 opcode call
    /// returns the address of the contract created
    function _deploy(string memory salt, bytes memory bytecode) private returns (address) {
        bytes32 saltBytes = bytes32(keccak256(abi.encodePacked(salt)));
        address addr;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let encoded_data := add(0x20, bytecode) // load initialization code.
            let encoded_size := mload(bytecode)     // load init code's length.
            addr := create2(0, encoded_data, encoded_size, saltBytes)
            if iszero(extcodesize(addr)) {
                revert(0, 0)
            }
        }
        emit Deployed(addr);
        return addr;
    }

    /// function used to deploy a trusted issuers registry using CREATE2
    function _deployTIR
    (
        string memory _salt,
        address implementationAuthority_
    ) private returns (address){
        bytes memory _code = type(TrustedIssuersRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode(implementationAuthority_);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }

    /// function used to deploy a claim topics registry using CREATE2
    function  _deployCTR
    (
        string memory _salt,
        address implementationAuthority_
    ) private returns (address) {
        bytes memory _code = type(ClaimTopicsRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode(implementationAuthority_);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }

    /// function used to deploy modular compliance contract using CREATE2
    function  _deployMC
    (
        string memory _salt,
        address implementationAuthority_
    ) private returns (address) {
        bytes memory _code = type(ModularComplianceProxy).creationCode;
        bytes memory _constructData = abi.encode(implementationAuthority_);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }

    /// function used to deploy an identity registry storage using CREATE2
    function _deployIRS
    (
        string memory _salt,
        address implementationAuthority_
    ) private returns (address) {
        bytes memory _code = type(IdentityRegistryStorageProxy).creationCode;
        bytes memory _constructData = abi.encode(implementationAuthority_);
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }

    /// function used to deploy an identity registry using CREATE2
    function _deployIR
    (
        string memory _salt,
        address implementationAuthority_,
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry,
        address _identityStorage
    ) private returns (address) {
        bytes memory _code = type(IdentityRegistryProxy).creationCode;
        bytes memory _constructData = abi.encode
        (
            implementationAuthority_,
            _trustedIssuersRegistry,
            _claimTopicsRegistry,
            _identityStorage
        );
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }

    /// function used to deploy a token using CREATE2
    function _deployToken
    (
        string memory _salt,
        address implementationAuthority_,
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _onchainId
    ) private returns (address) {
        bytes memory _code = type(TokenProxy).creationCode;
        bytes memory _constructData = abi.encode
        (
            implementationAuthority_,
            _identityRegistry,
            _compliance,
            _name,
            _symbol,
            _decimals,
            _onchainId
        );
        bytes memory bytecode = abi.encodePacked(_code, _constructData);
        return _deploy(_salt, bytecode);
    }
}
