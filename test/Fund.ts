import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
const { BigNumber } = require('ethers');
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimTopicsRegistry, ClaimTopicsRegistry__factory, CountryAllowModule, CountryAllowModule__factory, EquityConfig, EquityConfig__factory, FactoryProxy, FactoryProxy__factory, Fund, Fund__factory, FundFactory, FundFactory__factory, FundFactoryStorage, FundFactoryStorage__factory, HoldTimeModule, HoldTimeModule__factory, Identity, Identity__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdFactory, IdFactory__factory, ImplementationAuthority, ImplementationAuthority__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, USDC, USDC__factory, VERC20, VERC20__factory, Wrapper, Wrapper__factory } from "../typechain";

describe(" Fund Contract Testing ", function () {
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

      let AddressOfToken;


      const data = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "uint256", "string", "uint256", "uint256", "uint256", "uint256"],
                [1, 1000, "CUSIP1234", 5, 500, 1000, 2000] // You can adjust these values as needed
            );


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
            // let AddressOfToken;
        
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

            await fund.connect(owner).init(AddressOfToken, data);

  })


  describe("Initialization", function () {
    it("should initialize the contract with correct values", async function () {
      expect(await fund.getNAV()).to.equal(500);
    });

    it("should decode the data correctly and set properties", async function () {
      expect(await fund.getOffChainPriceStatus()).to.be.false;
      expect(await fund.getDividendStatus("CUSIP123")).to.be.false;
    });
  });

  describe("Modifiers", function () {
    it("should allow an owner to call onlyAgent functions", async function () {
        // Ensure owner is treated as an agent
        await expect(fund.connect(owner).setNAV(500, "ACTION123"))
          .to.emit(fund, "NAVUpdated")
          .withArgs(500, "ACTION123");
    });
  });

  describe("Off-Chain Price Management", function () {
    it("should allow the owner to set off-chain price", async function () {
      const newPrice = ethers.utils.parseUnits("200", 18);
      await fund.connect(owner).setAssetPriceOffChain(newPrice);

      expect(await fund.getOffChainPrice()).to.equal(newPrice);
    });

    it("should allow the owner to toggle off-chain price status", async function () {
      await fund.connect(owner).setOffChainPrice(true);
      expect(await fund.getOffChainPriceStatus()).to.be.true;
    });
  });

  describe("Investment Limits", function () {
    it("should update minimum investment", async function () {
      const newMinInvestment = ethers.utils.parseUnits("50", 18);
      await expect(fund.connect(owner).setMinInvestment(newMinInvestment, "ACTION456"))
        .to.emit(fund, "MinimumInvestmentUpdated")
        .withArgs(newMinInvestment, "ACTION456");

      expect(await fund.minInvestment()).to.equal(newMinInvestment);
    });

    it("should update maximum investment", async function () {
      const newMaxInvestment = ethers.utils.parseUnits("500", 18);
      await expect(fund.connect(owner).setMaxInvestment(newMaxInvestment, "ACTION789"))
        .to.emit(fund, "MaximumInvestmentUpdated")
        .withArgs(newMaxInvestment, "ACTION789");

      expect(await fund.maxInvestment()).to.equal(newMaxInvestment);
    });
  });

  describe("Projected Yield", function () {
    it("should update the projected yield", async function () {
      const newProjectedYield = 20;
      await expect(fund.connect(owner).setProjectedYield(newProjectedYield, "ACTION999"))
        .to.emit(fund, "ProjectedYieldUpdated")
        .withArgs(newProjectedYield, "ACTION999");
    expect(await fund.projectedYield()).to.equal(newProjectedYield);
    });
  });

});
