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

describe("Verc20 Contract Testing ", function () { let signers: SignerWithAddress[]; let owner: SignerWithAddress; let tokenIssuer: SignerWithAddress; let transferAgent: SignerWithAddress; let user1: SignerWithAddress; let user2: SignerWithAddress; let user3: SignerWithAddress;

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
});

describe("VERC20 Contract", function () {
  it("should have correct name, symbol, and decimals", async function () {
    await verc20.init("MyToken","MTK",18);
    expect(await verc20.name()).to.equal("MyToken");
    expect(await verc20.symbol()).to.equal("MTK");
    expect(await verc20.decimals()).to.equal(18);
  });


  it("should mint tokens correctly", async function () {
    await verc20.init("MyToken","MTK",18);
    const initialBalance = await verc20.balanceOf(owner.address);
    const mintAmount = ethers.utils.parseUnits("100", 18);

    // Mint tokens
    await verc20.mint(owner.address, mintAmount);

    const newBalance = await verc20.balanceOf(owner.address);
    expect(newBalance.sub(initialBalance)).to.equal(mintAmount); // Ensure balance increased by mint amount
  });

  it("should burn tokens correctly", async function () {
    await verc20.init("MyToken","MTK",18);
    const mintAmount = ethers.utils.parseUnits("100", 18);

    // Mint tokens
    await verc20.mint(owner.address, mintAmount);

    const initialBalance = await verc20.balanceOf(owner.address);

    // Burn tokens
    await verc20.burn(owner.address, mintAmount);

    const newBalance = await verc20.balanceOf(owner.address);
    expect(initialBalance.sub(newBalance)).to.equal(mintAmount); // Ensure balance decreased by burn amount
  });

  it("should only allow the owner to mint", async function () {
    await verc20.init("MyToken","MTK",18);
    const mintAmount = ethers.utils.parseUnits("100", 18);

    // Ensure only owner can mint tokens
    await expect(verc20.connect(user1).mint(user1.address, mintAmount))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(verc20.connect(user2).mint(user2.address, mintAmount))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should only allow the owner to burn", async function () {
    await verc20.init("MyToken","MTK",18);
    const mintAmount = ethers.utils.parseUnits("100", 18);

    // Mint tokens to owner
    await verc20.mint(owner.address, mintAmount);

    // Ensure only owner can burn tokens
    await expect(verc20.connect(user1).burn(owner.address, mintAmount))
      .to.be.revertedWith("Ownable: caller is not the owner");

    await expect(verc20.connect(user2).burn(owner.address, mintAmount))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should allow the owner to transfer ownership", async function () {
    await verc20.init("MyToken","MTK",18);

    // Transfer ownership to user1
    await verc20.transferOwnership(user1.address);

    // Ensure the new owner is user1
    expect(await verc20.owner()).to.equal(user1.address);

    // Verify only the new owner can mint
    const mintAmount = ethers.utils.parseUnits("100", 18);
    await verc20.connect(user1).mint(user1.address, mintAmount); // user1 can mint now
    await expect(verc20.connect(owner).mint(owner.address, mintAmount))
      .to.be.revertedWith("Ownable: caller is not the owner"); // previous owner cannot mint anymore
  });
});

});
