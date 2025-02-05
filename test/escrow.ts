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

describe("Escrow Contract Testing", function () { let signers: SignerWithAddress[]; let owner: SignerWithAddress; let tokenIssuer: SignerWithAddress; let transferAgent: SignerWithAddress; let user1: SignerWithAddress; let user2: SignerWithAddress; let user3: SignerWithAddress;

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
    await escrow.connect(owner).init([usdc.address, usdt.address],trexImplementationAuthority.address,fundFactory.address);
});


it("it should correctly set the stable coin",async function(){
    const stableCoinName = "USDC";
    await expect(stableCoinName).to.equal("USDC");
    const stableCoinAddress = ethers.Wallet.createRandom().address;

    // Call the function as the owner
    await expect(escrow.connect(owner).setStableCoin(stableCoinName, stableCoinAddress))
    .to.emit(escrow, "StableCoinUpdated") // Check for emitted event
    .withArgs(stableCoinName, stableCoinAddress);

    // Attempt to call the function with a zero address and expect a revert
    const zeroAddress = ethers.constants.AddressZero;
    await expect(escrow.connect(owner).setStableCoin(stableCoinName, zeroAddress))
    .to.be.revertedWith("Zero Address");

    expect(await escrow.getStableCoin("USDC")).to.equal(stableCoinAddress);
    expect(await escrow.getStableCoinName(stableCoinAddress)).to.equal("USDC");
});


it("should return the correct stablecoin address for usdc", async function () {
    const usdcAddress = await escrow.getStableCoin("usdc");
    expect(usdcAddress).to.equal(usdc.address);

});


it("should return the correct stablecoin address for usdt", async function () {
    const usdtAddress = await escrow.getStableCoin("usdt");
    expect(usdtAddress).to.equal(usdt.address);
});


it("should return the correct stablecoin name for USDC address", async function () {
    const coinName = await escrow.getStableCoinName(usdc.address);
    expect(coinName).to.equal("usdc");
});


it("should return the correct stablecoin name for USDT address", async function () {
    const coinName = await escrow.getStableCoinName(usdt.address);
    expect(coinName).to.equal("usdt");
});



it("it sets the call update identity and reverted if it is not Not an Identity Registry Agent",async function(){
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

    await expect(escrow.callUpdateIdentity(
        user1.address,
        identityRegistryImplementation.address,
        AddressOfToken,
        "1"
    )).to.be.revertedWith("Not an Identity Registry Agent");
});

it("testing for  failed transaction of rescueAnyERC20Tokens in Escrow", async () => {
    await usdc.mint(owner.address,5);
    await usdt.mint(owner.address,5);

    await expect(escrow.connect(owner).rescueAnyERC20Tokens(usdc.address, user2.address, 10)).to.be.revertedWith("TransferHelper::safeTransfer: transfer failed");
});


it("testing for rescueAnyERC20Tokens in Escrow and reverted if it has Insufficient Balance", async () => {
    await usdc.mint(owner.address,5);
    await usdt.mint(owner.address,5);

    await expect(escrow.connect(user1).rescueAnyERC20Tokens(usdt.address, user2.address, 10)).to.be.rejectedWith('Ownable: caller is not the owner');
});


it("create the order with the order-Id and i will deposit some amount in it",async function(){
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));
});


it("testing for (Zero Address not allowed) in deposit function", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // Now we will check in the case of the zero address
    await expect(escrow.connect(user1).deposit('0x0000000000000000000000000000000000000000',100, 10, "1", "tokenAttached")).to.be.rejectedWith('Zero Address not allowed');
});


it("testing for (Amount should be greater than 0) in deposit function", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    await expect(escrow.connect(user1).deposit(AddressOfToken,0, 10, "1", "tokenAttached")).to.be.rejectedWith('Amount should be greater than 0')
});


it("testing for (Investor not whitelisted) in deposit function", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(owner).isVerified(owner.address);
    expect(userIsVerified).to.be.false;

    await expect(escrow.connect(user1).deposit(AddressOfToken,0, 10, "1", "tokenAttached")).to.be.rejectedWith('Investor not whitelisted');
});


it("testing for (Order Already Created) in deposit function", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(owner).isVerified(owner.address);
    expect(userIsVerified).to.be.false;

    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached")).to.be.rejectedWith('Order Already Created');
});


it("testing for the rejection order, if there is invalid order id", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));
    await expect(escrow.connect(user1).rejectOrder("5")).to.be.reverted;
});


it("testing for the batch freeze of the partial tokens", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    const userAddresses=[user1.address,user2.address];
    const amounts=[0,0];
    const orderIdConc=["1","1"];

    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    )

    await tokenImplementation.connect(user1).addTA(escrow.address);
    await tokenAttached?.addTA(escrow.address);
    await tokenImplementation.connect(user1).addTA(user1.address);
    
    await tokenImplementation.connect(user1).addAgent(escrow.address);
    await tokenAttached?.addAgent(escrow.address);
    
    await escrow.connect(user1).batchFreezePartialTokens(AddressOfToken,userAddresses,amounts,orderIdConc);
});


