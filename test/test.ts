import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
const { BigNumber } = require('ethers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimTopicsRegistry, ClaimTopicsRegistry__factory, CountryAllowModule, CountryAllowModule__factory, EquityConfig, EquityConfig__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, FundFactoryStorage, FundFactoryStorage__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory } from "../typechain";

describe(" Test contract Testing ", function () {
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
    ).to.be.revertedWith("Only Owner can call");
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
  ).to.be.revertedWith("Only Owner can call");
    });

    
    it("should set the masterFactory address by the owner", async () => {
       const newMasterFactory = await ethers.Wallet.createRandom().address;
        
        // Since fundFactory is already initialized with trexFactory in beforeEach,
        // we can directly call setMasterFactory
        await fundFactory.connect(owner).setMasterFactory(newMasterFactory);
        
        // Verify the masterFactory address has been updated
        expect(await fundFactory.getMasterFactory()).to.equal(newMasterFactory);
    });


    it("should set the masterFactory address by the owner and reverted if it is not owner", async () => {
      // New master factory address (mock address)
      const newMasterFactory =await ethers.Wallet.createRandom().address;
      
  
      const nonOwner = signers[1]; // Assume this is not the owner
    await expect(
      fundFactory.connect(nonOwner).setMasterFactory(newMasterFactory)
    ).to.be.revertedWith("Only Owner can call");
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


    // it("should allow the owner to set the admin fee and should reverted the transaction", async () => {
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
    //   const nonOwner = signers[1]; // Assuming this is not the owner
    // await expect(
    //   fundFactory.connect(nonOwner).setAdminFee(AddressOfToken, 123, "1")
    // ).to.be.revertedWith("Only Owner can set implementation");
    // });
  

    it("should set the admin wallet by the owner and revert if not the owner or zero address", async () => {
      const newAdminWallet = await ethers.Wallet.createRandom().address;  // Mock wallet address
      const actionID = "1"; // Sample action ID

      // 1. Owner sets the admin wallet
      await fundFactory.connect(owner).setAdminWallet(newAdminWallet, actionID);
      expect(await fundFactory.getAdminWallet()).to.equal(newAdminWallet);
    
      // 2. Non-owner tries to set the admin wallet - should revert
      const nonOwner = signers[1];  // Assuming this is not the owner
      await expect(
        fundFactory.connect(nonOwner).setAdminWallet(newAdminWallet, actionID)
      ).to.be.revertedWith("Only Owner can call");
    
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


  it("should set fee parameters correctly when called by owner", async () => {
    const token = await ethers.Wallet.createRandom().address;
    const escrowFee = 100;  // 1%
    const wrapFee = 150;    // 1.5%
    const dividendFee = 200; // 2%
    const redemptionFee = 250; // 2.5%
    const actionID = "SET_FEE_1";
  
    await fundFactory.connect(owner).setFee(
      token,
      escrowFee,
      wrapFee,
      dividendFee,
      redemptionFee,
      actionID
    );
  
    expect(await fundFactory.getEscrowFee(token)).to.equal(escrowFee);
    expect(await fundFactory.getWrapFee(token)).to.equal(wrapFee);
    expect(await fundFactory.getDividendFee(token)).to.equal(dividendFee);
    expect(await fundFactory.getRedemptionFee(token)).to.equal(redemptionFee);
  });
  
  it("should revert when non-owner tries to set fee", async () => {
    const token = await ethers.Wallet.createRandom().address;
    await expect(
      fundFactory.connect(user1).setFee(
        token,
        100,
        150,
        200,
        250,
        "SET_FEE_2"
      )
    ).to.be.revertedWith("Only Owner can call");
  });
  
  it("should revert when trying to reset fees for same token", async () => {
    const token = await ethers.Wallet.createRandom().address;
    
    // First fee setting
    await fundFactory.connect(owner).setFee(
      token,
      100,
      150,
      200,
      250,
      "SET_FEE_3"
    );
  
    // Attempt to reset fees
    await expect(
      fundFactory.connect(owner).setFee(
        token,
        300,
        350,
        400,
        450,
        "SET_FEE_4"
      )
    ).to.be.revertedWith("Admin Fee Reset Not Allowed!!");
  });
  
  
  it("should correctly set implementation addresses", async () => {
    const newImplFund = await ethers.Wallet.createRandom().address;
    const newImplEquityConfig = await ethers.Wallet.createRandom().address;
  
    await fundFactory.connect(owner).setImpl(newImplFund, newImplEquityConfig);
  
    // Verify implementation addresses through events
    await expect(fundFactory.connect(owner).setImpl(newImplFund, newImplEquityConfig))
      .to.emit(fundFactory, "ImplementationsUpdated")
      .withArgs(newImplFund, newImplEquityConfig);
  });
  
  it("should revert when non-owner tries to set implementations", async () => {
    const newImplFund = await ethers.Wallet.createRandom().address;
    const newImplEquityConfig = await ethers.Wallet.createRandom().address;
  
    await expect(
      fundFactory.connect(user1).setImpl(newImplFund, newImplEquityConfig)
    ).to.be.revertedWith("Only Owner can call");
  });
  
  it("should track token total supply correctly", async () => {
    let tokenDetails = {
      owner: owner.address,
      name: "Supply Test Token",
      symbol: "STT",
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
  
    // Step 1: Add Token Factory to Identity Factory
    await identityFactory.addTokenFactory(trexFactory.address);
  
    // Step 2: Deploy TREX Suite
    const tx = await trexFactory.connect(owner).deployTREXSuite(
      "supply_test_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const tokenAddress = event?.args?._token;
  
  
    // Step 3: Initialize and Set Implementation in Fund Factory
    let fundProxyAttached = await fundFactory.attach(fundProxy.address);
    await fundProxyAttached.init(trexFactory.address);
    await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);
  
    // Ensure the FundFactory is correctly linked with FundFactoryStorage in this test
 
  await fundProxyAttached.attach(fundFactoryStorage.address); 
    // Step 4: Create Fund
    const supply = ethers.utils.parseEther("1000000"); // 1M tokens
  
    const initData = "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000";
  
    const createFundTx = await fundProxyAttached.createFund(
      tokenAddress,
      initData,
      supply,
      "SUPPLY_TEST"
    );
    await createFundTx.wait();
  
    // Step 5: Retrieve the total supply
    const actualSupply = await fundProxyAttached.getTokenTotalSupply(tokenAddress);

  
 
// Check if tokenTotalSupply was updated correctly
const expectedSupply = supply.toString();
const updatedSupply = actualSupply.toString();
expect(updatedSupply).to.equal(expectedSupply, "The total supply does not match");

// Step 6: Check FundCreated Events
const fundCreatedEvents = await fundFactory.queryFilter(fundFactory.filters.FundCreated());
console.log("Fund Created Events:", fundCreatedEvents);

// Assert that the supply matches
expect(actualSupply).to.equal(supply);
  });
  
  
  it("should revert when creating fund/equity for already linked token", async () => {
    let tokenDetails = {
      owner: owner.address,
      name: "Link Test Token",
      symbol: "LTT",
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
      "link_test_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const tokenAddress = event?.args?._token;
  
    // Set implementation
    let fundProxyAttached = await fundFactory.attach(fundProxy.address);
    await fundProxyAttached.init(trexFactory.address);
    await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);
    const initData = "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000";

    // Create initial fund
    await fundProxyAttached.createFund(
      tokenAddress,
      initData,
      1000000,
      "LINK_TEST_1"
    );
  
    // Attempt to create another fund with same token
    await expect(
      fundProxyAttached.createFund(
        tokenAddress,
        initData,
        1000000,
        "LINK_TEST_2"
      )
    ).to.be.revertedWith("Token already linked to a Fund or Equity");
  
    // Attempt to create equity config with same token
    await expect(
      fundProxyAttached.createEquityConfig(
        tokenAddress,
        initData,
        1000000,
        "LINK_TEST_3"
      )
    ).to.be.revertedWith("Token already linked to a Fund or Equity");
  });
    
});
