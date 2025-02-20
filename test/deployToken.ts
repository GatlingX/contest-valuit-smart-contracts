import { expect, use } from "chai";
import { ethers } from "hardhat";
const { BigNumber } = require('ethers');
import "@nomicfoundation/hardhat-chai-matchers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimIssuer, 
ClaimIssuer__factory, 
ClaimTopicsRegistry, 
ClaimTopicsRegistry__factory, 
CountryAllowModule, 
CountryAllowModule__factory, 
EquityConfig, 
EquityConfig__factory, 
// Escrow, 
// Escrow__factory,
// // EscrowProxy,
// // EscrowProxy__factory,
EscrowController, EscrowControllerProxy, EscrowControllerProxy__factory, EscrowController__factory, EscrowStorage, EscrowStorage__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, USDT, USDT__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory, } from "../typechain"; import { sync } from "glob"; import { onchainId, token } from "../typechain/contracts";

describe(" Deploy token Testing ", function () { let signers: SignerWithAddress[]; let owner: SignerWithAddress; let tokenIssuer: SignerWithAddress; let transferAgent: SignerWithAddress; let user1: SignerWithAddress; let user2: SignerWithAddress; let user3: SignerWithAddress;

//Implementation
let claimTopicsRegistryImplementation: ClaimTopicsRegistry;
let trustedIssuersRegistryImplementation: TrustedIssuersRegistry;
let identityRegistryStorageImplementation: IdentityRegistryStorage;
let identityRegistryImplementation: IdentityRegistry;
let modularComplianceImplementation: ModularCompliance;
let tokenImplementation: Token;
let trexFactory: TREXFactory;
let trexImplementationAuthority: TREXImplementationAuthority;


//Identity
let identityImplementation: Identity;
let identityImplementationAuthority: ImplementationAuthority;
let identityFactory: IdFactory;


//Compliance Modules
let countryAllowCompliance: CountryAllowModule;
let supplyLimitCompliance: SupplyLimitModule;
let maxBalanceCompliance: MaxBalanceModule;
let holdTimeCompliance: HoldTimeModule;


//Fund Contract & EquityConfig Contract
let fund: Fund;
let fundFactory: FundFactory;
let implFund: ImplementationAuthority;
let fundProxy: FactoryProxy;
let equityConfig: EquityConfig;
let implEquityConfig: ImplementationAuthority;
let claimIssuerImplementation: ClaimIssuer;


//Wrapper Contarct
let wrapper: Wrapper;
let verc20: VERC20;


// Escrow contract 
let usdc: USDC;
let usdt: USDT;
// let escrow: Escrow;
// let proxy: EscrowProxy;
let escrow: EscrowController;
let proxy: EscrowControllerProxy;


beforeEach(" ", async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    tokenIssuer = signers[1];
    transferAgent = signers[2];
    user1 = signers[4];
    user2 = signers[5];
    user3 = signers[20];


    //  let trustSigner =  provider.getSigner(trust.address)

    claimTopicsRegistryImplementation = await new ClaimTopicsRegistry__factory(
        owner
    ).deploy();

    trustedIssuersRegistryImplementation =
        await new TrustedIssuersRegistry__factory(owner).deploy();

    identityRegistryStorageImplementation =
        await new IdentityRegistryStorage__factory(owner).deploy();

    identityRegistryImplementation = await new IdentityRegistry__factory(
        owner
    ).deploy();

    modularComplianceImplementation = await new ModularCompliance__factory(
        owner).deploy();

    tokenImplementation = await new Token__factory(owner).deploy();

    trexImplementationAuthority =
        await new TREXImplementationAuthority__factory(owner).deploy(
            true,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero
        );

    // ONCHAIN IDENTITY
    identityImplementation = await new Identity__factory(owner).deploy(
        owner.address,
        true
    );

    identityImplementationAuthority =
        await new ImplementationAuthority__factory(owner).deploy(
            identityImplementation.address
        );

    identityFactory = await new IdFactory__factory(owner).deploy(
        identityImplementationAuthority.address
    );

    const contractsStruct = {
        tokenImplementation: tokenImplementation.address,
        ctrImplementation: claimTopicsRegistryImplementation.address,
        irImplementation: identityRegistryImplementation.address,
        irsImplementation: identityRegistryStorageImplementation.address,
        tirImplementation: trustedIssuersRegistryImplementation.address,
        mcImplementation: modularComplianceImplementation.address,
    };

    const versionStruct = {
        major: 4,
        minor: 0,
        patch: 0,
    };

    await trexImplementationAuthority
        .connect(owner)
        .addAndUseTREXVersion(versionStruct, contractsStruct);
    await trustedIssuersRegistryImplementation.init();

    //Compliance Modules

    countryAllowCompliance = await new CountryAllowModule__factory(
        owner
    ).deploy();

    supplyLimitCompliance = await new SupplyLimitModule__factory(
        owner
    ).deploy();

    maxBalanceCompliance = await new MaxBalanceModule__factory(owner).deploy();

    holdTimeCompliance = await new HoldTimeModule__factory(owner).deploy();

    //Fund Contract
    fund = await new Fund__factory(owner).deploy();
    equityConfig = await new EquityConfig__factory(owner).deploy();
    implFund = await new ImplementationAuthority__factory(owner).deploy(
        fund.address
    );

    implEquityConfig = await new ImplementationAuthority__factory(owner).deploy(
        equityConfig.address
    );
    
    fundFactory = await new FundFactory__factory(owner).deploy();
    fundProxy = await new FactoryProxy__factory(owner).deploy();

    //Wrapper
    verc20 = await new VERC20__factory(owner).deploy();

    // changes actually there
    // wrapper = await new Wrapper__factory(owner).deploy(
    //     verc20.address
    // );

    // changes i made
    wrapper = await new Wrapper__factory(owner).deploy();
    await wrapper.init(verc20.address,fundFactory.address);

    await fundProxy.upgradeTo(fundFactory.address);
    await claimTopicsRegistryImplementation.init();

    trexFactory = await new TREXFactory__factory(owner).deploy(
        trexImplementationAuthority.address,
        identityFactory.address,
        wrapper.address
    );

    await identityRegistryImplementation.init(
        trustedIssuersRegistryImplementation.address,
        claimTopicsRegistryImplementation.address,
        identityRegistryStorageImplementation.address
    );

    await identityRegistryImplementation.addAgent(owner.address);
    await identityRegistryImplementation.addAgent(
        identityRegistryImplementation.address
    );

    await identityRegistryStorageImplementation.init();
    await identityRegistryStorageImplementation.addAgent(
        identityRegistryImplementation.address
    );

    usdc = await new USDC__factory(owner).deploy();
    usdt = await new USDT__factory(owner).deploy();
   
    // escrow = await new Escrow__factory(owner).deploy();
    // proxy = await new EscrowProxy__factory(owner).deploy();

    escrow=await new EscrowController__factory(owner).deploy();
    proxy = await new EscrowControllerProxy__factory(owner).deploy();
   
    await proxy.connect(owner).upgradeTo(escrow.address);
    // escrow = await new Escrow__factory(owner).attach(proxy.address);
    // await escrow.connect(owner).init([usdc.address, usdt.address], 10);

    escrow=await new EscrowController__factory(owner).attach(proxy.address);
    // await escrow.connect(owner).init([usdc.address, usdt.address],fundFactory.address);
});

it("testing for the just minting of the tokens", async () => {
    let tokenDetails={
        owner:owner.address,
        name : "My Test Token",
        symbol: "MTK",
        decimals: 18,
        irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
        ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
        wrap : false,
        irAgents: [user1.address],
        tokenAgents: [user1.address],  // Agents for token management
        transferAgents : [],  // Agents with transfer permissions
        complianceModules : [
        ],
        complianceSettings : [],  // Empty for now
    }

    let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims:[],
    };

    await identityFactory.addTokenFactory(trexFactory.address);

    // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    const tx=await trexFactory.connect(owner).deployTREXSuite(
        "test_salt",  // Unique salt to ensure CREATE2 uniqueness
        tokenDetails,
        claimDetails
    );

    // Wait for the transaction to be mined and capture the receipt
    const receipt = await tx.wait();

    // Now, look for the emitted event "TREXSuiteDeployed" in the receipt logs
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    let AddressOfToken;

    if (event) {
        let _token: any = event.args?._token;
        AddressOfToken=_token;

        let _ir: any = event.args?._ir;
        let _irs: any = event.args?._irs;
        let _tir: any = event.args?._tir;
        let _ctr: any = event.args?._ctr;
        let _mc: any = event.args?._mc;
        let _salt: any = event.args?._salt;
    
       
        
    }

    let token = event?.args;
    let tokenAttached;
    let firstAddress;

    if (Array.isArray(token) && token.length > 0) {
        firstAddress = token[0]; // Directly accessing the first element
        tokenAttached = await tokenImplementation.attach(firstAddress);
    }

    

    expect(await tokenAttached?.name()).to.equal("My Test Token");
    expect(await tokenAttached?.symbol()).to.equal("MTK");

    const ownerAddress = await identityRegistryImplementation.owner();
    

    // for granting the role of the agent
    await identityFactory.addAgent(user1.address);
    await identityFactory.addAgent(owner.address);
    
    // check if the user1.address is an agent or not
    const checkAgent=await identityFactory.isAgent(user1.address);
            expect(checkAgent).to.equal(true);

    const checkAgentOwner=await identityFactory.isAgent(owner.address);
            expect(checkAgentOwner).to.equal(true);

    // initialize the modular compliance
    await modularComplianceImplementation.connect(user1).init();
    const ownerAddressModularCompliance = await modularComplianceImplementation.owner();
    expect(ownerAddressModularCompliance).to.equal(user1.address);

    // Now, you can proceed with binding the token to the compliance contract
    const ModularComplianceBindToken=await modularComplianceImplementation.connect(user1).bindToken(AddressOfToken);

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);
    
    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();
    
    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await  identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
            expect(userIsVerified).to.be.true;

    const checkTokenAttachAgent=await identityFactory.isAgent(user1.address);
    expect(checkTokenAttachAgent).to.equal(true);

    // attach the token
    const modularComplianceAttachToken=await modularComplianceImplementation.attach(AddressOfToken);

    await tokenAttached?.connect(user1).mint(user1.address,100);
    const theBalanceUser1=await tokenAttached?.connect(user1).balanceOf(user1.address);
});