it("testing for the batch freeze of the partial tokens and shows error if it is invalid agent", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    const userAddresses=[user1.address,user2.address];
    const amounts=[0,0];
    const orderIdConc=["1","1"];

    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    )

    await tokenImplementation.connect(user1).addTA(escrow.address);
    await tokenImplementation.connect(user1).addTA(user1.address);
    

    await tokenImplementation.connect(user1).addAgent(escrow.address);
    const myTotalBalance=await tokenAttached?.balanceOf(user1.address);
    
    await expect(
        escrow.connect(user1).batchFreezePartialTokens(AddressOfToken, userAddresses, amounts, orderIdConc)
    ).to.be.revertedWith('AgentRole or TARole: caller does not have the Agent role or TARole');
});


it("testing for the batch unfreeze of the partial tokens", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    const userAddresses=[user1.address,user2.address];
    const amounts=[0,0];
    const orderIdConc=["1","1"];

    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    )

    await tokenImplementation.connect(user1).addTA(escrow.address);
    await tokenAttached?.addTA(escrow.address);
    await tokenImplementation.connect(user1).addTA(user1.address);

    await tokenImplementation.connect(user1).addAgent(escrow.address);
    await tokenAttached?.addAgent(escrow.address);

    const myTotalBalance=await tokenAttached?.balanceOf(user1.address);

    await escrow.connect(user1).batchFreezePartialTokens(AddressOfToken,userAddresses,amounts,orderIdConc);
    await escrow.connect(user1).batchUnFreezePartialTokens(AddressOfToken,userAddresses,amounts,orderIdConc);
});


it("testing for the batch unfreeze of the partial tokens and it shows error if there is invalid caller", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    // initialize token
    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero
    );
                    
    // to check agent
    await tokenImplementation.connect(user1).addAgent(user1.address);

    const userAddresses=[user1.address,user2.address];
    const amounts=[0,0];
    const orderIdConc=["1","1"];

    await tokenImplementation.connect(user1).addTA(escrow.address);
    
    // await tokenAttached?.addTA(escrow.address);
    await tokenImplementation.connect(user1).addTA(user1.address);
    

    // await tokenAttached?.addAgent(user1.address);
    await tokenImplementation.connect(user1).addAgent(escrow.address);
    

    // await tokenAttached?.addAgent(escrow.address);
    const myTotalBalance=await tokenAttached?.balanceOf(user1.address);
    

    await expect(
        escrow.connect(user1).batchFreezePartialTokens(AddressOfToken, userAddresses, amounts, orderIdConc)
    ).to.be.revertedWith('AgentRole or TARole: caller does not have the Agent role or TARole');
}); 


it("testing for the batch set address frozen of the tokens", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    const userAddresses=[user1.address,user2.address];
    const isFreeze=[false, true];
    const orderIdConc=["1","2"];

    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    )

    await tokenImplementation.connect(user1).addTA(escrow.address);
    await tokenAttached?.addTA(escrow.address);
    await tokenImplementation.connect(user1).addTA(user1.address);

    // await tokenAttached?.addAgent(user1.address);

    await tokenImplementation.connect(user1).addAgent(escrow.address);
    await tokenAttached?.addAgent(escrow.address);
    
    // const myTotalBalance=await tokenAttached?.balanceOf(user1.address);
    await escrow.connect(user1).batchSetAddressFrozen(AddressOfToken,userAddresses,isFreeze,orderIdConc);
});


