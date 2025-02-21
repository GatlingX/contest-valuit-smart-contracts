import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ClaimTopicsRegistry, ClaimTopicsRegistry__factory, CountryAllowModule, CountryAllowModule__factory, EquityConfig, EquityConfig__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory, WrapperProxy, WrapperProxy__factory } from "../typechain";

describe("Wrapper Contract Testing", function () {
    let signer: SignerWithAddress;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let tokenIssuer: SignerWithAddress;
    let transferAgent: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    
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
    let verc20Implementation: ImplementationAuthority;
    let wrapperProxy: WrapperProxy;

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
  
      

      //Compliance Modules

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
    verc20 = await new VERC20__factory(owner).deploy();
    verc20Implementation = await new ImplementationAuthority__factory(owner).deploy(verc20.address);
    wrapper = await new Wrapper__factory(owner).deploy();
    wrapperProxy = await new WrapperProxy__factory(owner).deploy();

    await wrapperProxy.upgradeTo(wrapper.address);

    // await trexFactory.connect(owner).setWrapper(wrapper.address);
    

    //Stable Coin
    usdc = await new USDC__factory(owner).deploy();
    await usdc.mint(user1.address,1000000);
    await fundProxy.upgradeTo(fundFactory.address);
    trexFactory = await new TREXFactory__factory(owner).deploy(trexImplementationAuthority.address, identityFactory.address, wrapper.address);

    await trexFactory.setWrapper(wrapperProxy.address);

    });

    
  it("should revert when trying to unwrap non-existent ERC20 token", async function () {
    await expect(wrapper.connect(user1).toERC3643(ethers.constants.AddressZero, 100))
      .to.be.revertedWith("ERC3643 Token doesn't exist");
  });
     
