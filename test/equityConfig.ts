import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
const { BigNumber } = require('ethers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimTopicsRegistry, ClaimTopicsRegistry__factory, CountryAllowModule, CountryAllowModule__factory, EquityConfig, EquityConfig__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, FundFactoryStorage, FundFactoryStorage__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory } from "../typechain";

describe(" Tokenization Testing ", function () {
    let signer: SignerWithAddress;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let tokenIssuer: SignerWithAddress;
    let transferAgent: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    // const trustSigningKey = ethers.Wallet.createRandom();
  
    //Implementation
    let claimTopicsRegistryImplementation: ClaimTopicsRegistry;
    let trustedIssuersRegistryImplementation: TrustedIssuersRegistry;
    let identityRegistryStorageImplementation: IdentityRegistryStorage;
    let identityRegistryImplementation: IdentityRegistry;
    let modularComplianceImplementation: ModularCompliance;
    let tokenImplementation: Token;
    let trexFactory: TREXFactory;
    let trexImplementationAuthority: TREXImplementationAuthority;
    let fundFactoryStorage: FundFactoryStorage
    
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

    //Wrapper Contarct
    let wrapper: Wrapper;
    let verc20 : VERC20;

    //stable Coins
    let usdc: USDC;
  
    beforeEach(" ", async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      tokenIssuer = signers[1];
      transferAgent = signers[2];
      user1 = signers[4];
      user2 = signers[5];
      user3 = signers[6];
    
      //  let trustSigner =  provider.getSigner(trust.address)
  
      claimTopicsRegistryImplementation = await new ClaimTopicsRegistry__factory(owner).deploy();
  
      trustedIssuersRegistryImplementation = await new TrustedIssuersRegistry__factory(owner).deploy();

      identityRegistryStorageImplementation = await new IdentityRegistryStorage__factory(owner).deploy();

      identityRegistryImplementation = await new IdentityRegistry__factory(owner).deploy();

      modularComplianceImplementation = await new ModularCompliance__factory(owner).deploy();

      tokenImplementation = await new Token__factory(owner).deploy();
  
      trexImplementationAuthority =
        await new TREXImplementationAuthority__factory(owner).deploy(true, ethers.constants.AddressZero, ethers.constants.AddressZero);
  
      // ONCHAIN IDENTITY
      identityImplementation = await new Identity__factory(owner).deploy(owner.address,true);
  
      identityImplementationAuthority =
        await new ImplementationAuthority__factory(owner).deploy(identityImplementation.address);

      identityFactory = await new IdFactory__factory(owner).deploy(identityImplementationAuthority.address);
  
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
  
      await trexImplementationAuthority.connect(owner).addAndUseTREXVersion(versionStruct, contractsStruct);
      // Compliance Modules

    countryAllowCompliance = await new CountryAllowModule__factory(owner).deploy();
      
    supplyLimitCompliance = await new SupplyLimitModule__factory(owner).deploy();

    maxBalanceCompliance = await new MaxBalanceModule__factory(owner).deploy();

    holdTimeCompliance = await new HoldTimeModule__factory(owner).deploy();

    //Fund Contract

    fund = await new Fund__factory(owner).deploy();
    equityConfig = await new EquityConfig__factory(owner).deploy();
    implFund = await new ImplementationAuthority__factory(owner).deploy(fund.address);
    implEquityConfig = await new ImplementationAuthority__factory(owner).deploy(equityConfig.address);
    fundFactory = await new FundFactory__factory(owner).deploy();
    fundProxy = await new FactoryProxy__factory(owner).deploy();
    fundFactoryStorage = await new FundFactoryStorage__factory(owner).deploy();
    //Wrapper
    // verc20 = await new VERC20__factory(owner).deploy();
    // wrapper = await new Wrapper__factory(owner).deploy(verc20.address);

    //Wrapper 
    // correct version of the Wrapper code
    verc20 = await new VERC20__factory(owner).deploy();
    wrapper = await new Wrapper__factory(owner).deploy();
    // await wrapper.init(verc20);

    //Stable Coin
    usdc = await new USDC__factory(owner).deploy();

    await usdc.mint(user1.address,1000000);

  

    trexFactory = await new TREXFactory__factory(owner).deploy(trexImplementationAuthority.address, identityFactory.address, wrapper.address);

      // Make sure FundFactory is properly initialized
      await fundFactory.init(trexFactory.address);
      await fundFactory.attach(fundFactoryStorage.address);
          await fundProxy.upgradeTo(fundFactory.address);
      // Set up ownership in TREXFactory
      await trexFactory.transferOwnership(owner.address);
  })


  it("should track previous valuations correctly", async function () {
    let tokenDetails = {
        owner: owner.address,
        name: "My Test Token",
        symbol: "MTK",
        decimals: 18,
        irs: ethers.constants.AddressZero,
        ONCHAINID: ethers.constants.AddressZero,
        wrap: false,
        irAgents: [user1.address],
        tokenAgents: [user1.address],
        transferAgents: [],
        complianceModules: [],
        complianceSettings: [],
    };

    let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims: [],
    };

    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
        "test_salt",
        tokenDetails,
        claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const AddressOfToken = event?.args?._token;
    let tokenAttached = await tokenImplementation.attach(AddressOfToken);

    // Initialize
    await equityConfig.init(AddressOfToken,
        '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await tokenAttached.addAgent(owner.address);

    const initialValuation = await equityConfig.getCurrentValuation();
    
    // Update valuation multiple times
    await equityConfig.setValuation(ethers.utils.parseEther("150000"), "UPDATE_1");
    expect(await equityConfig.getPreviousValutaion()).to.equal(initialValuation);
    
    await equityConfig.setValuation(ethers.utils.parseEther("200000"), "UPDATE_2");
    expect(await equityConfig.getPreviousValutaion()).to.equal(ethers.utils.parseEther("150000"));
    
    await equityConfig.setValuation(ethers.utils.parseEther("250000"), "UPDATE_3");
    expect(await equityConfig.getPreviousValutaion()).to.equal(ethers.utils.parseEther("200000"));
});



  it("should emit events when updating configuration values", async function () {
    let tokenDetails = {
        owner: owner.address,
        name: "My Test Token",
        symbol: "MTK",
        decimals: 18,
        irs: ethers.constants.AddressZero,
        ONCHAINID: ethers.constants.AddressZero,
        wrap: false,
        irAgents: [user1.address],
        tokenAgents: [user1.address],
        transferAgents: [],
        complianceModules: [],
        complianceSettings: [],
    };

    let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims: [],
    };

    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
        "test_salt",
        tokenDetails,
        claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const AddressOfToken = event?.args?._token;
    let tokenAttached = await tokenImplementation.attach(AddressOfToken);

    // Initialize
    await equityConfig.init(AddressOfToken,
        '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await tokenAttached.addAgent(owner.address);

    // Test events for each update function
    await expect(equityConfig.setValuation(ethers.utils.parseEther("150000"), "UPDATE_1"))
        .to.emit(equityConfig, "ValuationUpdated")
        .withArgs(ethers.utils.parseEther("150000"), "UPDATE_1");

    await expect(equityConfig.setMinInvestment(ethers.utils.parseEther("2000"), "UPDATE_2"))
        .to.emit(equityConfig, "MinimumInvestmentUpdated")
        .withArgs(ethers.utils.parseEther("2000"), "UPDATE_2");

    await expect(equityConfig.setMaxInvesrment(ethers.utils.parseEther("20000"), "UPDATE_3"))
        .to.emit(equityConfig, "MaximumInvestmentUpdated")
        .withArgs(ethers.utils.parseEther("20000"), "UPDATE_3");

    await expect(equityConfig.setProjectedYeild(ethers.utils.parseEther("10"), "UPDATE_4"))
        .to.emit(equityConfig, "ProjectedYieldUpdated")
        .withArgs(ethers.utils.parseEther("10"), "UPDATE_4");

    await expect(equityConfig.setDERatio("1:4", "UPDATE_5"))
        .to.emit(equityConfig, "DERatioUpdated")
        .withArgs("1:4", "UPDATE_5");
});



  it("should properly get initial values after initialization", async function () {
    let tokenDetails = {
        owner: owner.address,
        name: "My Test Token",
        symbol: "MTK",
        decimals: 18,
        irs: ethers.constants.AddressZero,
        ONCHAINID: ethers.constants.AddressZero,
        wrap: false,
        irAgents: [user1.address],
        tokenAgents: [user1.address],
        transferAgents: [],
        complianceModules: [],
        complianceSettings: [],
    };

    let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims: [],
    };

    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
        "test_salt",
        tokenDetails,
        claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const AddressOfToken = event?.args?._token;

    // Initialize EquityConfig
    const initData = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256", "uint256", "string"],
        [
            ethers.utils.parseEther("1000"), // minInvestment
            ethers.utils.parseEther("10000"), // maxInvestment
            ethers.utils.parseEther("100000"), // launchValuation
            ethers.utils.parseEther("8"), // projectedYield
            "1:3" // DERatio
        ]
    );

    await equityConfig.init(AddressOfToken, initData);

    // Test getter functions
    expect(await equityConfig.getToken()).to.equal(AddressOfToken);
    expect(await equityConfig.getLaunchValuation()).to.equal(ethers.utils.parseEther("100000"));
    expect(await equityConfig.getCurrentValuation()).to.equal(ethers.utils.parseEther("100000"));
    expect(await equityConfig.getMinInvestment()).to.equal(ethers.utils.parseEther("1000"));
    expect(await equityConfig.getMaxInvestment()).to.equal(ethers.utils.parseEther("10000"));
    expect(await equityConfig.getProjectedYield()).to.equal(ethers.utils.parseEther("8"));
    expect(await equityConfig.getDERatio()).to.equal("1:3");
    expect(await equityConfig.getPreviousValutaion()).to.equal(0);
});




  it("set valuation in the equity config file", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await tokenAttached?.addAgent(owner.address);
    await equityConfig.setValuation(23,"123");
  });


  it("set valuation in the equity config file and rever if it is not owner", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await expect(equityConfig.setValuation(23, "123")).to.be.revertedWith("Only Token Agent can call");
  });

