import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  CountryAllowModule,
  CountryAllowModule__factory,
  EquityConfig,
  EquityConfig__factory,
  FactoryProxy,
  FactoryProxy__factory,
  Fund,
  Fund__factory,
  FundFactory,
  FundFactory__factory,
  HoldTimeModule,
  HoldTimeModule__factory,
  Identity,
  Identity__factory,
  IdentityRegistry,
  IdentityRegistry__factory,
  IdentityRegistryStorage,
  IdentityRegistryStorage__factory,
  IdFactory,
  IdFactory__factory,
  ImplementationAuthority,
  ImplementationAuthority__factory,
  MaxBalanceModule,
  MaxBalanceModule__factory,
  ModularCompliance,
  ModularCompliance__factory,
  SupplyLimitModule,
  SupplyLimitModule__factory,
  Token,
  Token__factory,
  TREXFactory,
  TREXFactory__factory,
  TREXImplementationAuthority,
  TREXImplementationAuthority__factory,
  TrustedIssuersRegistry,
  TrustedIssuersRegistry__factory,
  USDC,
  USDC__factory,
  USDT,
  USDT__factory,
  VERC20,
  VERC20__factory,
  Wrapper,
  Wrapper__factory,
} from "../typechain";

describe(" Helpers function Testing ", function () {
  let signer: SignerWithAddress;
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let tokenIssuer: SignerWithAddress;
  let transferAgent: SignerWithAddress;
  let user1: SignerWithAddress;
  let sponsor: SignerWithAddress;
  let user2: SignerWithAddress;

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
  let verc20: VERC20;
  let usdcToken: USDC;
  let usdtToken: USDT;

  beforeEach(" ", async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    tokenIssuer = signers[1];
    transferAgent = signers[2];
    user1 = signers[4];
    user2 = signers[5];

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
      owner
    ).deploy();

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

    countryAllowCompliance = await new CountryAllowModule__factory(
      owner
    ).deploy();

    supplyLimitCompliance = await new SupplyLimitModule__factory(
      owner
    ).deploy();

    maxBalanceCompliance = await new MaxBalanceModule__factory(owner).deploy();

    holdTimeCompliance = await new HoldTimeModule__factory(owner).deploy();

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
    // wrapper = await new Wrapper__factory(owner).deploy(
    //   verc20.address
    // );

    await fundProxy.upgradeTo(fundFactory.address);

    // trexFactory = await new TREXFactory__factory(owner).deploy(
    //   trexImplementationAuthority.address,
    //   identityFactory.address,
    //   wrapper.address
    // );
    
    usdcToken = await new USDC__factory(owner).deploy();
    usdtToken = await new USDT__factory(owner).deploy();

  });

  describe("USDC Token Functions", function () {
  
    it("should mint USDC correctly", async () => {
      // Mint 10,000 USDC to the owner's address
      await usdcToken.mint(owner.address, 10000);
      let balance = await usdcToken.balanceOf(owner.address);
      expect(balance).to.be.equal(10000);
    });
  
    it("should burn USDC correctly", async () => {
      await usdcToken.mint(owner.address, 10000);
      // Burn 1,000 USDC from the owner's address
      await usdcToken.burn(owner.address, 1000);
      let balanceAfterBurn = await usdcToken.balanceOf(owner.address);
      expect(balanceAfterBurn).to.be.equal(9000);
    });
  
    it("should check decimals of USDC token", async () => {
      // Checking the decimals for USDC token
      const tokenDecimals = await usdcToken.decimals();
      expect(tokenDecimals).to.be.equal(6);
    });
  
    it("should approve an allowance for USDC", async () => {
      // Approving 500 USDC allowance for user1
      await usdcToken.approve(user1.address, 500);
      let allowance = await usdcToken.allowance(owner.address, user1.address);
      expect(allowance).to.be.equal(500);
    });
  
    it("should transfer USDC correctly", async () => {
      await usdcToken.mint(owner.address, 10000);
      // Transfer 500 USDC from the owner to user1
      await usdcToken.transfer(user1.address, 500);
      let ownerBalance = await usdcToken.balanceOf(owner.address);
      let user1Balance = await usdcToken.balanceOf(user1.address);
  
      expect(ownerBalance).to.be.equal(9500);  // After burning and transferring
      expect(user1Balance).to.be.equal(500);
    });
  
    it("should transferFrom correctly with allowance", async () => {
      await usdcToken.mint(owner.address, 10000);
      // Allow user1 to transfer 200 USDC on behalf of owner
      await usdcToken.approve(user1.address, 200);
      
      // User1 transfers 200 USDC from owner to user2
      await usdcToken.connect(user1).transferFrom(owner.address, user2.address, 200);
  
      let ownerBalance = await usdcToken.balanceOf(owner.address);
      let user2Balance = await usdcToken.balanceOf(user2.address);
  
      expect(ownerBalance).to.be.equal(9800);  // After the transfer
      expect(user2Balance).to.be.equal(200);
    });
  
    it("should return totalSupply correctly", async () => {
      await usdcToken.mint(owner.address, 10000);
      // Check the total supply of USDC
      const totalSupply = await usdcToken.totalSupply();
      expect(totalSupply).to.be.equal(10000);  // Assuming initial supply is 10,000
    });
    
  });
  
  describe("USDT Token Functions", function () {
  
    it("should mint USDT correctly", async () => {
      // Mint 10,000 USDT to the owner's address
      await usdtToken.mint(owner.address, 10000);
      let balance = await usdtToken.balanceOf(owner.address);
      expect(balance).to.be.equal(10000);
    });
  
    it("should burn USDT correctly", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Burn 1,000 USDT from the owner's address
      await usdtToken.burn(owner.address, 1000);
      let balanceAfterBurn = await usdtToken.balanceOf(owner.address);
      expect(balanceAfterBurn).to.be.equal(9000);
    });
  
    it("should check decimals of USDT token", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Checking the decimals for USDT token
      const tokenDecimals = await usdtToken.decimals();
      expect(tokenDecimals).to.be.equal(6);
    });
  
    it("should approve an allowance for USDT", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Approving 500 USDT allowance for user1
      await usdtToken.approve(user1.address, 500);
      let allowance = await usdtToken.allowance(owner.address, user1.address);
      expect(allowance).to.be.equal(500);
    });
  
    it("should transfer USDT correctly", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Transfer 500 USDT from the owner to user1
      await usdtToken.transfer(user1.address, 500);
      let ownerBalance = await usdtToken.balanceOf(owner.address);
      let user1Balance = await usdtToken.balanceOf(user1.address);
  
      expect(ownerBalance).to.be.equal(9500);  // After burning and transferring
      expect(user1Balance).to.be.equal(500);
    });
  
    it("should transferFrom correctly with allowance", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Allow user1 to transfer 200 USDT on behalf of owner
      await usdtToken.approve(user1.address, 200);
      
      // User1 transfers 200 USDT from owner to user2
      await usdtToken.connect(user1).transferFrom(owner.address, user2.address, 200);
  
      let ownerBalance = await usdtToken.balanceOf(owner.address);
      let user2Balance = await usdtToken.balanceOf(user2.address);
  
      expect(ownerBalance).to.be.equal(9800);  // After the transfer
      expect(user2Balance).to.be.equal(200);
    });
  
    it("should return totalSupply correctly for USDT", async () => {
      await usdtToken.mint(owner.address, 10000);
      // Check the total supply of USDT
      const totalSupply = await usdtToken.totalSupply();
      expect(totalSupply).to.be.equal(10000);  // Assuming initial supply is 10,000
    });
  
  });
  
});