it("should revert when wrapping is disabled in compliance", async function () {
    let tokenDetails = {
      owner: owner.address,
      name: "Test Token",
      symbol: "TST",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: false, // Explicitly disable wrapping
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
      "no_wrap_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const tokenAddress = event?.args?._token;
  
    await expect(wrapper.connect(user1).createWrapToken(tokenAddress, 91))
      .to.be.revertedWith("Wrapping disabled");
  });


  it("should revert when trying to wrap with invalid wrapper address", async function () {
    let tokenDetails = {
      owner: owner.address,
      name: "Test Token",
      symbol: "TST",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: true,
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
      "wrapper_test_salt",
      tokenDetails,
      claimDetails
    );
  
    const receipt = await tx.wait();
    const event = receipt.events?.find(event => event.event === "TREXSuiteDeployed");
    const tokenAddress = event?.args?._token;
  
    // Set a different wrapper address in the compliance
    const tokenContract = await tokenImplementation.attach(tokenAddress);
    const compliance = await modularComplianceImplementation.attach(await tokenContract.compliance());
   
  
    await expect(wrapper.connect(user1).createWrapToken(tokenAddress, 91))
      .to.be.revertedWith("Invalid wrapper");
  });

    it("Create Wrap Token and to be reverted with Wrapping disabled", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            await expect(wrapper.connect(user1).createWrapToken(verc20Implementation.address, 91)).to.be.reverted;
    })


    it("shows error if wrap token not created and try to access wrap token", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            //identities
            await identityFactory.addAgent(owner.address);
            await identityFactory.createIdentity(user2.address, user2.address);
            let user2ID = await identityFactory.getIdentity(user2.address);

            let identityRegistryAddress = await tokenAttached?.identityRegistry();

            
            let identityRegisteryAttached = identityRegistryImplementation.attach(String(identityRegistryAddress));
            await identityRegisteryAttached.connect(user1).registerIdentity(user2.address, String(user2ID), 91);

            await tokenAttached?.connect(user1).mint(user2.address, 100);

            // await tokenAttached?.connect(user2).increaseAllowance(wrapper.address,10);
            await expect(wrapper.connect(user2).toERC20(firstAddress, 10)).to.be.reverted;
        //     await wrapper.connect(user2).toERC3643(await wrapper.getERC20(firstAddress), 10);
    })


    it("if unauthorized person try to create the wrap token", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            await expect(wrapper.connect(owner).createWrapToken(verc20Implementation.address, 91)).to.be.reverted;

            //identities
            await identityFactory.addAgent(owner.address);
            await identityFactory.createIdentity(user2.address, user2.address);
            let user2ID = await identityFactory.getIdentity(user2.address);

            let identityRegistryAddress = await tokenAttached?.identityRegistry();

            
            let identityRegisteryAttached = identityRegistryImplementation.attach(String(identityRegistryAddress));
            await identityRegisteryAttached.connect(user1).registerIdentity(user2.address, String(user2ID), 91);

            await tokenAttached?.connect(user1).mint(user2.address, 100);

            // await tokenAttached?.connect(user2).increaseAllowance(wrapper.address,10);
            // await expect(wrapper.connect(user2).toERC20(firstAddress, 10)).to.be.reverted;
        //     await wrapper.connect(user2).toERC3643(await wrapper.getERC20(firstAddress), 10);
    })


    it("Access the toERC20 token but the wrap token is not created", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            //identities
            await identityFactory.addAgent(owner.address);
            await identityFactory.createIdentity(user2.address, user2.address);
            let user2ID = await identityFactory.getIdentity(user2.address);

            let identityRegistryAddress = await tokenAttached?.identityRegistry();

            // await tokenAttached?.connect(user2).increaseAllowance(wrapper.address,10);
            await expect(wrapper.connect(user2).toERC20(firstAddress, 10)).to.be.reverted;
        //     await wrapper.connect(user2).toERC3643(await wrapper.getERC20(firstAddress), 10);
    })
    

    it("Access the toERC20 token but the owner is not authorized", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            //identities
            await identityFactory.addAgent(owner.address);
            await identityFactory.createIdentity(user2.address, user2.address);
            let user2ID = await identityFactory.getIdentity(user2.address);

            let identityRegistryAddress = await tokenAttached?.identityRegistry();

            // await tokenAttached?.connect(user2).increaseAllowance(wrapper.address,10);
            await expect(wrapper.connect(owner).toERC20(firstAddress, 10)).to.be.reverted;
        //     await wrapper.connect(user2).toERC3643(await wrapper.getERC20(firstAddress), 10);
    })


    it("Revert the toErc function if it has zero address", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            //identities
            await identityFactory.addAgent(owner.address);
            await identityFactory.createIdentity(user2.address, user2.address);
            let user2ID = await identityFactory.getIdentity(user2.address);

            let identityRegistryAddress = await tokenAttached?.identityRegistry();

            
            let identityRegisteryAttached = identityRegistryImplementation.attach(String(identityRegistryAddress));
            await identityRegisteryAttached.connect(user1).registerIdentity(user2.address, String(user2ID), 91);

            await tokenAttached?.connect(user1).mint(user2.address, 100);

            // await tokenAttached?.connect(user2).increaseAllowance(wrapper.address,10);
            await expect(wrapper.connect(user2).toERC20(ethers.constants.AddressZero, 10)).to.be.reverted;
        //     await wrapper.connect(user2).toERC3643(await wrapper.getERC20(firstAddress), 10);
    })


    it("Reverted if the wrap function has zero address", async () => {

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

        let fundProxyAttached = await fundFactory.attach(fundProxy.address);
            
            await fundProxyAttached.init(trexFactory.address);

            await fundProxyAttached.setImpl(implFund.address, implEquityConfig.address);

            const txn = await fundProxyAttached.createFund(AddressOfToken, 
                "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000076466353466726600000000000000000000000000000000000000000000000000",
                10,
                "Hello"
            );

            const receiptFund = await txn.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            await expect(wrapper.connect(user1).createWrapToken(ethers.constants.AddressZero, 91)).to.be.reverted;
    })

    it("should revert when non-owner tries to set onchain ID", async function () {
      const newOnchainID = user1.address;
      await expect(wrapper.connect(user1).setOnchainID(newOnchainID))
        .to.be.reverted;
    });
  
      it("should revert when initializing with zero address for _erc20Impl", async function () {
        await expect(wrapper.init(ethers.constants.AddressZero, fundFactory.address))
          .to.be.revertedWith("INVALID! Zero Address");
      });
  
  
      it("should revert when initializing with zero address for _fundFactory", async function () {
        await expect(wrapper.init(verc20.address, ethers.constants.AddressZero))
          .to.be.revertedWith("INVALID! Zero Address");
      });
  
  
      it("should revert if the address passed is zero", async function () {
        await expect(wrapper.setFundFactory(ethers.constants.AddressZero))
        .to.be.reverted;
      });
  
    
      it("should revert when non-owner attempts to set EscrowController", async function () {
        const newEscrowController = ethers.constants.AddressZero;
        await expect(wrapper.connect(user1).setEscrowController(newEscrowController))
          .to.be.reverted;
      });
  
  
      it("should revert if the address passed is zero", async function () {
        await expect(wrapper.setEscrowController(ethers.constants.AddressZero))
          .to.be.reverted;
      });
  
  
      it("should revert when non-owner attempts to set StableCoin", async function () {
        const stableCoin = ethers.constants.AddressZero;
        await expect(wrapper.connect(user1).setStableCoin("USDC"))
          .to.be.reverted;
      });
      
  
      it("should revert if the stable coin is invalid", async function () {
        const invalidStableCoin = "INVALID";
        await expect(wrapper.setStableCoin(invalidStableCoin))
          .to.be.reverted;
      });
  

  });