it("Deploy Fund Contract", async () => {
    let tokenDetails={
      owner:owner.address,
      name : "My Test Token",
      symbol: "MTK",
      decimals: 18,
      irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
      ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
      wrap : false,
      irAgents: [user1.address],
      tokenAgents: [user1.address],  // Agents for token management
      transferAgents : [],  // Agents with transfer permissions
      complianceModules : [
      ],
      complianceSettings : [],  // Empty for now
    }

    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims:[],
    };

    await identityFactory.addTokenFactory(trexFactory.address);

    // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    const tx=await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",  // Unique salt to ensure CREATE2 uniqueness
      tokenDetails,
      claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    let AddressOfToken;

    if (event) {
        let _token = event.args?._token;
        AddressOfToken = _token;
    }

    // Attach to the deployed token contract
    let token = event?.args;
    let tokenAttached;
    let firstAddress;
    if (Array.isArray(token) && token.length > 0) {
        firstAddress = token[0]; // Directly accessing the first element
        tokenAttached = await tokenImplementation.attach(firstAddress);
    }

    expect(await tokenAttached?.name()).to.equal("My Test Token");
    expect(await tokenAttached?.symbol()).to.equal("MTK");

    // Set up the fundProxy contract
    let fundProxyAttached = await fundFactory.attach(fundProxy.address);
    await fundProxyAttached.init(trexFactory.address);
    await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

    // Call createFund to deploy the fund
    const txn = await fundProxyAttached.createFund(
        AddressOfToken, 
        "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000", 
        10, 
        "Hello"
    );
});


