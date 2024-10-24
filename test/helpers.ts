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

describe(" Tokenization Testing ", function () {
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
    wrapper = await new Wrapper__factory(owner).deploy(
      verc20.address
    );

    await fundProxy.upgradeTo(fundFactory.address);

    trexFactory = await new TREXFactory__factory(owner).deploy(
      trexImplementationAuthority.address,
      identityFactory.address,
      wrapper.address
    );
    usdcToken = await new USDC__factory(owner).deploy();
    usdtToken = await new USDT__factory(owner).deploy();

  });
  it("USDC Helper", async () => {
    await usdcToken.mint(owner.address, 10000);
    let balance = await usdcToken.balanceOf(owner.address);
    expect(balance).to.be.equal(10000);

    await usdcToken.burn(owner.address, 1000);
    let BalanceAfterBurn = await usdcToken.balanceOf(owner.address);
    expect(BalanceAfterBurn).to.be.equal(9000);

    const TokenDecimals = await usdcToken.decimals();
    expect(TokenDecimals).to.be.equal(6);
});

  it("USDT Helper", async () => {
    await usdtToken.mint(owner.address, 10000);
    let balance = await usdtToken.balanceOf(owner.address);
    expect(balance).to.be.equal(10000);

    await usdtToken.burn(owner.address, 1000);
    let BalanceAfterBurn = await usdtToken.balanceOf(owner.address);
    expect(BalanceAfterBurn).to.be.equal(9000);
    const TokenDecimals = await usdtToken.decimals();
    expect(TokenDecimals).to.be.equal(6);
  });
});