it("set Min Investment in the equity config file", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await tokenAttached?.addAgent(owner.address);
    await equityConfig.setMinInvestment(23,"123");
  });


  it("set Min Investment in the equity config file and rever if it is not owner", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);
    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await expect(equityConfig.setMinInvestment(23, "123")).to.be.revertedWith("Only Token Agent can call");
  });


  it("set Max Investment in the equity config file", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await tokenAttached?.addAgent(owner.address);
    await equityConfig.setMaxInvesrment(23,"123");
  });


  it("set Max Investment in the equity config file and rever if it is not owner", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);
    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await expect(equityConfig.setMaxInvesrment(23, "123")).to.be.revertedWith("Only Token Agent can call");
  });


  it("set Projected Yeild in the equity config file", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await tokenAttached?.addAgent(owner.address);
    await equityConfig.setProjectedYeild(23,"123");
  });


  it("set Projected Yeild in the equity config file and rever if it is not owner", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);
    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await expect(equityConfig.setProjectedYeild(23, "123")).to.be.revertedWith("Only Token Agent can call");
  });


  it("set DE Ratio in the equity config file", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await tokenAttached?.addAgent(owner.address);
    await equityConfig.setDERatio("23","123");
  });


  it("set DE Ratio in the equity config file and rever if it is not owner", async function () {
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

    // Call the init function and capture the event logs
    const initTx = await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );

    await identityFactory.addAgent(owner.address);
    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "My Test Token",
      "MTK",
      18,
      ethers.constants.AddressZero,
    )

    await expect(equityConfig.setDERatio("23", "123")).to.be.revertedWith("Only Token Agent can call");
  });

  it("should set and get off-chain price correctly", async function () {
    let tokenDetails = {
      owner: owner.address,
      name: "My Test Token",
      symbol: "MTK",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: false,
      irAgents: [user1.address],
      tokenAgents: [user1.address],
      transferAgents: [],
      complianceModules: [],
      complianceSettings: [],
    };
  
    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims: [],
    };
  
    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const AddressOfToken = event?.args?._token;
  
    let tokenAttached = await tokenImplementation.attach(AddressOfToken);
  
    await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );
  
    await tokenAttached.addAgent(owner.address);
    
    // Test setting and getting off-chain price
    const newPrice = ethers.utils.parseEther("100");
    await equityConfig.setAssetPriceOffChain(newPrice);
    expect(await equityConfig.getOffChainPrice()).to.equal(newPrice);
  });
  
  it("should set and get off-chain price status correctly", async function () {
    let tokenDetails = {
      owner: owner.address,
      name: "My Test Token",
      symbol: "MTK",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: false,
      irAgents: [user1.address],
      tokenAgents: [user1.address],
      transferAgents: [],
      complianceModules: [],
      complianceSettings: [],
    };
  
    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims: [],
    };
  
    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const AddressOfToken = event?.args?._token;
  
    let tokenAttached = await tokenImplementation.attach(AddressOfToken);
  
    await equityConfig.init(AddressOfToken,
      '0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000033132330000000000000000000000000000000000000000000000000000000000'
    );
  
    await tokenAttached.addAgent(owner.address);
    
    // Test setting and getting off-chain price status
    await equityConfig.setOffChainPrice(true);
    expect(await equityConfig.getOffChainPriceStatus()).to.be.true;
    
    await equityConfig.setOffChainPrice(false);
    expect(await equityConfig.getOffChainPriceStatus()).to.be.false;
  });



  