it("Deploy Token", async () => {
    let tokenDetails={
      owner:owner.address,
      name : "My Test Token",
      symbol: "MTK",
      decimals: 18,
      irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
      ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
      wrap : false,
      irAgents: [user1.address],
      tokenAgents: [user1.address],  // Agents for token management
      transferAgents : [],  // Agents with transfer permissions
      complianceModules : [
      ],
      complianceSettings : [],  // Empty for now
    }

    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims:[],
    };

    await identityFactory.addTokenFactory(trexFactory.address);

    // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    const tx=await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",  // Unique salt to ensure CREATE2 uniqueness
      tokenDetails,
      claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    let AddressOfToken;

    if (event) {
        let _token = event.args?._token;
        AddressOfToken = _token;
    }

    // Attach to the deployed token contract
    let token = event?.args;
    let tokenAttached;
    let firstAddress;
    if (Array.isArray(token) && token.length > 0) {
        firstAddress = token[0]; // Directly accessing the first element
        tokenAttached = await tokenImplementation.attach(firstAddress);
    }

    expect(await tokenAttached?.name()).to.equal("My Test Token");
    expect(await tokenAttached?.symbol()).to.equal("MTK");
});




it("Error if it is not the agent caller", async () => {
    let tokenDetails={
      owner:owner.address,
      name : "My Test Token",
      symbol: "MTK",
      decimals: 18,
      irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
      ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
      wrap : false,
      irAgents: [user1.address],
      tokenAgents: [user1.address],  // Agents for token management
      transferAgents : [],  // Agents with transfer permissions
      complianceModules : [
        countryAllowCompliance.address,
        holdTimeCompliance.address,
        supplyLimitCompliance.address,
        maxBalanceCompliance.address

      ],
      complianceSettings : [],  // Empty for now
    }

    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims:[],
    };

    await identityFactory.addTokenFactory(trexFactory.address);

    // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    const tx=await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",  // Unique salt to ensure CREATE2 uniqueness
      tokenDetails,
      claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    let AddressOfToken;

    if (event) {
        let _token = event.args?._token;
        AddressOfToken = _token;
    }

    // Attach to the deployed token contract
    let token = event?.args;
    let tokenAttached;
    let firstAddress;
    if (Array.isArray(token) && token.length > 0) {
        firstAddress = token[0]; // Directly accessing the first element
        tokenAttached = await tokenImplementation.attach(firstAddress);
    }

    expect(await tokenAttached?.name()).to.equal("My Test Token");
    expect(await tokenAttached?.symbol()).to.equal("MTK");

    await expect(tokenAttached?.mint(owner.address,100)).to.be.revertedWith('AgentRole: caller does not have the Agent role');
});

});