it("testing for the batch set address frozen of the tokens and it throws error if it is has invalid agent or caller", async () => {
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
            supplyLimitCompliance.address,
            maxBalanceCompliance.address,
            holdTimeCompliance.address,
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

    // Create identity for user1
    const user1Identity = await identityFactory.connect(user1).createIdentity(user1.address,"test_salt");

    // Ensure user1 has a valid identity
    const user1IdentityGet = await identityFactory.getIdentity(user1.address);

    // Verify if the identity registry is properly linked to the token
    const identityRegistryAddress = await tokenAttached?.identityRegistry();

    const identityRegistryAttached = identityRegistryImplementation.attach(
        String(identityRegistryAddress)
    );

    await identityRegistryAttached
    .connect(user1)
    .registerIdentity(user1.address, user1IdentityGet, 123);

    const isRegistered = await identityRegistryAttached.contains(user1.address);
    expect(isRegistered).to.equal(true);

    const userIsVerified = await identityRegistryAttached.connect(user1).isVerified(user1.address);
    expect(userIsVerified).to.be.true;

    // make the deposit function
    await expect(escrow.connect(user1).deposit(AddressOfToken,100, 10, "1", "tokenAttached"));

    const userAddresses=[user1.address,user2.address];
    const isFreeze=[false, true];
    const orderIdConc=["1","2"];
    const myTotalBalance=await tokenAttached?.balanceOf(user1.address);
    
    
    await expect(
        escrow.connect(user1).batchSetAddressFrozen(AddressOfToken,userAddresses,isFreeze,orderIdConc)
    ).to.be.revertedWith('AgentRole: caller does not have the Agent role');
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


it("it sets the call update country and reverted if it is not Not an Identity Registry Agent",async function(){
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

    await expect(escrow.callUpdateCountry(
        user1.address,
        91,
        AddressOfToken,
        "1"
    )).to.be.revertedWith("Not an Identity Registry Agent");
});


it("Implementing the functionality of batch minting of the token", async()=>{
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

            
    const userLists=[user1.address,user1.address,user1.address];
    const eachAmounts=[100,200,300];
    const orderIds=["1","1","1"];

    // initialize the token implementation
    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    );

    await tokenImplementation.connect(user1).addTA(escrow.address);
    
    await tokenAttached?.addTA(escrow.address);
    
    await tokenImplementation.connect(user1).addTA(user1.address)
    
    await tokenImplementation.connect(user1).addAgent(escrow.address)
    

    await tokenAttached?.addAgent(escrow.address);
    

    await escrow.connect(user1).batchMintTokens(
        AddressOfToken,
        userLists,
        eachAmounts,
        orderIds
    )
});


it("Implementing the functionality of batch minting of the token and if the author is not verified", async()=>{
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

            
    const userLists=[owner.address,user1.address,user1.address];
    const eachAmounts=[100,200,300];
    const orderIds=["1","1","1"];

    // initialize the token implementation
    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    );

    await tokenImplementation.connect(user1).addTA(escrow.address);
    
    await tokenAttached?.addTA(escrow.address);
    
    await tokenImplementation.connect(user1).addTA(user1.address)
    
    await tokenImplementation.connect(user1).addAgent(escrow.address)
    

    await tokenAttached?.addAgent(escrow.address);
    

    await expect(
        escrow.connect(user1).batchMintTokens(
            AddressOfToken,
            userLists,
            eachAmounts,
            orderIds
        )
    ).to.be.revertedWith('Identity is not verified.');
});


it("Implementing the functionality of batch burning of the token", async()=>{
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

            
    const userLists=[user1.address,user1.address,user1.address];
    const eachAmounts=[100,200,300];
    const orderIds=["1","1","1"];

    // initialize the token implementation
    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    );

    await tokenImplementation.connect(user1).addTA(escrow.address);
    
    await tokenAttached?.addTA(escrow.address);
    
    await tokenImplementation.connect(user1).addTA(user1.address)

    await tokenImplementation.connect(user1).addAgent(escrow.address)
    

    await tokenAttached?.addAgent(escrow.address);
    

    await escrow.connect(user1).batchMintTokens(
        AddressOfToken,
        userLists,
        eachAmounts,
        orderIds
    )

    await escrow.connect(user1).batchBurnTokens(
        AddressOfToken,
        userLists,
        eachAmounts,
        orderIds
    );

});


it("Implementing the functionality of batch burning of the token and throws error if cannot burn more than tokens", async()=>{
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

            
    const userLists=[user1.address,user1.address,user1.address];
    const eachAmounts=[100,200,300];
    const orderIds=["1","1","1"];

    // initialize the token implementation
    await tokenImplementation.connect(user1).init(
        identityRegistryImplementation.address,
        modularComplianceImplementation.address,
        "My Test Token",
        "MTK",
        18,
        ethers.constants.AddressZero,
    );

    await tokenImplementation.connect(user1).addTA(escrow.address);
    
    await tokenAttached?.addTA(escrow.address);
    
    await tokenImplementation.connect(user1).addTA(user1.address)
    
    await tokenImplementation.connect(user1).addAgent(escrow.address)
    await tokenAttached?.addAgent(escrow.address);
    

    await(
        escrow.connect(user1).batchMintTokens(
            AddressOfToken,
            userLists,
            eachAmounts,
            orderIds
        )
    )


    const eachAmounts2=[200,500,400];
    await expect(
        escrow.connect(user1).batchBurnTokens(
            AddressOfToken,
            userLists,
            eachAmounts2,
            orderIds
        )
    ).to.be.revertedWith('cannot burn more than balance');

});


it("it set the master factory",async function(){
    const myAddress= ethers.constants.AddressZero;
    await expect(escrow.setMasterFactory(myAddress)).to.be.revertedWith("Invalid Zero Address");
});


it("it set the master factory",async function(){
    const myAddress= user1.address;
    await escrow.setMasterFactory(myAddress);
});


it("it sets the call delete identity and reverted if it is not Not an Identity Registry Agent",async function(){
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

    await expect(escrow.callDeleteIdentity(
        user1.address,
        AddressOfToken,
        "1"
    )).to.be.revertedWith("Not an Identity Registry Agent");
});


it("it sets the batch register identity and reverted if it is not Not an Identity Registry Agent",async function(){
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

    await expect(escrow.batchRegisterIdentity(
        [owner.address,user1.address],
        [ethers.constants.AddressZero,ethers.constants.AddressZero],
        [32,42],
        ["1","1"],
        AddressOfToken,
    )).to.be.revertedWith("Not an Identity Registry Agent");
});

});