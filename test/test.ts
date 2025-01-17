import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
const { BigNumber } = require('ethers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimTopicsRegistry, ClaimTopicsRegistry__factory, CountryAllowModule, CountryAllowModule__factory, EquityConfig, EquityConfig__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory } from "../typechain";

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

    await fundProxy.upgradeTo(fundFactory.address);

    trexFactory = await new TREXFactory__factory(owner).deploy(trexImplementationAuthority.address, identityFactory.address, wrapper.address);
  })
    

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

      const receiptFund = await txn.wait();

      // Listen for the "FundCreated" event
      const event1 = receiptFund.events?.find(event => event.event === "FundCreated");

      // Extract the fund contract address and mapping value from the event
      let fundContract = event1?.args; 
      let fundAddress;
      let fundAttached;

      if (Array.isArray(fundContract) && fundContract.length > 0) {
        fundAddress = fundContract[0];  // Directly accessing the first element
        fundAttached = await fund.attach(fundAddress);
      }

      // Assertions
      expect(fundAddress).to.not.be.null;  // Ensure fund address is not null
    });


    it("Deploy Fund Contract and reverted if some other user who is not owner call", async () => {
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

      await expect(
        fundProxyAttached.connect(user1).createFund(
            AddressOfToken, 
            "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000", 
            10, 
            "Hello"
        )
    ).to.be.revertedWith("Only Owner can create");
    });


    it("Factory", async () => {
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

      await identityFactory.createIdentity(user1.address, user1.address);
      await identityFactory.createIdentity(user2.address, user2.address);
      await identityFactory.createIdentity(user3.address, user3.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);
        
        let identityRegistryAddress = await tokenAttached?.identityRegistry();
        let identityRegisteryAttached = identityRegistryImplementation.attach(String(identityRegistryAddress));
        await identityRegisteryAttached.connect(user1).registerIdentity(user1.address, String(user1Identity), 91);

        await tokenAttached?.connect(user1).mint(user1.address, 100);
        let balance = await tokenAttached?.balanceOf(user1.address);

        await trexFactory.setImplementationAuthority(trexImplementationAuthority.address);
        await trexFactory.setIdFactory(identityFactory.address);

        // validation
        expect((await trexFactory.getIdFactory())).to.equal(identityFactory.address);
        expect((await trexFactory.getImplementationAuthority())).to.equal(trexImplementationAuthority.address);
    });


    // it("Share Dividend", async () => {
    //   let tokenDetails={
    //     owner:owner.address,
    //     name : "My Test Token",
    //     symbol: "MTK",
    //     decimals: 18,
    //     irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
    //     ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
    //     wrap : false,
    //     irAgents: [user1.address],
    //     tokenAgents: [user1.address],  // Agents for token management
    //     transferAgents : [],  // Agents with transfer permissions
    //     complianceModules : [
    //     ],
    //     complianceSettings : [],  // Empty for now
    //   }

    //   let claimDetails = {
    //       claimTopics: [],
    //       issuers: [],
    //       issuerClaims:[],
    //   };

    //   await identityFactory.addTokenFactory(trexFactory.address);

    //   // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    //   const tx=await trexFactory.connect(owner).deployTREXSuite(
    //       "test_salt",  // Unique salt to ensure CREATE2 uniqueness
    //       tokenDetails,
    //       claimDetails
    //   );

    //   // Wait for the transaction to be mined and capture the receipt
    //   const receipt = await tx.wait();

    //   // Now, look for the emitted event "TREXSuiteDeployed" in the receipt logs
    //   const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    //   let AddressOfToken;

    //   if (event) {
    //       let _token: any = event.args?._token;
    //       AddressOfToken=_token;

    //       let _ir: any = event.args?._ir;
    //       let _irs: any = event.args?._irs;
    //       let _tir: any = event.args?._tir;
    //       let _ctr: any = event.args?._ctr;
    //       let _mc: any = event.args?._mc;
    //       let _salt: any = event.args?._salt;
    //   }

    //   let token = event?.args;
    //   let tokenAttached;
    //   let firstAddress;

    //   if (Array.isArray(token) && token.length > 0) {
    //       firstAddress = token[0]; // Directly accessing the first element
    //       tokenAttached = await tokenImplementation.attach(firstAddress);
    //   }

    //   expect(await tokenAttached?.name()).to.equal("My Test Token");
    //   expect(await tokenAttached?.symbol()).to.equal("MTK");
      
    //   const ownerAddress = await identityRegistryImplementation.owner();
          
    //   // for granting the role of the agent
    //   await identityFactory.addAgent(user1.address);
    //   await identityFactory.addAgent(owner.address);
          
    //   // check if the user1.address is an agent or not
    //   const checkAgent=await identityFactory.isAgent(user1.address);
    //   expect(checkAgent).to.equal(true);

    //   const checkAgentOwner=await identityFactory.isAgent(owner.address);
    //   expect(checkAgentOwner).to.equal(true);

    //   // initialize the modular compliance
    //   await modularComplianceImplementation.connect(user1).init();
    //   const ownerAddressModularCompliance = await modularComplianceImplementation.owner();
    //   expect(ownerAddressModularCompliance).to.equal(user1.address);

    //   await identityFactory.createIdentity(user1.address, user1.address);
    //   await identityFactory.createIdentity(user2.address, user2.address);
    //   await identityFactory.createIdentity(user3.address, user3.address);

    //   let user1Identity = await identityFactory.getIdentity(user1.address);
    //   let user2Identity = await identityFactory.getIdentity(user2.address);
    //   let user3Identity = await identityFactory.getIdentity(user3.address);
        
    //   // Set up the fundProxy contract
    //   let fundProxyAttached = await fundFactory.attach(fundProxy.address);
    //   await fundProxyAttached.init(trexFactory.address);
    //   await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

    //   // Call createFund to deploy the fund
    //   const txn = await fundProxyAttached.createFund(
    //     AddressOfToken, 
    //     "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000", 
    //     10, 
    //     "Hello"
    //   );

    //   const receiptFund = await txn.wait();

    //   // Listen for the "FundCreated" event
    //   const event1 = receiptFund.events?.find(event => event.event === "FundCreated");

    //   // Extract the fund contract address and mapping value from the event
    //   let fundContract = event1?.args; 
    //   let fundAddress;
    //   let fundAttached;

    //   if (Array.isArray(fundContract) && fundContract.length > 0) {
    //     fundAddress = fundContract[0];  // Directly accessing the first element
    //     fundAttached = await fund.attach(fundAddress);
    //   }

    //     // await fundProxyAttached.connect(user1).batchWhitelist(firstAddress,[user1.address,user2.address,user3.address],[user1Identity,user2Identity,user3Identity],[91,91,91],["a","b","c"]);
    //     await usdc.connect(user1).approve(fundAddress,1000);
    //     await fundAttached?.connect(user1).shareDividend([user2.address,owner.address], [50,50], usdc.address);
    // });


    it("Deploy Equity Config Contract", async () => {
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

      await fundProxy.setMaintenance(true);
      await fundProxy.setMaintenance(false);

      let fundProxyAttached = await fundFactory.attach(fundProxy.address);
      await fundProxyAttached.init(trexFactory.address);

      await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

      const txn= await fundProxyAttached.createEquityConfig(firstAddress,"0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000537342e3938000000000000000000000000000000000000000000000000000000",12, "EquityConfig");
      const receiptFund = await tx.wait();
      const event1 = receiptFund.events?.find(event=>event.event==="EquityConfigCreated");

      let equityConfigContract = event1?.args; 

      let equityConfigAddress;
      let equityConfigAttached;

      if (Array.isArray(equityConfigContract) && equityConfigContract.length > 0) {
        equityConfigAddress = equityConfigContract[0];  // Directly accessing the first element
        equityConfigAttached = await equityConfig.attach(equityConfigAddress);
      }

      await equityConfigAttached?.connect(user1).setValuation(100,"1");
    });


    it("Deploy Equity Config Contract and reverted if it is not owner", async () => {
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

      await fundProxy.setMaintenance(true);
      await fundProxy.setMaintenance(false);

      let fundProxyAttached = await fundFactory.attach(fundProxy.address);
      await fundProxyAttached.init(trexFactory.address);

      await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

       // Attempt to call createEquityConfig from a non-owner account (user1)
    await expect(
      fundProxyAttached.connect(user1).createEquityConfig(
          AddressOfToken, 
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000537342e3938000000000000000000000000000000000000000000000000000000",
          12, 
          "EquityConfig"
      )
  ).to.be.revertedWith("Only Owner can create");
    });

    
    it("should set the masterFactory address by the owner", async () => {
      // New master factory address (mock address)
      const newMasterFactory =await ethers.Wallet.createRandom().address;
      await fundFactory.init(fundFactory.address);
  
      // Set the master factory address
      await fundFactory.connect(owner).setMasterFactory(newMasterFactory);
  
      // Verify the masterFactory address has been updated
      expect(await fundFactory.masterFactory()).to.equal(newMasterFactory);
    });


    it("should set the masterFactory address by the owner and reverted if it is not owner", async () => {
      // New master factory address (mock address)
      const newMasterFactory =await ethers.Wallet.createRandom().address;
      await fundFactory.init(fundFactory.address);
  
      const nonOwner = signers[1]; // Assume this is not the owner
    await expect(
      fundFactory.connect(nonOwner).setMasterFactory(newMasterFactory)
    ).to.be.revertedWith("Only Owner can set master Factory");
    });


    // it("should allow the owner to set the admin fee", async () => {
    //   let tokenDetails={
    //     owner:owner.address,
    //     name : "My Test Token",
    //     symbol: "MTK",
    //     decimals: 18,
    //     irs : ethers.constants.AddressZero, // Address of the Identity Registry Storage
    //     ONCHAINID : ethers.constants.AddressZero,  // Some default on-chain ID address
    //     wrap : false,
    //     irAgents: [user1.address],
    //     tokenAgents: [user1.address],  // Agents for token management
    //     transferAgents : [],  // Agents with transfer permissions
    //     complianceModules : [
    //     ],
    //     complianceSettings : [],  // Empty for now
    //   }

    //   let claimDetails = {
    //     claimTopics: [],
    //     issuers: [],
    //     issuerClaims:[],
    //   };

    //   await identityFactory.addTokenFactory(trexFactory.address);

    //   // Ensure that the `TREXFactory` contract is deployed by the correct owner and call deployTREXSuite
    //   const tx=await trexFactory.connect(owner).deployTREXSuite(
    //     "test_salt",  // Unique salt to ensure CREATE2 uniqueness
    //     tokenDetails,
    //     claimDetails
    //   );

    //   const receipt = await tx.wait();
    //   const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    //   let AddressOfToken;

    //   if (event) {
    //       let _token = event.args?._token;
    //       AddressOfToken = _token;
    //   }

    //   // Attach to the deployed token contract
    //   let token = event?.args;
    //   let tokenAttached;
    //   let firstAddress;
    //   if (Array.isArray(token) && token.length > 0) {
    //       firstAddress = token[0]; // Directly accessing the first element
    //       tokenAttached = await tokenImplementation.attach(firstAddress);
    //   }

    //   expect(await tokenAttached?.name()).to.equal("My Test Token");
    //   expect(await tokenAttached?.symbol()).to.equal("MTK");

    //   // Set admin fee with the owner
    //   await fundFactory.init(fundFactory.address);
    //   await fundFactory.connect(owner).setAdminFee(AddressOfToken, 123, "1");
    // });


    it("should allow the owner to set the admin fee and should reverted the transaction", async () => {
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

      // Set admin fee with the owner
      await fundFactory.init(fundFactory.address);
      const nonOwner = signers[1]; // Assuming this is not the owner
    await expect(
      fundFactory.connect(nonOwner).setAdminFee(AddressOfToken, 123, "1")
    ).to.be.revertedWith("Only Owner can set implementation");
    });
  

    it("should set the admin wallet by the owner and revert if not the owner or zero address", async () => {
      const newAdminWallet = await ethers.Wallet.createRandom().address;  // Mock wallet address
      const actionID = "1"; // Sample action ID
      
      // initialize the fund factory 
      await fundFactory.init(fundFactory.address);

      // 1. Owner sets the admin wallet
      await fundFactory.connect(owner).setAdminWallet(newAdminWallet, actionID);
      expect(await fundFactory.getAdminWallet()).to.equal(newAdminWallet);
    
      // 2. Non-owner tries to set the admin wallet - should revert
      const nonOwner = signers[1];  // Assuming this is not the owner
      await expect(
        fundFactory.connect(nonOwner).setAdminWallet(newAdminWallet, actionID)
      ).to.be.revertedWith("Only Owner can set implementation");
    
      // 3. Owner tries to set the admin wallet to zero address - should revert
      const zeroAddress = ethers.constants.AddressZero;
      await expect(
        fundFactory.connect(owner).setAdminWallet(zeroAddress, actionID)
      ).to.be.revertedWith("Zero Address");
    });
    

    it("should deploy a Trex suite", async function () {
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


    it("should revert if there are more than 5 irAgents or tokenAgents", async function () {
      let tokenDetails = {
        owner: owner.address,
        name: "My Test Token",
        symbol: "MTK",
        decimals: 18,
        irs: ethers.constants.AddressZero,
        ONCHAINID: ethers.constants.AddressZero,
        wrap: false,
        irAgents: [user1.address, user1.address, user1.address, user1.address, user1.address, user1.address], // 6 irAgents
        tokenAgents: [user1.address, user1.address, user1.address, user1.address, user1.address, user1.address], // 6 tokenAgents
        transferAgents: [],
        complianceModules: [],
        complianceSettings: [],
      };
  
      let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims: [],
      };
  
      await expect(
        trexFactory.connect(owner).deployTREXSuite("test_salt", tokenDetails, claimDetails)
      ).to.be.revertedWith("max 5 agents at deployment");
    });


    it("should revert if complianceModules length exceeds 30", async function () {
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
        complianceModules:[], // 31 modules (should fail)
        complianceSettings: [],
      };
  
      let claimDetails = {
        claimTopics: [],
        issuers: [],
        issuerClaims: [],
      };
  
      await expect(
        trexFactory.connect(owner).deployTREXSuite("test_salt", tokenDetails, claimDetails)
      ).to.be.revertedWith("only Factory or owner can call");
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
  });
