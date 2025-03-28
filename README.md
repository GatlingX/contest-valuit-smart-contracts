# Files in Scope

compliance
 modular
	IModularCompliance.sol - compliance/modular/IModularCompliance.sol
	MCStorage.sol - compliance/modular/MCStorage.sol
	ModularCompliance.sol - compliance/modular/ModularCompliance.sol
	
  modules
		AbstractModuleUpgradeable.sol - compliance/modular/modules/AbstractModuleUpgradeable.sol
		CountryAllowModule.sol - compliance/modular/modules/CountryAllowModule.sol
		HoldTimeModule.sol - compliance/modular/modules/HoldTimeModule.sol
		IModule.sol - compliance/modular/modules/IModule.sol
		MaxBalanceModule.sol - compliance/modular/modules/MaxBalanceModule.sol
		ModuleProxy.sol - compliance/modular/modules/ModuleProxy.sol
		SupplyLimitModule.sol - compliance/modular/modules/SupplyLimitModule.sol
		AbstractModule.sol - compliance/modular/modules/AbstractModule.sol
		CountryRestrictModule.sol - compliance/modular/modules/CountryRestrictModule.sol
		
escrow
	Escrow.sol - escrow/Escrow.sol
	EscrowStorage.sol - escrow/EscrowStorage.sol
	TransferHelper.sol - escrow/TransferHelper.sol
	EscrowController.sol - escrow/EscrowController.sol
	EscrowControllerProxy.sol - escrow/EscrowControllerProxy.sol

factory
	FactoryProxy.sol - factory/FactoryProxy.sol
	FundFactory.sol - factory/FundFactory.sol
	FundFactoryStorage.sol - factory/FundFactoryStorage.sol
	ITREXFactory.sol - factory/ITREXFactory.sol
	TREXFactory.sol - factory/TREXFactory.sol
	IFundFactory.sol - factory/IFundFactory.sol
	
fund
	EquityConfig.sol - fund/EquityConfig.sol
	EquityConfigStorage.sol - fund/EquityConfigStorage.sol
	Fund.sol - fund/Fund.sol
	FundStorage.sol - fund/FundStorage.sol
	IFactory.sol - fund/IFactory.sol
	IFund.sol - fund/IFund.sol
	ITKN.sol - fund/ITKN.sol
	
Helpers
	Bytes.sol - Helpers/Bytes.sol
	String.sol - Helpers/String.sol
	
onchainID
 factory
	IdFactory.sol - onchainID/factory/IdFactory.sol
	IIdFactory.sol - onchainID/factory/IIdFactory.sol
Identity.sol - onchainID/Identity.sol

 interface
	IClaimIssuer.sol - onchainID/interface/IClaimIssuer.sol
	IERC734.sol - onchainID/interface/IERC734.sol
	IERC735.sol - onchainID/interface/IERC735.sol
	IIdentity.sol - onchainID/interface/IIdentity.sol
	IImplementationAuthority.sol - onchainID/interface/IImplementationAuthority.sol
	
 proxy
	IdentityProxy.sol - onchainID/proxy/IdentityProxy.sol
	ImplementationAuthority.sol - onchainID/proxy/ImplementationAuthority.sol

 storage
	Storage.sol - onchainID/storage/Storage.sol
	Structs.sol - onchainID/storage/Structs.sol
	
 version
	Version.sol - onchainID/version/Version.sol
	ClaimIssuer.sol - onchainID/ClaimIssuer.sol

 verifiers
	Verifier.sol - onchainID/verifiers/Verifier.sol

 proxy
	AbstractProxy.sol - proxy/AbstractProxy.sol

 authority
	IAFactory.sol - proxy/authority/IAFactory.sol
	IIAFactory.sol - proxy/authority/IIAFactory.sol
	ITREXImplementationAuthority.sol - proxy/authority/ITREXImplementationAuthority.sol
	TREXImplementationAuthority.sol - proxy/authority/TREXImplementationAuthority.sol
	ClaimTopicsRegistryProxy.sol - proxy/ClaimTopicsRegistryProxy.sol
	IdentityRegistryProxy.sol - proxy/IdentityRegistryProxy.sol
	IdentityRegistryStorageProxy.sol - proxy/IdentityRegistryStorageProxy.sol
	
 interface
	IImplementationAuthority.sol - proxy/interface/IImplementationAuthority.sol
	IProxy.sol - proxy/interface/IProxy.sol
	ModularComplianceProxy.sol - proxy/ModularComplianceProxy.sol
	ProxyV1.sol - proxy/ProxyV1.sol
	TokenProxy.sol - proxy/TokenProxy.sol
	TrustedIssuersRegistryProxy.sol - proxy/TrustedIssuersRegistryProxy.sol
	

registry
  implementation
		ClaimTopicsRegistry.sol - registry/implementation/ClaimTopicsRegistry.sol
		IdentityRegistry.sol - registry/implementation/IdentityRegistry.sol
		IdentityRegistryStorage.sol - registry/implementation/IdentityRegistryStorage.sol
		TrustedIssuersRegistry.sol - registry/implementation/TrustedIssuersRegistry.sol
  interface
		IClaimTopicsRegistry.sol - registry/interface/IClaimTopicsRegistry.sol
		IIdentityRegistry.sol - registry/interface/IIdentityRegistry.sol
		IIdentityRegistryStorage.sol - registry/interface/IIdentityRegistryStorage.sol
		ITrustedIssuersRegistry.sol - registry/interface/ITrustedIssuersRegistry.sol
  storage
		CTRStorage.sol - registry/storage/CTRStorage.sol
		IRSStorage.sol - registry/storage/IRSStorage.sol
		IRStorage.sol - registry/storage/IRStorage.sol
		TIRStorage.sol - registry/storage/TIRStorage.sol

 roles
	AgentRole.sol - roles/AgentRole.sol
	AgentRoleUpgradeable.sol - roles/AgentRoleUpgradeable.sol
	Roles.sol - roles/Roles.sol

 token
	IToken.sol - token/IToken.sol
	Token.sol - token/Token.sol
	TokenStorage.sol - token/TokenStorage.sol
	VERC20.sol - token/VERC20.sol

 wrapper
	Wrapper.sol - wrapper/Wrapper.sol
	WrapperStorage.sol - wrapper/WrapperStorage.sol
	WrapperProxy.sol - wrapper/WrapperProxy.sol