describe("Token Configuration Tests", function() {
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  
  beforeEach(async function() {
    [owner, user1, user2] = await ethers.getSigners();
  });

  it("should properly deploy token and distribute dividends", async function() {
    // Deploy core contracts
    const tokenImpl = await new Token__factory(owner).deploy();
    const identityImpl = await new Identity__factory(owner).deploy(owner.address, true);
    const identityAuth = await new ImplementationAuthority__factory(owner).deploy(identityImpl.address);
    const identityFactory = await new IdFactory__factory(owner).deploy(identityAuth.address);
    
    // Deploy and setup TREX implementation
    const trexAuth = await new TREXImplementationAuthority__factory(owner).deploy(
      true,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero
    );

    // Setup contract implementations
    const contractsStruct = {
      tokenImplementation: tokenImpl.address,
      ctrImplementation: (await new ClaimTopicsRegistry__factory(owner).deploy()).address,
      irImplementation: (await new IdentityRegistry__factory(owner).deploy()).address,
      irsImplementation: (await new IdentityRegistryStorage__factory(owner).deploy()).address,
      tirImplementation: (await new TrustedIssuersRegistry__factory(owner).deploy()).address,
      mcImplementation: (await new ModularCompliance__factory(owner).deploy()).address
    };

    await trexAuth.addAndUseTREXVersion(
      { major: 4, minor: 0, patch: 0 },
      contractsStruct
    );

    // Deploy wrapper contracts
    const verc20 = await new VERC20__factory(owner).deploy();
    const wrapper = await new Wrapper__factory(owner).deploy();

    // Deploy fund factory system
    const fundFactoryStorage = await new FundFactoryStorage__factory(owner).deploy();
    const fundFactory = await new FundFactory__factory(owner).deploy();
    const fundProxy = await new FactoryProxy__factory(owner).deploy();

    // Deploy TREX factory
    const trexFactory = await new TREXFactory__factory(owner).deploy(
      trexAuth.address,
      identityFactory.address,
      wrapper.address
    );

    // Set up proxy and factory
    await fundProxy.upgradeTo(fundFactory.address);
    const fundFactoryAttached = await fundFactory.attach(fundProxy.address);
    await fundFactoryAttached.init(trexFactory.address);

    // Deploy implementations for fund and equity config
    const fundImpl = await new Fund__factory(owner).deploy();
    const equityConfigImpl = await new EquityConfig__factory(owner).deploy();
    
    const implFund = await new ImplementationAuthority__factory(owner).deploy(fundImpl.address);
    const implEquityConfig = await new ImplementationAuthority__factory(owner).deploy(equityConfigImpl.address);
    
    await fundFactoryAttached.setImpl(implFund.address, implEquityConfig.address);

    // Deploy test token with enhanced configuration
    const tokenDetails = {
      owner: owner.address,
      name: "Enhanced Test Token",
      symbol: "ETT",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: false,
      irAgents: [owner.address, user1.address], 
      tokenAgents: [owner.address, user1.address], 
      transferAgents: [user2.address], 
      complianceModules: [],
      complianceSettings: []
    };

    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims: [],
    };
  
    await identityFactory.addTokenFactory(trexFactory.address);
    const tx = await trexFactory.connect(owner).deployTREXSuite(
      "test_salt",
      tokenDetails,
      claimDetails
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === "TREXSuiteDeployed");
    const tokenAddress = event?.args?._token;

    // Set up fees with different rates for different operations
    await fundFactoryAttached.setFee(
      tokenAddress,
      800,  
      1000, 
      1200, 
      500,  // 5% redemption fee
      "CUSTOM_FEE_STRUCTURE"
    );

    // Initialize equity config with detailed parameters
    const initData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256", "uint256", "string"],
      [
        ethers.utils.parseEther("500"),    
        ethers.utils.parseEther("50000"),  
        ethers.utils.parseEther("100000"), 
        ethers.utils.parseEther("7"),      
        "1:2"                             
      ]
    );

    await fundFactoryAttached.createEquityConfig(
      tokenAddress,
      initData,
      ethers.utils.parseEther("10000000"),
      "ENHANCED_CONFIG"
    );

    const equityConfigAddress = await fundFactoryAttached.getFund(tokenAddress);
    const equityConfig = await new EquityConfig__factory(owner).attach(equityConfigAddress);

    // Deploy and mint USDC (6 decimals)
    const usdc = await new USDC__factory(owner).deploy();
    await usdc.mint(owner.address, ethers.utils.parseUnits("1000000", 6)); 

    // Approve USDC for dividend
    const dividendAmount = ethers.utils.parseUnits("10000", 6); 
    await usdc.approve(equityConfigAddress, dividendAmount);

    // Check admin balance before distribution
    const adminWallet = await fundFactoryAttached.getAdminWallet();
    const adminBalanceBefore = await usdc.balanceOf(adminWallet);

    // Distribute dividend
    const dividendTx = await equityConfig.shareDividend(
      user2.address,
      dividendAmount,
      "premium_user_123",
      "major_dividend_001",
      usdc.address,
      owner.address
    );

    // Check balances after distribution
    const user2Balance = await usdc.balanceOf(user2.address);
    const adminBalanceAfter = await usdc.balanceOf(adminWallet);

    // Calculate the positive change in admin balance as the admin fee
    const actualAdminFee = adminBalanceAfter.sub(adminBalanceBefore);
    
    // Expected fee calculation
    const feePercentage = 1200;
    const expectedAdminFee = dividendAmount.mul(feePercentage).div(10000); 
    const expectedNetAmount = dividendAmount.sub(expectedAdminFee); 

    // Assertions
    expect(user2Balance).to.equal(expectedNetAmount);  
  });
});

});

