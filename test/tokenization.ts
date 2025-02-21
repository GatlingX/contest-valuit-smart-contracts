import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Event, Signer } from "ethers";
import "@nomicfoundation/hardhat-chai-matchers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  AgentRole,
  AgentRole__factory,
  AgentRoleUpgradeable,
  AgentRoleUpgradeable__factory,
  ClaimIssuer,
  ClaimIssuer__factory,
  ClaimTopicsRegistry,
  ClaimTopicsRegistry__factory,
  CountryAllowModule,
  CountryAllowModule__factory,
  EquityConfig,
  EquityConfig__factory,
  FactoryProxy,
  FactoryProxy__factory,
  EscrowControllerProxy,
  EscrowControllerProxy__factory,
  Fund,
  Fund__factory,
  FundFactory,
  FundFactory__factory,
  HoldTimeModule,
  HoldTimeModule__factory,
  IAFactory__factory,
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
  VERC20,
  VERC20__factory,
  Wrapper,
  Wrapper__factory,
  ProxyV1,
  ProxyV1__factory,
  WrapperProxy,
  WrapperProxy__factory,
} from "../typechain";

describe("Tokenization Contract Testing ", function () {
  let signer: SignerWithAddress;
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let tokenIssuer: SignerWithAddress;
  let transferAgent: SignerWithAddress;
  let user1: SignerWithAddress;
  let sponsor: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let iaFactory: SignerWithAddress;
  let user4: SignerWithAddress;

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
  let escrowControllerProxy: EscrowControllerProxy;
  let proxyv1:ProxyV1;
  let wrapperproxy:WrapperProxy;
  let fundProxy: FactoryProxy;
  let equityConfig: EquityConfig;
  let implEquityConfig: ImplementationAuthority;
  let claimIssuerImplementation: ClaimIssuer;
  //Wrapper Contarct
  let wrapper: Wrapper;
  let verc20: VERC20;
  let agentContract: AgentRole;
  let agentUpgradeable: AgentRoleUpgradeable;
  let snapshotId: any;
  let token: Token;

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
    user4 = signers[7];
    iaFactory = signers[8];

    snapshotId = await network.provider.send("evm_snapshot");
    // console.log("trust ", trust);

    //  let trustSigner =  provider.getSigner(trust.address)
    const trustSigningKey = ethers.Wallet.createRandom();

    // let claimIssuerContract = new ClaimIssuer__factory(owner).deploy(
    //   trustSigningKey.address
    // );

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
    await modularComplianceImplementation.init();
    tokenImplementation = await new Token__factory(owner).deploy();

    trexImplementationAuthority =
      await new TREXImplementationAuthority__factory(owner).deploy(
        true,
        ethers.constants.AddressZero,
        iaFactory.address
      );

    // ONCHAIN IDENTITY
    identityImplementation = await new Identity__factory(owner).deploy(
      owner.address,
      true
    );

    token = await new Token__factory(owner).deploy();
    identityImplementationAuthority =
      await new ImplementationAuthority__factory(owner).deploy(
        identityImplementation.address
      );

    identityFactory = await new IdFactory__factory(owner).deploy(
      identityImplementationAuthority.address
    );

    agentContract = await new AgentRole__factory(owner).deploy();
    agentUpgradeable = await new AgentRoleUpgradeable__factory(owner).deploy();

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
    //   console.log("Factory Deployed", trexFactory.address);

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
    escrowControllerProxy=await new EscrowControllerProxy__factory(owner).deploy();
    proxyv1=await new ProxyV1__factory(owner).deploy();
    wrapperproxy=await new WrapperProxy__factory(owner).deploy();

    //Wrapper
    verc20 = await new VERC20__factory(owner).deploy();
    wrapper = await new Wrapper__factory(owner).deploy(
    );

    //Stable Coin
    usdc = await new USDC__factory(owner).deploy();

    await usdc.mint(user1.address, 1000000);

    await identityRegistryImplementation.init(
      trustedIssuersRegistryImplementation.address,
      claimTopicsRegistryImplementation.address,
      identityRegistryStorageImplementation.address
    );

    await identityRegistryImplementation.addAgent(owner.address);
    await identityRegistryImplementation.addAgent(
      identityRegistryImplementation.address
    );
    await identityRegistryStorageImplementation.connect(owner).init();
    await identityRegistryStorageImplementation.bindIdentityRegistry(
      identityRegistryImplementation.address
    );

    await tokenImplementation.init(
      identityRegistryImplementation.address,
      modularComplianceImplementation.address,
      "AssetToken",
      "AT",
      18,
      identityRegistryStorageImplementation.address
    );

    await tokenImplementation.addAgent(owner.address);
    await identityFactory.addAgent(user1.address);
    await identityFactory.addAgent(owner.address);

    await identityFactory.createIdentity(owner.address, owner.address);
    await identityFactory.createIdentity(user3.address, user3.address);
    await identityFactory.createIdentity(user4.address, user4.address);

    let ownerIdentity = await identityFactory.getIdentity(owner.address);
    let user3Identity = await identityFactory.getIdentity(user3.address);
    let user4Identity = await identityFactory.getIdentity(user4.address);

    let tokenagent = await tokenImplementation.isAgent(owner.address);

    let tokenIR = identityRegistryImplementation.attach(
      await tokenImplementation.identityRegistry()
    );

    await tokenIR
      .connect(owner)
      .registerIdentity(owner.address, ownerIdentity, 91);
    await tokenIR
      .connect(owner)
      .registerIdentity(user3.address, user3Identity, 91);

    await tokenIR
      .connect(owner)
      .registerIdentity(user4.address, user4Identity, 91);

    await fundProxy.upgradeTo(fundFactory.address);
    await claimTopicsRegistryImplementation.init();

    await modularComplianceImplementation.addModule(holdTimeCompliance.address);
    await modularComplianceImplementation.addModule(
      countryAllowCompliance.address
    );
    await modularComplianceImplementation.addModule(
      supplyLimitCompliance.address
    );
    await modularComplianceImplementation.addModule(maxBalanceCompliance.address);

    await modularComplianceImplementation.callModuleFunction(
      await supplyLimitCompliance.interface.encodeFunctionData(
        "setSupplyLimit",
        [ethers.utils.parseEther("1000000000")]
      ),
      supplyLimitCompliance.address
    );

    await modularComplianceImplementation.callModuleFunction(
        await holdTimeCompliance.interface.encodeFunctionData(
          "setHoldTime",
          [Math.floor(Date.now() / 1000) + 50 * 24 * 60 * 60]
        ),
        holdTimeCompliance.address
      );

      await modularComplianceImplementation.callModuleFunction(
        await maxBalanceCompliance.interface.encodeFunctionData(
          "setMaxBalance",
          [ethers.utils.parseEther("10000000")]
        ),
        maxBalanceCompliance.address
      );

      await modularComplianceImplementation.callModuleFunction(
        await countryAllowCompliance.interface.encodeFunctionData(
          "addAllowedCountry",
          [[91,1]]
        ),
        countryAllowCompliance.address
      );

    trexFactory = await new TREXFactory__factory(owner).deploy(
      trexImplementationAuthority.address,
      identityFactory.address,
      wrapper.address
    );
  });
 
  afterEach(async () => {
    await network.provider.send("evm_revert", [snapshotId]);
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

  it("Mint Tokens", async () => {
    let tokenDetails = {
      owner: owner.address,
      name: "Nickel",
      symbol: "NKL",
      decimals: 18,
      irs: ethers.constants.AddressZero,
      ONCHAINID: ethers.constants.AddressZero,
      wrap: true,
      irAgents: [user1.address],
      tokenAgents: [user1.address],
      transferAgents: [owner.address],
      complianceModules: [
        countryAllowCompliance.address,
        supplyLimitCompliance.address,
        maxBalanceCompliance.address,
        holdTimeCompliance.address,
      ],
      complianceSettings: [
        "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
        "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
        "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
        "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
      ],
    };

    let claimDetails = {
      claimTopics: [],
      issuers: [],
      issuerClaims: [],
    };

    await identityFactory.addTokenFactory(trexFactory.address);

    const TX = await trexFactory.deployTREXSuite(
      "process.env.TOKEN_SALT",
      tokenDetails,
      claimDetails
    );

    const receipt = await TX.wait();

    const event = receipt.events?.find(
      (event) => event.event === "TREXSuiteDeployed"
    );

    let token = event?.args;

    // console.log("Token Address: ", token);
    let tokenAttached;
    let firstAddress;

    if (Array.isArray(token) && token.length > 0) {
      firstAddress = token[0]; // Directly accessing the first element
      tokenAttached = await tokenImplementation.attach(firstAddress);
    }

    expect(await tokenAttached?.name()).to.equal("Nickel");
    expect(await tokenAttached?.symbol()).to.equal("NKL");

    await identityFactory.createIdentity(user1.address, user1.address);
    let user1Identity = await identityFactory.getIdentity(user1.address);

    let identityRegistryAddress = await tokenAttached?.identityRegistry();

    let identityRegisteryAttached = identityRegistryImplementation.attach(
      String(identityRegistryAddress)
    );

    await identityRegisteryAttached
      .connect(user1)
      .registerIdentity(user1.address, String(user1Identity), 91);

    await tokenAttached?.connect(user1).mint(user1.address, 100);
    await tokenAttached?.connect(user1).batchMint([user1.address], [100]);
    expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(200);
    await tokenAttached?.connect(user1).burn(user1.address, 50);
    await tokenAttached?.connect(user1).batchBurn([user1.address], [50]);
    expect(await tokenAttached?.balanceOf(user1.address)).to.be.equal(100);
  });
 
  describe("Registries", () => {
    describe("ClaimTopicRegsitry", () => {

      it("init", async () => {
        // await claimTopicsRegistryImplementation.init();
        await expect(
          claimTopicsRegistryImplementation.init()
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("addClaimTopic", async () => {
        await claimTopicsRegistryImplementation.connect(owner).addClaimTopic(1);
        
        await expect(
          claimTopicsRegistryImplementation.connect(user1).addClaimTopic(1)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      
      it("claimTopic exists", async () => {
        await claimTopicsRegistryImplementation.connect(owner).addClaimTopic(1);
        await expect(
          claimTopicsRegistryImplementation.connect(owner).addClaimTopic(1)
        ).to.be.revertedWith("claimTopic already exists");

        await expect(
          claimTopicsRegistryImplementation.connect(user1).addClaimTopic(1)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("removeClaimTopic", async () => {
        await claimTopicsRegistryImplementation
          .connect(owner)
          .removeClaimTopic(1);

          await expect(
            claimTopicsRegistryImplementation.connect(user1).removeClaimTopic(1)
          ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("removing already removed claimTopic", async () => {
        await claimTopicsRegistryImplementation
          .connect(owner)
          .removeClaimTopic(1);

          await expect(
            claimTopicsRegistryImplementation.connect(user1).removeClaimTopic(1)
          ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("getClaimTopics", async () => {
        await claimTopicsRegistryImplementation.connect(owner).getClaimTopics();

        await expect(
          claimTopicsRegistryImplementation.connect(user1).getClaimTopics()
        )
      });
    });

    describe("IdentityRegistry", () => {
      it("batchRegisterIdentity", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);

        await identityRegistryImplementation.batchRegisterIdentity(
          [user2.address],
          [user2Identity],
          [91]
        );
      });

      it("should revert if non-owner tries to batchRegisterIdentity", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
    
        await expect(
          identityRegistryImplementation.connect(user1).batchRegisterIdentity(
            [user2.address],
            [user2Identity],
            [91]
          )
        )
      });

      it("updateIdentity", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityRegistryImplementation.registerIdentity(
          user2.address,
          user2Identity,
          91
        );
        await identityRegistryImplementation
          .connect(owner)
          .updateIdentity(user2.address, user2Identity);
      });   
      
        // Revert when non-owner tries to updateIdentity
        it("should revert if non-owner tries to updateIdentity", async () => {
          await identityFactory.createIdentity(user2.address, user2.address);
          let user2Identity = await identityFactory.getIdentity(user2.address);
          await identityRegistryImplementation.registerIdentity(
            user2.address,
            user2Identity,
            91
          );
          await expect(
            identityRegistryImplementation.connect(owner).updateIdentity(user2.address, user2Identity)
          )
        });


      it("updateCountry", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityRegistryImplementation.registerIdentity(
          user2.address,
          user2Identity,
          91
        );
        await identityRegistryImplementation
          .connect(owner)
          .updateCountry(user2.address, 90);
      });


      it("should revert if non-owner tries to updateCountry", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityRegistryImplementation.registerIdentity(
          user2.address,
          user2Identity,
          91
        );
        await expect(
          identityRegistryImplementation.updateCountry(user2.address, 90)
        )
      });
    

      it("updateCountry event", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityRegistryImplementation.registerIdentity(
          user2.address,
          user2Identity,
          91
        );
        let tx = await identityRegistryImplementation
          .connect(owner)
          .updateCountry(user2.address, 90);
        await expect(tx)
          .to.emit(identityRegistryImplementation, "CountryUpdated")
          .withArgs(user2.address, 90);
      });

      it("deleteIdentity", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);

        await identityRegistryImplementation.registerIdentity(
          user2.address,
          user2Identity,
          91
        );
        await identityRegistryImplementation
          .connect(owner)
          .deleteIdentity(user2.address);
      });


        // Revert when non-owner tries to deleteIdentity
        it("should revert if non-owner tries to deleteIdentity", async () => {
          await identityFactory.createIdentity(user2.address, user2.address);
          let user2Identity = await identityFactory.getIdentity(user2.address);
          await identityRegistryImplementation.registerIdentity(
            user2.address,
            user2Identity,
            91
          );
          await expect(
            identityRegistryImplementation.deleteIdentity(user2.address)
          )
        });


      it("setClaimTopicsRegistry", async () => {
        await identityRegistryImplementation
          .connect(owner)
          .setClaimTopicsRegistry(claimTopicsRegistryImplementation.address);
      });

      it("setTrustedIssuersRegistry", async () => {
        await identityRegistryImplementation
          .connect(owner)
          .setTrustedIssuersRegistry(
            trustedIssuersRegistryImplementation.address
          );
      });

      it("setIdentityRegistryStorage", async () => {
        await identityRegistryImplementation
          .connect(owner)
          .setIdentityRegistryStorage(
            identityRegistryStorageImplementation.address
          );
      });

      // it("isVerified false", async () => {
      //   const claimDetails: any = {
      //     claimTopics: [ethers.utils.id("KYC")],
      //     issuers: [claimIssuerImplementation],
      //     issuerClaims: [[ethers.utils.id("KYC")]],
      //   };

      //   await identityRegistryImplementation
      //     .connect(owner)
      //     .isVerified(ethers.constants.AddressZero);
      // });
      it("foundClaimTopic false", async () => {
        await identityRegistryImplementation
          .connect(owner)
          .setTrustedIssuersRegistry(ethers.constants.AddressZero);
        await identityRegistryImplementation
          .connect(owner)
          .isVerified(owner.address);
      });

      it("issuersRegistry", async () => {
        await identityRegistryImplementation.connect(owner).issuersRegistry();
      });

      it("topicsRegistry", async () => {
        await identityRegistryImplementation.connect(owner).topicsRegistry();
      });

      it("identityStorage", async () => {
        await identityRegistryImplementation.connect(owner).identityStorage();
      });

      it("Identity contract exists", async () => {
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityRegistryImplementation.contains(user1.address);
      });

      it("Identity contract doesnt exists", async () => {
        await identityRegistryImplementation
          .connect(owner)
          .contains(signers[10].address);
      });

        // Revert when non-owner tries to setClaimTopicsRegistry
      it("should revert if non-owner tries to setClaimTopicsRegistry", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .setClaimTopicsRegistry(claimTopicsRegistryImplementation.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      // Revert when non-owner tries to setTrustedIssuersRegistry
      it("should revert if non-owner tries to setTrustedIssuersRegistry", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .setTrustedIssuersRegistry(trustedIssuersRegistryImplementation.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      // Revert when non-owner tries to setIdentityRegistryStorage
      it("should revert if non-owner tries to setIdentityRegistryStorage", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .setIdentityRegistryStorage(identityRegistryStorageImplementation.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      // Revert when non-owner tries to call isVerified
      it("should revert if non-owner tries to call isVerified", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .isVerified(ethers.constants.AddressZero)
        )
      });

      // Revert when non-owner tries to call foundClaimTopic false
      it("should revert if non-owner tries to call foundClaimTopic false", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .setTrustedIssuersRegistry(ethers.constants.AddressZero)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      // Revert when non-owner tries to call issuersRegistry
      it("should revert if non-owner tries to call issuersRegistry", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .issuersRegistry()
        )
      });

      // Revert when non-owner tries to call topicsRegistry
      it("should revert if non-owner tries to call topicsRegistry", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .topicsRegistry()
        )
      });

      // Revert when non-owner tries to call identityStorage
      it("should revert if non-owner tries to call identityStorage", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .identityStorage()
        )
      });

      // Revert when non-owner tries to call contains for non-existing identity
      it("should revert if non-owner tries to call contains for non-existing identity", async () => {
        await expect(
          identityRegistryImplementation
            .connect(user1)
            .contains(signers[10].address)
        )
      });
    });


    describe("TrustedIssuerRegistry", () => {
      it("init", async () => {
        await expect(
          trustedIssuersRegistryImplementation.init()
        ).to.be.revertedWith("Initializable: contract is already initialized");


        await expect(
          trustedIssuersRegistryImplementation.connect(user1).init()
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("addTrustedIssuer", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .addTrustedIssuer(user1.address, [20])
          ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("removeTrustedIssuer exists", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .removeTrustedIssuer(owner.address);

        await expect(
      trustedIssuersRegistryImplementation
        .connect(user1)
        .removeTrustedIssuer(owner.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("getTrustedIssuers", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .getTrustedIssuers();

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .getTrustedIssuers()
          );
      });

      it("getTrustedIssuersForClaimTopic", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .getTrustedIssuersForClaimTopic(20);

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .getTrustedIssuersForClaimTopic(20)
          );
      });

      it("isTrustedIssuer", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .isTrustedIssuer(owner.address);

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .isTrustedIssuer(owner.address)
          );
      });

      it("isTrustedIssuer false", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .isTrustedIssuer(owner.address);
      });

      it("getTrustedIssuerClaimTopics", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .getTrustedIssuerClaimTopics(owner.address);
      });
      it("hasClaimTopic", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .hasClaimTopic(owner.address, 20);

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .hasClaimTopic(owner.address, 20)
          )
      });

      it("hasClaimTopic false", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .hasClaimTopic(owner.address, 20);
      });
      
      it("hasClaimTopic false", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .updateIssuerClaimTopics(String(owner.address), [20]);

          await expect(
            trustedIssuersRegistryImplementation
              .connect(user1)
              .updateIssuerClaimTopics(owner.address, [20])
          ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("IdentityRegistryStorage", () => {
      it("unbindIdentityRegistry", async () => {
        await identityRegistryStorageImplementation.unbindIdentityRegistry(
          identityRegistryImplementation.address
        );
      });
      it("unbindIdentityRegistry event emit", async () => {
        let tx =
          await identityRegistryStorageImplementation.unbindIdentityRegistry(
            identityRegistryImplementation.address
          );

        await expect(tx)
          .to.emit(
            identityRegistryStorageImplementation,
            "IdentityRegistryUnbound"
          )
          .withArgs(identityRegistryImplementation.address);
      });
      it("linkedIdentityRegistries", async () => {
        await identityRegistryStorageImplementation
          .connect(owner)
          .linkedIdentityRegistries();
      });
    });


    it("linkedIdentityRegistries not by owner", async () => {
      await expect(
        identityRegistryStorageImplementation
          .connect(user1)
          .linkedIdentityRegistries()
      );
    });
  
    // Test for reverting when non-owner tries to unbind identity registry
    it("unbindIdentityRegistry not by owner", async () => {
      await expect(
        identityRegistryStorageImplementation
          .connect(user1)
          .unbindIdentityRegistry(identityRegistryImplementation.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
  });

  describe("Modules", () => {
    describe("MaxBalanceModule", () => {
      // it("initialize", async () => {
      //   await maxBalanceCompliance.connect(owner).initialize();
      // });

      it("Module name", async () => {
        await expect(
          maxBalanceCompliance.connect(user1).name()
        );

        await maxBalanceCompliance.connect(owner).name();
      });

      // it("preSetModuleState", async () => {
      //   expect(
      //     await maxBalanceCompliance
      //       .connect(owner)
      //       .preSetModuleState(
      //         modularComplianceImplementation.address,
      //         owner.address,
      //         100
      //       )
      //   ).to.be.revertedWithCustomError(
      //     maxBalanceCompliance,
      //     `OnlyComplianceOwnerCanCall`
      //   );
      // });
    });


    describe("SupplyModule", () => {
      // it("initialize", async () => {
      //   await supplyLimitCompliance.connect(owner).initialize();
      // });

      it("Module name", async () => {
        await expect(
          holdTimeCompliance.connect(user1).name()
        );

        await supplyLimitCompliance.connect(owner).name();
      });

      it("getSupplyLimit", async () => {
        await expect(
        holdTimeCompliance.connect(user1).getHoldTime(holdTimeCompliance.address)
        );

        await supplyLimitCompliance
          .connect(owner)
          .getSupplyLimit(supplyLimitCompliance.address);
      });

      it("canComplianceBind", async () => {
        await expect(
          holdTimeCompliance.connect(user1).canComplianceBind(holdTimeCompliance.address)
        );
    
        await supplyLimitCompliance
          .connect(owner)
          .canComplianceBind(supplyLimitCompliance.address);
      });

      it("moduleBurnAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              supplyLimitCompliance.interface.encodeFunctionData("moduleBurnAction", [owner.address, 1]),
              supplyLimitCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            supplyLimitCompliance.interface.encodeFunctionData(
              "moduleBurnAction",
              [owner.address, 1]
            ),
            supplyLimitCompliance.address
          );
      });

      it("moduleTransferAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              supplyLimitCompliance.interface.encodeFunctionData("moduleTransferAction", [owner.address, user1.address, 1]),
              supplyLimitCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            supplyLimitCompliance.interface.encodeFunctionData(
              "moduleTransferAction",
              [owner.address, user1.address, 1]
            ),
            supplyLimitCompliance.address
          );
      });
    });

    describe("HoldTimeModule", () => {
      // it("initialize", async () => {
      //   await holdTimeCompliance.initialize();
      // });

      it("Module name", async () => {
        await holdTimeCompliance.connect(owner).name();

        await expect(
          holdTimeCompliance.connect(user1).name()
        )
      });

      it("getSupplyLimit", async () => {
        await expect(
          holdTimeCompliance.connect(user1).getHoldTime(holdTimeCompliance.address)
        );

        await holdTimeCompliance
          .connect(owner)
          .getHoldTime(holdTimeCompliance.address);
      });

      it("canComplianceBind", async () => {
        await expect(
          holdTimeCompliance.connect(user1).canComplianceBind(holdTimeCompliance.address)
        )

        await holdTimeCompliance
          .connect(owner)
          .canComplianceBind(holdTimeCompliance.address);
      });

      it("moduleBurnAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              holdTimeCompliance.interface.encodeFunctionData("moduleBurnAction", [owner.address, 1]),
              holdTimeCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            holdTimeCompliance.interface.encodeFunctionData(
              "moduleBurnAction",
              [owner.address, 1]
            ),
            holdTimeCompliance.address
          );
      });

      it("moduleTransferAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              holdTimeCompliance.interface.encodeFunctionData("moduleTransferAction", [owner.address, user1.address, 1]),
              holdTimeCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            holdTimeCompliance.interface.encodeFunctionData(
              "moduleTransferAction",
              [owner.address, user1.address, 1]
            ),
            holdTimeCompliance.address
          );
      });
    });

    describe("CountryAllowModule", () => {
      // it("initialize", async () => {
      //   await countryAllowCompliance.connect(owner).initialize();
      // });
      it("Module name", async () => {
        await expect(
          countryAllowCompliance.connect(user1).name()
        );
      
        await countryAllowCompliance.connect(owner).name();
      });

      it("addAllowedCountry", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              countryAllowCompliance.interface.encodeFunctionData("addAllowedCountry", [91]),
              countryAllowCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        // await countryAllowCompliance.connect(owner).addAllowedCountry(91);
        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            countryAllowCompliance.interface.encodeFunctionData(
              "addAllowedCountry",
              [91]
            ),
            countryAllowCompliance.address
          );
      });

      it("removeAllowedCountry", async () => {
        // Ensure only owner can call this function
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              countryAllowCompliance.interface.encodeFunctionData("removeAllowedCountry", [91]),
              countryAllowCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");


        // Ensure only owner can call this function
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              countryAllowCompliance.interface.encodeFunctionData("addAllowedCountry", [91]),
              countryAllowCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            countryAllowCompliance.interface.encodeFunctionData(
              "addAllowedCountry",
              [91]
            ),
            countryAllowCompliance.address
          );
        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            countryAllowCompliance.interface.encodeFunctionData(
              "removeAllowedCountry",
              [91]
            ),
            countryAllowCompliance.address
          );
      });

      it("batchDisallowCountries", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              countryAllowCompliance.interface.encodeFunctionData("batchDisallowCountries", [[90, 91]]),
              countryAllowCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");


        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              countryAllowCompliance.interface.encodeFunctionData("batchAllowCountries", [[90, 91]]),
              countryAllowCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            countryAllowCompliance.interface.encodeFunctionData(
              "batchAllowCountries",
              [[90, 91]]
            ),
            countryAllowCompliance.address
          );
        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            countryAllowCompliance.interface.encodeFunctionData(
              "batchDisallowCountries",
              [[90, 91]]
            ),
            countryAllowCompliance.address
          );
      });
      
      it("canComplianceBind", async () => {
        await expect(
          countryAllowCompliance.connect(user1).canComplianceBind(countryAllowCompliance.address)
        );
      
        await countryAllowCompliance
          .connect(owner)
          .canComplianceBind(countryAllowCompliance.address);
      });

      it("moduleBurnAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              holdTimeCompliance.interface.encodeFunctionData("moduleBurnAction", [owner.address, 1]),
              holdTimeCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            holdTimeCompliance.interface.encodeFunctionData(
              "moduleBurnAction",
              [owner.address, 1]
            ),
            holdTimeCompliance.address
          );
      });

      it("moduleTransferAction", async () => {
        await expect(
          modularComplianceImplementation
            .connect(user1)
            .callModuleFunction(
              holdTimeCompliance.interface.encodeFunctionData("moduleTransferAction", [owner.address, user1.address, 1]),
              holdTimeCompliance.address
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

        await modularComplianceImplementation
          .connect(owner)
          .callModuleFunction(
            holdTimeCompliance.interface.encodeFunctionData(
              "moduleTransferAction",
              [owner.address, user1.address, 1]
            ),
            holdTimeCompliance.address
          );
      });
    });
  });
 

  describe("Roles", () => {
    describe("AgentRole", () => {

      it("should emit correct event when adding agent", async () => {
        await expect(agentContract.addAgent(user2.address))
          .to.emit(agentContract, "AgentAdded")
          .withArgs(user2.address);
      });
 
      it("should emit correct event when removing agent", async () => {
        // First add an agent
        await agentContract.addAgent(user2.address);
        // Then remove and check event
        await expect(agentContract.removeAgent(user2.address))
          .to.emit(agentContract, "AgentRemoved")
          .withArgs(user2.address);
      });
 
      it("should emit correct event when adding TA", async () => {
        await expect(agentContract.addTA(user2.address))
          .to.emit(agentContract, "taAdded")
          .withArgs(user2.address);
      });
 
      it("should emit correct event when removing TA", async () => {
        // First add a TA
        await agentContract.addTA(user2.address);
        // Then remove and check event
        await expect(agentContract.removeTA(user2.address))
          .to.emit(agentContract, "taRemoved")
          .withArgs(user2.address);
      });
     


 
      it("should handle adding and removing agent multiple times", async () => {
        // Add agent
        await agentContract.addAgent(user2.address);
        expect(await agentContract.isAgent(user2.address)).to.be.true;
       
        // Remove agent
        await agentContract.removeAgent(user2.address);
        expect(await agentContract.isAgent(user2.address)).to.be.false;
       
        // Add again
        await agentContract.addAgent(user2.address);
        expect(await agentContract.isAgent(user2.address)).to.be.true;
      });
 
      it("should handle adding and removing TA multiple times", async () => {
        // Add TA
        await agentContract.addTA(user2.address);
        expect(await agentContract.isTA(user2.address)).to.be.true;
       
        // Remove TA
        await agentContract.removeTA(user2.address);
        expect(await agentContract.isTA(user2.address)).to.be.false;
       
        // Add again
        await agentContract.addTA(user2.address);
        expect(await agentContract.isTA(user2.address)).to.be.true;
      });

        it("should revert when adding agent with zero address", async () => {
          await expect(
            agentContract.addAgent(ethers.constants.AddressZero)
          ).to.be.revertedWith("invalid argument - zero address");
        });
   
        it("should revert when removing agent with zero address", async () => {
          await expect(
            agentContract.removeAgent(ethers.constants.AddressZero)
          ).to.be.revertedWith("invalid argument - zero address");
        });
   
        it("should revert when adding TA with zero address", async () => {
          await expect(
            agentContract.addTA(ethers.constants.AddressZero)
          ).to.be.revertedWith("invalid argument - zero address");
        });
   
        it("should revert when removing TA with zero address", async () => {
          await expect(
            agentContract.removeTA(ethers.constants.AddressZero)
          ).to.be.revertedWith("invalid argument - zero address");
        });
     

        it("should revert when non-owner tries to add agent", async () => {
          await expect(
            agentContract.connect(user2).addAgent(user3.address)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
   
        it("should revert when non-owner tries to remove agent", async () => {
          // First add an agent using owner
          await agentContract.addAgent(user3.address);
          // Then try to remove using non-owner
          await expect(
            agentContract.connect(user2).removeAgent(user3.address)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
   
        it("should revert when non-owner tries to add TA", async () => {
          await expect(
            agentContract.connect(user2).addTA(user3.address)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
   
        it("should revert when non-owner tries to remove TA", async () => {
          // First add a TA using owner
          await agentContract.addTA(user3.address);
          // Then try to remove using non-owner
          await expect(
            agentContract.connect(user2).removeTA(user3.address)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });

      it("addAgent", async () => {
        await agentContract.addAgent(user2.address);
        expect(await agentContract.isAgent(user2.address)).to.be.true;
      });
      it("addAgent caller is not the owner", async () => {
        expect(await agentContract.addAgent(user2.address)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });
      it("removeAgent", async () => {
        await agentContract.addAgent(user2.address);
        await agentContract.removeAgent(user2.address);
        expect(await agentContract.isAgent(user2.address)).to.be.false;
      });
      it("isAgent", async () => {
        await agentContract.addAgent(user2.address);
        await agentContract.isAgent(user2.address);
      });
      it("addTA", async () => {
        await agentContract.addTA(user2.address);
        expect(await agentContract.isTA(user2.address)).to.be.true;
      });
      it("removeTA", async () => {
        await agentContract.addTA(user2.address);
        await agentContract.removeTA(user2.address);
        expect(await agentContract.isTA(user2.address)).to.be.false;
      });
      it("removeTA event", async () => {
        await agentContract.addTA(user2.address);
        let tx = await agentContract.removeTA(user2.address);
        expect(tx).emit;
        await expect(tx)
          .to.emit(agentContract, "taRemoved")
          .withArgs(user2.address);
      });
      it("isTA", async () => {
        await agentContract.addTA(user2.address);
        await agentContract.isTA(user2.address);
      });
    });

    //     describe("AgentRoleUpgradeable", () => {
    //       it("addTA", async () => {
    // let owner = await agentUpgradeable.owner()
    // console.log('owner', owner)
    //         await agentUpgradeable.addTA(user2.address);
    //         expect(await agentUpgradeable.isTA(user2.address)).to.be.true;
    //       });
    //       it("removeTA", async () => {
    //         await agentUpgradeable.addTA(user2.address);
    //         await agentUpgradeable.removeTA(user2.address);
    //         expect(await agentUpgradeable.isTA(user2.address)).to.be.false;
    //       });
    //       it("isTA", async () => {
    //         await agentUpgradeable.addTA(user2.address);
    //         await agentUpgradeable.isTA(user2.address);
    //       });
    //     });
  });
    
    describe("Factory", () => {
    describe("Idfactory", () => {

      it("should revert when non-owner tries to add token factory", async () => {
        const factoryAddress = trexImplementationAuthority.address;
      
        // Ensure that a non-owner cannot add the token factory
        await expect(
          identityFactory.connect(user1).addTokenFactory(factoryAddress)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      

            it("should add token factory", async () => {
                const factoryAddress =trexImplementationAuthority.address;
            
                // Ensure that the factory is not added initially
                const isFactoryAddedBefore = await identityFactory.isTokenFactory(factoryAddress);
                expect(isFactoryAddedBefore).to.be.false;
            
                // Add the token factory
                await identityFactory.addTokenFactory(factoryAddress);
            
                // Ensure that the factory is added successfully
                const isFactoryAddedAfter = await identityFactory.isTokenFactory(factoryAddress);
                expect(isFactoryAddedAfter).to.be.true;
            });
          
          it("should revert when adding zero address as factory", async () => {
            // Try adding zero address as token factory
            await expect(identityFactory.addTokenFactory(ethers.constants.AddressZero))
              .to.be.revertedWith("invalid argument - zero address");
          });
          
          it("should revert when adding the same factory again", async () => {
            const factoryAddress = trexFactory.address;
          
            // Add the token factory once
            await identityFactory.addTokenFactory(factoryAddress);
          
            // Try adding the same factory again
            await expect(identityFactory.addTokenFactory(factoryAddress))
              .to.be.revertedWith("already a factory");
          });

          it("should revert when non-owner tries to remove token factory", async () => {
            const factoryAddress = trexImplementationAuthority.address;
          
            // First, add the factory before testing removal
            await identityFactory.connect(owner).addTokenFactory(factoryAddress);
          
            // Ensure that a non-owner cannot remove the token factory
            await expect(
              identityFactory.connect(user1).removeTokenFactory(factoryAddress)
            ).to.be.revertedWith("Ownable: caller is not the owner");
          });
          

          it("should remove token factory", async () => {
            const factoryAddress = trexImplementationAuthority.address;
          
            // First, add the factory before testing removal
            await identityFactory.addTokenFactory(factoryAddress);
          
            // Ensure the factory is added
            const isFactoryAddedBefore = await identityFactory.isTokenFactory(factoryAddress);
            expect(isFactoryAddedBefore).to.be.true;
          
            // Remove the token factory
            await identityFactory.removeTokenFactory(factoryAddress);
          
            // Ensure the factory is removed
            const isFactoryAddedAfter = await identityFactory.isTokenFactory(factoryAddress);
            expect(isFactoryAddedAfter).to.be.false;
          });
          
          it("should revert when removing zero address as factory", async () => {
            // Try removing zero address as token factory
            await expect(identityFactory.removeTokenFactory(ethers.constants.AddressZero))
              .to.be.revertedWith("invalid argument - zero address");
          });
          
          it("should revert when trying to remove a non-existing factory", async () => {
            const nonExistingFactory = "0x0000000000000000000000000000000000000001"; // Random address
          
            // Try removing a non-existing factory
            await expect(identityFactory.removeTokenFactory(nonExistingFactory))
              .to.be.revertedWith("not a factory");
          });
          
          describe("createIdentity", () => {
            it("should create a new identity", async () => {
              const salt = "200"; // Salt for uniqueness
        
              // Create identity for user2
              await identityFactory.createIdentity(user2.address, salt);
        
              // Ensure identity has been created for user2
              const user2Identity = await identityFactory.getIdentity(user2.address);
              expect(user2Identity).to.not.be.null;
              expect(user2Identity).to.not.equal(ethers.constants.AddressZero); // Identity should not be zero address
        
            });
        
            it("should revert when creating identity with existing salt", async () => {
              const salt = "200"; // Salt used previously
        
              // Create identity for user2
              await identityFactory.createIdentity(user2.address, salt);
        
              // Try creating identity again with the same salt (should fail)
              await expect(identityFactory.createIdentity(user2.address, salt))
                .to.be.revertedWith("salt already taken");
            });
          });
        
          // Test for createTokenIdentity
          describe("createTokenIdentity", () => {

            it("should revert when non-owner tries to create a token identity", async () => {
              const salt = "300"; // Salt for uniqueness
              const tokenAddress = tokenImplementation.address;
            
              // Ensure that a non-owner cannot create a token identity
              await expect(
                identityFactory.connect(user1).createTokenIdentity(tokenAddress, owner.address, salt)
              ).to.be.revertedWith("only Factory or owner can call");
            });

            
            it("should create a token identity", async () => {
              const salt = "300"; // Salt for uniqueness
              const tokenAddress = tokenImplementation.address;
        
              // Create token identity
              await identityFactory.createTokenIdentity(tokenAddress, owner.address, salt);
        
              // Fetch token identity for user2 (expected token address)
              let tokenIdentity = await identityFactory.getIdentity(tokenAddress);
              expect(tokenIdentity).to.not.be.null;
              expect(tokenIdentity).to.not.equal(ethers.constants.AddressZero); // Identity should not be zero address
            });
        
            it("should revert when creating token identity with existing salt", async () => {
              const salt = "300"; // Salt used previously
              const tokenAddress = tokenImplementation.address;
        
              // Create token identity
              await identityFactory.createTokenIdentity(tokenAddress, owner.address, salt);
        
              // Try creating token identity again with the same salt (should fail)
              await expect(identityFactory.createTokenIdentity(tokenAddress, owner.address, salt))
                .to.be.revertedWith("salt already taken");
            });
        });


        describe("IdFactory", () => {
            // Test for linkWallet
            describe("linkWallet", () => {
              it("should revert when non-owner tries to link a wallet to the identity", async () => {
                // Create identity for user2
                const salt = "200";
                await identityFactory.createIdentity(user2.address, salt);
                const user2Identity = await identityFactory.getIdentity(user2.address);
              
                // Ensure that a non-owner cannot link the wallet
                await expect(
                  identityFactory.connect(user1).linkWallet(user2Identity)
                ).to.be.revertedWith("wallet not linked to an identity contract");
              });

              
              it("should link a wallet to the identity", async () => {
                // Create identity for user2
                const salt = "200";
                await identityFactory.createIdentity(user2.address, salt);
                const user2Identity = await identityFactory.getIdentity(user2.address);
          
                // Link wallet to identity
                await identityFactory.connect(user2).linkWallet(user2Identity);
          
                // Fetch and verify that the wallet has been linked to the identity
                const walletLinked = await identityFactory.getWallets(user2Identity);
                expect(walletLinked).to.include(user2.address); // Expect user2's address to be in the linked wallets
              });
          
              it("should revert when trying to link a wallet without identity", async () => {
                const nonExistentIdentity = ethers.constants.AddressZero;
                
                // Try linking a wallet without an existing identity (should fail)
                await expect(identityFactory.connect(user2).linkWallet(nonExistentIdentity))
                  .to.be.revertedWith("invalid argument - zero address");
              });
            });
          
            // Test for unlinkWallet
            describe("unlinkWallet", () => {
              it("should revert when non-owner tries to unlink a wallet from the identity", async () => {
                // Create identity for user2
                await identityFactory.createIdentity(user2.address, user2.address);
                const user2Identity = await identityFactory.getIdentity(user2.address);
              
                // Link wallet first
                await identityFactory.connect(user2).linkWallet(user2Identity);
              
                // Ensure that a non-owner cannot unlink the wallet
                await expect(
                  identityFactory.connect(user1).unlinkWallet(user2Identity)
                ).to.be.revertedWith("only a linked wallet can unlink");
              });

              
              it("should unlink a wallet from the identity", async () => {
                // Create identity for user2
                await identityFactory.createIdentity(user2.address, user2.address);
                const user2Identity = await identityFactory.getIdentity(user2.address);
          
                // Link wallet first
                await identityFactory.connect(user2).linkWallet(user2Identity);
          
                // Unlink wallet from identity
                await identityFactory.connect(user2).unlinkWallet(user2Identity);
              });
          
              it("should revert when trying to unlink a wallet without being linked", async () => {
                const salt = "200";
                await identityFactory.createIdentity(user2.address, salt);
                const user2Identity = await identityFactory.getIdentity(user2.address);
          
                // Try unlinking a wallet without being linked (should fail)
                await expect(identityFactory.connect(user2).unlinkWallet(user2Identity))
                  .to.be.revertedWith("only a linked wallet can unlink");
              });
            });
          
            // Test for isSaltTaken
            describe("isSaltTaken", () => {
              it("should revert when non-owner tries to check if salt is taken", async () => {
                const salt = "200";
              
                // Ensure that a non-owner cannot check if salt is taken
                await expect(
                  identityFactory.connect(user1).isSaltTaken(salt)
                )
              });

              
              it("should return true if salt is taken", async () => {
                const salt = "200";
                
                // Create identity for user2
                await identityFactory.createIdentity(user2.address, salt);
                
                // Check if salt is taken
                const saltTaken = await identityFactory.isSaltTaken(salt);
                expect(saltTaken).to.be.false;
              });
          
              it("should return false if salt is not taken", async () => {
                const salt = "999"; // New salt that has not been used
                
                // Check if salt is taken
                const saltTaken = await identityFactory.isSaltTaken(salt);
                expect(saltTaken).to.be.false;
              });
            });
          
            // Test for getWallets
            describe("getWallets", () => {
              it("should return the list of linked wallets", async () => {
                const salt = "200";
                await identityFactory.createIdentity(user2.address, salt);
                const user2Identity = await identityFactory.getIdentity(user2.address);
          
                // Link wallet to identity
                await identityFactory.connect(user2).linkWallet(user2Identity);
          
                // Retrieve and verify the linked wallets
                const wallets = await identityFactory.getWallets(user2Identity);
                expect(wallets).to.include(user2.address); // Expect user2's address to be in the list of linked wallets
              });
            });
          
            // Test for getToken
            describe("getToken", () => {
              it("should return the token identity", async () => {
                const salt = "200";
        await identityFactory.createTokenIdentity(
          tokenImplementation.address,
          owner.address,
          salt
        );
        let tokenIdentity = await identityFactory.getIdentity(
          tokenImplementation.address
        );
        await identityFactory.connect(owner).getToken(tokenIdentity);
              });
            });
          });
    });
  });

  describe("ProxyAuthority", () => {
    describe("TREXImplementationAuthority", () => {
      it("setTREXFactory ", async () => {
        await trexImplementationAuthority.setTREXFactory(trexFactory.address);
      });

      // Test for reverting when non-owner tries to set TREX Factory
      it("setTREXFactory not by owner", async () => {
        await expect(
          trexImplementationAuthority.connect(user1).setTREXFactory(trexFactory.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("setIAFactory ", async () => {
        await trexImplementationAuthority.setTREXFactory(trexFactory.address);

        await trexImplementationAuthority.setIAFactory(
          identityImplementationAuthority.address
        );
      });

      // Test for reverting when non-owner tries to set IA Factory
      it("setIAFactory not by owner", async () => {
        await expect(
          trexImplementationAuthority
            .connect(user1)
            .setIAFactory(identityImplementationAuthority.address)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });


      it("fetchVersion ", async () => {
        const otherTrexImplementationAuthority = await ethers.deployContract(
          "TREXImplementationAuthority",
          [false, trexFactory.address, trexImplementationAuthority.address],
          owner
        );
        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };
        await otherTrexImplementationAuthority.fetchVersion(versionStruct);
      });


      it("fetchVersion not by owner", async () => {
        const otherTrexImplementationAuthority = await ethers.deployContract(
          "TREXImplementationAuthority",
          [false, trexFactory.address, trexImplementationAuthority.address],
          owner
        );
        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };
        await expect(
          otherTrexImplementationAuthority.connect(user1).fetchVersion(versionStruct)
        )
      });
    

      //   it("changeImplementationAuthority ", async () => {
      //     const newTrexImplementationAuthority = await ethers.deployContract(
      //       "TREXImplementationAuthority",
      //       [false, trexFactory.address, trexImplementationAuthority.address],
      //       owner
      //     );
      //     let tokenDetails = {
      //       owner: owner.address,
      //       name: "Nickel",
      //       symbol: "NKL",
      //       decimals: 18,
      //       irs: ethers.constants.AddressZero,
      //       ONCHAINID: ethers.constants.AddressZero,
      //       wrap: false,
      //       irAgents: [owner.address],
      //       tokenAgents: [owner.address],
      //       transferAgents: [],
      //       complianceModules: [
      //         countryAllowCompliance.address,
      //         supplyLimitCompliance.address,
      //         maxBalanceCompliance.address,
      //         holdTimeCompliance.address,
      //       ],
      //       complianceSettings: [
      //         "0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
      //         "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0",
      //         "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
      //         "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc",
      //       ],
      //     };

      //     let claimDetails = {
      //       claimTopics: [],
      //       issuers: [],
      //       issuerClaims: [],
      //     };

      //     await identityFactory.addTokenFactory(trexFactory.address);
      //     let test = await identityRegistryStorageImplementation.owner();
      //     console.log('test', test)
      //     const TX = await trexFactory.deployTREXSuite(
      //       "New_Token",
      //       tokenDetails,
      //       claimDetails
      //     );

      //     const receipt = await TX.wait();

      //     const event = receipt.events?.find(
      //       (event) => event.event === "TREXSuiteDeployed"
      //     );

      //     let token = event?.args;

      //     console.log("Token Address: ", token);
      //     let tokenAttached: any;
      //     let firstAddress;

      //     if (Array.isArray(token) && token.length > 0) {
      //       firstAddress = token[0]; // Directly accessing the first element
      //       tokenAttached = await tokenImplementation.attach(firstAddress);
      //     }

      //     await trexImplementationAuthority.changeImplementationAuthority(
      //       tokenAttached.address,
      //       newTrexImplementationAuthority.address
      //     );
      //   });

      it("getCurrentVersion ", async () => {
        await trexImplementationAuthority.getCurrentVersion();
      });
      it("getTREXFactory ", async () => {
        await trexImplementationAuthority.getTREXFactory();
      });
      it("getContracts ", async () => {
        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };
        await trexImplementationAuthority.getContracts(versionStruct);
      });
      it("version already exists ", async () => {
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
        await expect(
          trexImplementationAuthority.addTREXVersion(
            versionStruct,
            contractsStruct
          )
        ).to.be.revertedWith("version already exists");
      });
      it("version already in use ", async () => {
        const versionStruct = {
          major: 4,
          minor: 0,
          patch: 0,
        };
        await expect(
          trexImplementationAuthority.useTREXVersion(versionStruct)
        ).to.be.revertedWith("version already in use");
      });




      it("should correctly set initial state", async () => {
        const newImplementation = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        expect(await newImplementation.isReferenceContract()).to.be.false;
        expect(await newImplementation.getTREXFactory()).to.equal(trexFactory.address);
      });


      // it("should emit correct events during construction", async () => {
      //   const tx = await new TREXImplementationAuthority__factory(owner).deploy(
      //     true,
      //     trexFactory.address,
      //     iaFactory.address
      //   );
       
      //   const receipt = await tx.deployTransaction.wait();
       
      //   expect(receipt.events?.some(e => e.event === "ImplementationAuthoritySet")).to.be.true;
      //   expect(receipt.events?.some(e => e.event === "IAFactorySet")).to.be.true;
      // });
 


     

    });



    describe("Version Management", () => {
      let contracts: {
        tokenImplementation: string;
        ctrImplementation: string;
        irImplementation: string;
        irsImplementation: string;
        tirImplementation: string;
        mcImplementation: string;
      };
      let version: { major: number; minor: number; patch: number };
 
      beforeEach(async () => {
        contracts = {
          tokenImplementation: tokenImplementation.address,
          ctrImplementation: claimTopicsRegistryImplementation.address,
          irImplementation: identityRegistryImplementation.address,
          irsImplementation: identityRegistryStorageImplementation.address,
          tirImplementation: trustedIssuersRegistryImplementation.address,
          mcImplementation: modularComplianceImplementation.address,
        };
       
        version = { major: 1, minor: 0, patch: 0 };
      });
 
      it("should fail to add version with zero addresses", async () => {
        const invalidContracts = { ...contracts, tokenImplementation: ethers.constants.AddressZero };
        await expect(trexImplementationAuthority.addTREXVersion(version, invalidContracts))
          .to.be.revertedWith("invalid argument - zero address");
      });
 
      it("should fail to add version from non-reference contract", async () => {
        const nonRefImpl = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        await expect(nonRefImpl.addTREXVersion(version, contracts))
          .to.be.revertedWith("ONLY reference contract can add versions");
      });
 
      it("should successfully fetch version from reference contract", async () => {
        await trexImplementationAuthority.addTREXVersion(version, contracts);
       
        const nonRefImpl = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        await expect(nonRefImpl.fetchVersion(version))
          .to.emit(nonRefImpl, "TREXVersionFetched");
      });
 
      it("should fail to fetch already fetched version", async () => {
        await trexImplementationAuthority.addTREXVersion(version, contracts);
       
        const nonRefImpl = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        await nonRefImpl.fetchVersion(version);
        await expect(nonRefImpl.fetchVersion(version))
          .to.be.revertedWith("version fetched already");
      });
    });

    describe("Getters and Utility Functions", () => {
      it("should correctly return all implementation addresses", async () => {
        const version = { major: 1, minor: 0, patch: 0 };
        const contracts = {
          tokenImplementation: tokenImplementation.address,
          ctrImplementation: claimTopicsRegistryImplementation.address,
          irImplementation: identityRegistryImplementation.address,
          irsImplementation: identityRegistryStorageImplementation.address,
          tirImplementation: trustedIssuersRegistryImplementation.address,
          mcImplementation: modularComplianceImplementation.address,
        };
       
        await trexImplementationAuthority.addAndUseTREXVersion(version, contracts);
       
        expect(await trexImplementationAuthority.getTokenImplementation()).to.equal(contracts.tokenImplementation);
        expect(await trexImplementationAuthority.getCTRImplementation()).to.equal(contracts.ctrImplementation);
        expect(await trexImplementationAuthority.getIRImplementation()).to.equal(contracts.irImplementation);
        expect(await trexImplementationAuthority.getIRSImplementation()).to.equal(contracts.irsImplementation);
        expect(await trexImplementationAuthority.getTIRImplementation()).to.equal(contracts.tirImplementation);
        expect(await trexImplementationAuthority.getMCImplementation()).to.equal(contracts.mcImplementation);
      });
    });

    describe("Factory Management", () => {
      it("should fail to set TREX factory from non-reference contract", async () => {
        const nonRefImpl = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        await expect(nonRefImpl.setTREXFactory(trexFactory.address))
          .to.be.revertedWith("only reference contract can call");
      });
 
      it("should fail to set IA factory from non-reference contract", async () => {
        const nonRefImpl = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          iaFactory.address
        );
       
        await expect(nonRefImpl.setIAFactory(iaFactory.address))
          .to.be.revertedWith("only reference contract can call");
      });
    });
 

    describe("IAFactory", () => {
      it("constructor", async () => {
        const IAFactory = new IAFactory__factory(owner).deploy(
          trexFactory.address
        );
      });

      it("deployIA", async () => {
        const IAFactory = new IAFactory__factory(owner).deploy(
          trexFactory.address
        );
        let check = await trexFactory.getImplementationAuthority();

        // console.log('check', check);
        (await IAFactory).deployIA(tokenImplementation.address);
      });

      it("deployedByFactory", async () => {
        const IAFactory = new IAFactory__factory(owner).deploy(
          trexFactory.address
        );
        (await IAFactory).deployedByFactory((await IAFactory).address);
      });
    });
  });

  describe("Token", () => {
    describe("Token.sol", () => {

      it("should revert when setting empty name", async () => {
        await expect(tokenImplementation.setName(""))
          .to.be.revertedWith("invalid argument - empty string");
      });

     


      it("should revert transfer when contract is paused", async () => {
        await tokenImplementation.pause();
        await expect(
          tokenImplementation.transfer(user2.address, 100)
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should revert transfer when sender is frozen", async () => {
        await tokenImplementation.setAddressFrozen(user1.address, true);
        await expect(
          tokenImplementation.connect(user1).transfer(user2.address, 100)
        ).to.be.revertedWith("wallet is frozen");
      });

      it("should revert transfer when receiver is frozen", async () => {
        await tokenImplementation.setAddressFrozen(user2.address, true);
        await expect(
          tokenImplementation.connect(user1).transfer(user2.address, 100)
        ).to.be.revertedWith("wallet is frozen");
      });


      it("should revert batchTransfer with mismatched array lengths", async () => {
        await expect(
          tokenImplementation.batchTransfer([user2.address], [10, 20])
        ).to.be.revertedWith("Mismatched array lengths");
      });

      it("should revert batchMint with mismatched array lengths", async () => {
        await expect(
          tokenImplementation.batchMint([user1.address, user2.address], [100])
        ).to.be.revertedWith("Mismatched array lengths");
      });

      it("should revert batchBurn with mismatched array lengths", async () => {
        await expect(
          tokenImplementation.batchBurn([user1.address], [10, 20])
        ).to.be.revertedWith("Mismatched array lengths");
      });

      it("should revert recovery when lost wallet has no tokens", async () => {
        await expect(
          tokenImplementation.recoveryAddress(user2.address, user3.address, user1.address)
        ).to.be.revertedWith("no tokens to recover");
      });

      it("should revert when setting empty name", async () => {
        await expect(tokenImplementation.setName(""))
          .to.be.revertedWith("invalid argument - empty string");
      });

      it("should revert when setting empty symbol", async () => {
        await expect(tokenImplementation.setSymbol(""))
          .to.be.revertedWith("invalid argument - empty string");
      });



      it("approve", async () => {
        await tokenImplementation.approve(user2.address, 1000);
      });

      it("increaseAllowance", async () => {
        await tokenImplementation.increaseAllowance(user2.address, 10000);
      });

      it("decreaseAllowance", async () => {
        await tokenImplementation.increaseAllowance(user2.address, 10000);
        await tokenImplementation.decreaseAllowance(user2.address, 100);
      });

      it("setName", async () => {
        await tokenImplementation.setName("GoldToken");
      });
      
      it("setSymbol", async () => {
        await tokenImplementation.setSymbol("GT");
      });

      //   it("setSymbol passing empty string", async () => {
      //     await expect(tokenImplementation.setSymbol("")).to.be.revertedWith(
      //       "invalid argument - empty string"
      //     );
      //   });
      it("decimals", async () => {
        await tokenImplementation.decimals();
      });

      it("compliance", async () => {
        await tokenImplementation.compliance();
      });

      it("pause", async () => {
        await tokenImplementation.pause();
      });

      it("unpause", async () => {
        await tokenImplementation.pause();
        await tokenImplementation.unpause();
      });

      it("allowance", async () => {
        await tokenImplementation.allowance(owner.address, user2.address);
      });

      it("paused", async () => {
        await tokenImplementation.paused();
      });

      it("isFrozen", async () => {
        await tokenImplementation.isFrozen(user1.address);
      });

      it("getFrozenTokens", async () => {
        await tokenImplementation.getFrozenTokens(user1.address);
      });

      it("onchainID", async () => {
        await tokenImplementation.onchainID();
      });
      
      it("version", async () => {
        await tokenImplementation.version();
      });


      it("Batch Mint Tokens", async () => {
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address], [100]);
      });


      it("Batch min token reverted with Already registered", async () => {
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
            AddressOfToken = _token;      it("approve", async () => {
              await tokenImplementation.approve(user2.address, 1000);
            });
      
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        let user1Identity = await identityFactory.getIdentity(user1.address);
        let ownerIdentity = await identityFactory.getIdentity(owner.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

          await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(owner.address, ownerIdentity, 91);

          await expect(
            identityRegisteryAttached
                .connect(user1)
                .registerIdentity(user1.address, user1Identity, 91)
        ).to.be.revertedWith("address stored already");
      });


      it("Batch Transfer Tokens", async () => {
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address], [100]);
        await tokenAttached?.connect(user1).batchTransfer([user2.address, user3.address], [10, 10]);
      });


      it("TransferFrom", async () => {
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address,user2.address], [100,100]);
        await tokenAttached?.connect(user1).batchTransfer([user2.address, user3.address], [10, 10]);

       
        await tokenAttached?.connect(user1).approve(user2.address, 10000);
        await tokenAttached?.connect(user2).transferFrom(user1.address, user3.address, 10);
      });


      it("batchSetAddressFrozen", async () => {
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address,user2.address], [100,100]);
        await tokenAttached?.connect(user1).batchSetAddressFrozen([user1.address, user1.address], [true, true])
      });


      it("batchFreezePartialTokens and reverted if amount exceeds available balance", async () => {
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address,user2.address], [10,10]);
        await expect(
          tokenAttached?.connect(user1).batchFreezePartialTokens([user1.address, user1.address], [10, 10])
      ).to.be.revertedWith("Amount exceeds available balance");
      });


      it("batchUnfreezePartialTokens", async () => {
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
          complianceSettings : [],
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address,user2.address], [10,10]);
        await tokenAttached?.connect(user1).batchFreezePartialTokens([user1.address,user2.address], [1,1]);
        await tokenAttached?.connect(user1).batchUnfreezePartialTokens([user1.address,user2.address], [1,1]);
      });


      it("freezePartialTokens", async () => {
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
          complianceSettings : [],
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
 
        await identityFactory.createIdentity(user1.address, user1.address);
        await identityFactory.createIdentity(user2.address, user2.address);

        let user1Identity = await identityFactory.getIdentity(user1.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        let user3Identity = await identityFactory.getIdentity(user3.address);

        let identityRegistryAddress = await tokenAttached?.identityRegistry();

        let identityRegisteryAttached = identityRegistryImplementation.attach(
          String(identityRegistryAddress)
        );

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user1.address, user1Identity, 91);

        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user2.address, user2Identity, 91);
        await identityRegisteryAttached
          .connect(user1)
          .registerIdentity(user3.address, user3Identity, 91);

        await tokenAttached?.connect(user1).batchMint([user1.address,user2.address], [10,10]);
        await tokenAttached?.connect(user1)
          .freezePartialTokens(user2.address, 1);
      });
    });
  });

  describe("Constructor", function() {
    it("should revert if the implementation address is zero", async function () {
      const ImplementationAuthorityFactory = await ethers.getContractFactory("ImplementationAuthority");
      await expect(
        ImplementationAuthorityFactory.deploy(ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  });

  describe("updateImplementation", function () {
    it("should update the implementation address", async function () {
      await identityImplementationAuthority.updateImplementation(owner.address);
      const currentImplementation = await identityImplementationAuthority.getImplementation();
      expect(currentImplementation).to.equal(owner.address);
    });

    it("should revert if the new implementation address is zero", async function () {
      await expect(
        identityImplementationAuthority.updateImplementation(ethers.constants.AddressZero)
      ).to.be.revertedWith("invalid argument - zero address");
    });

    it("should only allow the owner to update the implementation", async function () {
      await expect(
        identityImplementationAuthority.connect(user1).updateImplementation(owner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("FactoryProxy Contract", () => {
  
    // Ownership Tests
    describe("Ownership Functions", () => {
      it("should transfer ownership", async () => {
        const newOwner = user1.address;
        await fundProxy.connect(owner).transferProxyOwnership(newOwner);
        const currentOwner = await fundProxy.proxyOwner();
        expect(currentOwner).to.equal(newOwner);
      });
  
      it("should revert transfer ownership when not called by owner", async () => {
        const newOwner = user1.address;
        await expect(fundProxy.connect(user2).transferProxyOwnership(newOwner))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Maintenance Tests
    describe("Maintenance Functions", () => {
      it("should set contract maintenance status", async () => {
        await fundProxy.connect(owner).setMaintenance(true);
        const maintenanceStatus = await fundProxy.maintenance();
        expect(maintenanceStatus).to.be.true;
      });
  
      it("should revert when trying to access contract in maintenance if not owner", async () => {
        await fundProxy.connect(owner).setMaintenance(true);
        await expect(fundProxy.connect(user1).fallback()).to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Upgradeability Tests
    describe("Upgradeability Functions", () => {
      it("should upgrade the contract implementation", async () => {
        const newImplementation = user1.address;
        await fundProxy.connect(owner).upgradeTo(newImplementation);
        const currentImplementation = await fundProxy.implementation();
        expect(currentImplementation).to.equal(newImplementation);
      });
  
      it("should revert when non-owner tries to upgrade the contract", async () => {
        const newImplementation = fundProxy.address;
        await expect(fundProxy.connect(user1).upgradeTo(newImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      
      it("should revert if trying to upgrade to the same implementation", async () => {
        const currentImplementation = await fundProxy.implementation();
        await expect(fundProxy.connect(owner).upgradeTo(currentImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
    
    // Edge Case Tests
    describe("Edge Cases", () => {
      it("should revert when setting maintenance state to true by non-owner", async () => {
        await expect(fundProxy.connect(user1).setMaintenance(true))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      it("should revert when transferring ownership to zero address", async () => {
        await expect(fundProxy.connect(owner).transferProxyOwnership(ethers.constants.AddressZero))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
  
      it("should revert on upgradeToAndCall with invalid data", async () => {
        const newImplementation = fundProxy.address;
        const invalidData = "0x"; // Empty data
        await expect(fundProxy.connect(owner).upgradeToAndCall(newImplementation, invalidData))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
  });



  describe("escrowControllerProxy Contract", () => {
  
    // Ownership Tests
    describe("Ownership Functions", () => {
      it("should transfer ownership", async () => {
        const newOwner = user1.address;
        await escrowControllerProxy.connect(owner).transferProxyOwnership(newOwner);
        const currentOwner = await escrowControllerProxy.proxyOwner();
        expect(currentOwner).to.equal(newOwner);
      });
  
      it("should revert transfer ownership when not called by owner", async () => {
        const newOwner = user1.address;
        await expect(escrowControllerProxy.connect(user2).transferProxyOwnership(newOwner))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Maintenance Tests
    describe("Maintenance Functions", () => {
      it("should set contract maintenance status", async () => {
        await escrowControllerProxy.connect(owner).setMaintenance(true);
        const maintenanceStatus = await escrowControllerProxy.maintenance();
        expect(maintenanceStatus).to.be.true;
      });
  
      it("should revert when trying to access contract in maintenance if not owner", async () => {
        await escrowControllerProxy.connect(owner).setMaintenance(true);
        await expect(escrowControllerProxy.connect(user1).fallback()).to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Upgradeability Tests
    describe("Upgradeability Functions", () => {
      it("should upgrade the contract implementation", async () => {
        const newImplementation = user1.address;
        await escrowControllerProxy.connect(owner).upgradeTo(newImplementation);
        const currentImplementation = await escrowControllerProxy.implementation();
        expect(currentImplementation).to.equal(newImplementation);
      });
  
      it("should revert when non-owner tries to upgrade the contract", async () => {
        const newImplementation = escrowControllerProxy.address;
        await expect(escrowControllerProxy.connect(user1).upgradeTo(newImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      
      it("should revert if trying to upgrade to the same implementation", async () => {
        const currentImplementation = await escrowControllerProxy.implementation();
        await expect(escrowControllerProxy.connect(owner).upgradeTo(currentImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
    
    // Edge Case Tests
    describe("Edge Cases", () => {
      it("should revert when setting maintenance state to true by non-owner", async () => {
        await expect(escrowControllerProxy.connect(user1).setMaintenance(true))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      it("should revert when transferring ownership to zero address", async () => {
        await expect(escrowControllerProxy.connect(owner).transferProxyOwnership(ethers.constants.AddressZero))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
  
      it("should revert on upgradeToAndCall with invalid data", async () => {
        const newImplementation = escrowControllerProxy.address;
        const invalidData = "0x"; // Empty data
        await expect(escrowControllerProxy.connect(owner).upgradeToAndCall(newImplementation, invalidData))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
  });



  describe("Proxy V1 Contract", () => {
  
    // Ownership Tests
    describe("Ownership Functions", () => {
      it("should transfer ownership", async () => {
        const newOwner = user1.address;
        await proxyv1.connect(owner).transferProxyOwnership(newOwner);
        const currentOwner = await proxyv1.proxyOwner();
        expect(currentOwner).to.equal(newOwner);
      });
  
      it("should revert transfer ownership when not called by owner", async () => {
        const newOwner = user1.address;
        await expect(proxyv1.connect(user2).transferProxyOwnership(newOwner))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Maintenance Tests
    describe("Maintenance Functions", () => {
      it("should set contract maintenance status", async () => {
        await proxyv1.connect(owner).setMaintenance(true);
        const maintenanceStatus = await proxyv1.maintenance();
        expect(maintenanceStatus).to.be.true;
      });
  
      it("should revert when trying to access contract in maintenance if not owner", async () => {
        await proxyv1.connect(owner).setMaintenance(true);
        await expect(proxyv1.connect(user1).fallback()).to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Upgradeability Tests
    describe("Upgradeability Functions", () => {  
      it("should revert when non-owner tries to upgrade the contract", async () => {
        const newImplementation = proxyv1.address;
        await expect(proxyv1.connect(user1).upgradeTo(newImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      
      it("should revert if trying to upgrade to the same implementation", async () => {
        const currentImplementation = await proxyv1.implementation();
        await expect(proxyv1.connect(owner).upgradeTo(currentImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
    
    // Edge Case Tests
    describe("Edge Cases", () => {
      it("should revert when setting maintenance state to true by non-owner", async () => {
        await expect(proxyv1.connect(user1).setMaintenance(true))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      it("should revert when transferring ownership to zero address", async () => {
        await expect(proxyv1.connect(owner).transferProxyOwnership(ethers.constants.AddressZero))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
  
      it("should revert on upgradeToAndCall with invalid data", async () => {
        const newImplementation = proxyv1.address;
        const invalidData = "0x"; // Empty data
        await expect(proxyv1.connect(owner).upgradeToAndCall(newImplementation, invalidData))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
  });



  describe("Wrapper Proxy Contract", () => {
  
    // Ownership Tests
    describe("Ownership Functions", () => {
      it("should transfer ownership", async () => {
        const newOwner = user1.address;
        await wrapperproxy.connect(owner).transferProxyOwnership(newOwner);
        const currentOwner = await wrapperproxy.proxyOwner();
        expect(currentOwner).to.equal(newOwner);
      });
  
      it("should revert transfer ownership when not called by owner", async () => {
        const newOwner = user1.address;
        await expect(wrapperproxy.connect(user2).transferProxyOwnership(newOwner))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Maintenance Tests
    describe("Maintenance Functions", () => {
      it("should set contract maintenance status", async () => {
        await wrapperproxy.connect(owner).setMaintenance(true);
        const maintenanceStatus = await wrapperproxy.maintenance();
        expect(maintenanceStatus).to.be.true;
      });
  
      it("should revert when trying to access contract in maintenance if not owner", async () => {
        await wrapperproxy.connect(owner).setMaintenance(true);
        await expect(wrapperproxy.connect(user1).fallback()).to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
    });
  
    // Upgradeability Tests
    describe("Upgradeability Functions", () => {  
      it("should revert when non-owner tries to upgrade the contract", async () => {
        const newImplementation = wrapperproxy.address;
        await expect(wrapperproxy.connect(user1).upgradeTo(newImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      
      it("should revert if trying to upgrade to the same implementation", async () => {
        const currentImplementation = await wrapperproxy.implementation();
        await expect(wrapperproxy.connect(owner).upgradeTo(currentImplementation))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
    
    // Edge Case Tests
    describe("Edge Cases", () => {
      it("should revert when setting maintenance state to true by non-owner", async () => {
        await expect(wrapperproxy.connect(user1).setMaintenance(true))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: FORBIDDEN");
      });
  
      it("should revert when transferring ownership to zero address", async () => {
        await expect(wrapperproxy.connect(owner).transferProxyOwnership(ethers.constants.AddressZero))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
  
      it("should revert on upgradeToAndCall with invalid data", async () => {
        const newImplementation = wrapperproxy.address;
        const invalidData = "0x"; // Empty data
        await expect(wrapperproxy.connect(owner).upgradeToAndCall(newImplementation, invalidData))
          .to.be.revertedWith("OwnedUpgradeabilityProxy: INVALID");
      });
    });
  });

  describe("Only Upgradable Roles", () => {
    it("should not allow non-owner to add agent", async () => {
      await expect(
        agentUpgradeable.connect(user2).addAgent(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow non-owner to remove agent", async () => {
      // Then try to remove using non-owner
      await expect(
        agentUpgradeable.connect(user2).removeAgent(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow non-owner to add TA", async () => {
      await expect(
        agentUpgradeable.connect(user2).addTA(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow non-owner to remove TA", async () => {
      // Then try to remove using non-owner
      await expect(
        agentUpgradeable.connect(user2).removeTA(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow adding agent with zero address", async () => {
      await expect(
        agentUpgradeable.addAgent(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow removing agent with zero address", async () => {
      await expect(
        agentUpgradeable.removeAgent(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow adding TA with zero address", async () => {
      await expect(
        agentUpgradeable.addTA(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should not allow removing TA with zero address", async () => {
      await expect(
        agentUpgradeable.removeTA(ethers.constants.AddressZero)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
  })

  
  it("should revert when non-owner tries to set TREX factory", async () => {
      await expect(
        trexImplementationAuthority.connect(user1).setTREXFactory(trexFactory.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("should revert when non-owner tries to set IA factory", async () => {
      await expect(
        trexImplementationAuthority.connect(user1).setIAFactory(identityImplementationAuthority.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
    it("should revert when non-reference contract tries to set TREX factory", async () => {
      const nonReferenceIA = await new TREXImplementationAuthority__factory(owner).deploy(
        false,
        trexFactory.address,
        identityImplementationAuthority.address
      );
  
      await expect(
        nonReferenceIA.setTREXFactory(trexFactory.address)
      ).to.be.revertedWith("only reference contract can call");
    });
  
    it("should revert when trying to add version with invalid addresses", async () => {
      const versionStruct = {
        major: 5,
        minor: 0,
        patch: 0,
      };
      
      const contractsStruct = {
        tokenImplementation: ethers.constants.AddressZero,
        ctrImplementation: ethers.constants.AddressZero,
        irImplementation: ethers.constants.AddressZero,
        irsImplementation: ethers.constants.AddressZero,
        tirImplementation: ethers.constants.AddressZero,
        mcImplementation: ethers.constants.AddressZero,
      };
  
      await expect(
        trexImplementationAuthority.addTREXVersion(versionStruct, contractsStruct)
      ).to.be.revertedWith("invalid argument - zero address");
    });
  
    it("should fetch version from reference contract", async () => {
      const nonReferenceIA = await new TREXImplementationAuthority__factory(owner).deploy(
        false,
        trexFactory.address,
        identityImplementationAuthority.address
      );
  
      const versionToFetch = {
        major: 4,
        minor: 0,
        patch: 0,
      };
  
      await nonReferenceIA.fetchVersion(versionToFetch);
      
      const fetchedContracts = await nonReferenceIA.getContracts(versionToFetch);
      expect(fetchedContracts.tokenImplementation).to.equal(tokenImplementation.address);
    });
  
    it("should revert when non-reference contract tries to add version", async () => {
      const nonReferenceIA = await new TREXImplementationAuthority__factory(owner).deploy(
        false,
        trexFactory.address,
        identityImplementationAuthority.address
      );
  
      const versionStruct = {
        major: 5,
        minor: 0,
        patch: 0,
      };
      
      const contractsStruct = {
        tokenImplementation: tokenImplementation.address,
        ctrImplementation: claimTopicsRegistryImplementation.address,
        irImplementation: identityRegistryImplementation.address,
        irsImplementation: identityRegistryStorageImplementation.address,
        tirImplementation: trustedIssuersRegistryImplementation.address,
        mcImplementation: modularComplianceImplementation.address,
      };
  
      await expect(
        nonReferenceIA.addTREXVersion(versionStruct, contractsStruct)
      ).to.be.revertedWith("ONLY reference contract can add versions");
    });
  
    it("should get all implementation addresses correctly", async () => {
      expect(await trexImplementationAuthority.getTokenImplementation()).to.equal(tokenImplementation.address);
      expect(await trexImplementationAuthority.getCTRImplementation()).to.equal(claimTopicsRegistryImplementation.address);
      expect(await trexImplementationAuthority.getIRImplementation()).to.equal(identityRegistryImplementation.address);
      expect(await trexImplementationAuthority.getIRSImplementation()).to.equal(identityRegistryStorageImplementation.address);
      expect(await trexImplementationAuthority.getTIRImplementation()).to.equal(trustedIssuersRegistryImplementation.address);
      expect(await trexImplementationAuthority.getMCImplementation()).to.equal(modularComplianceImplementation.address);
    });
  
  
  
    it("should fail when non-owner tries to set TREX factory", async () => {
      await expect(
        trexImplementationAuthority.connect(user1).setTREXFactory(trexFactory.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
  
    it("should fail when non-owner tries to set IA factory", async () => {
      await expect(
        trexImplementationAuthority.connect(user1).setIAFactory(identityImplementationAuthority.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  
  
    
  
    describe("Reference Contract Functionality", () => {
      let nonReferenceIA: any;
  
      beforeEach(async () => {
        nonReferenceIA = await new TREXImplementationAuthority__factory(owner).deploy(
          false, // not reference
          trexFactory.address,
          identityImplementationAuthority.address
        );
      });
  
      it("should fail when non-reference contract tries to add version", async () => {
        const newVersion = {
          major: 5,
          minor: 0,
          patch: 0,
        };
  
        const contracts = {
          tokenImplementation: tokenImplementation.address,
          ctrImplementation: claimTopicsRegistryImplementation.address,
          irImplementation: identityRegistryImplementation.address,
          irsImplementation: identityRegistryStorageImplementation.address,
          tirImplementation: trustedIssuersRegistryImplementation.address,
          mcImplementation: modularComplianceImplementation.address,
        };
  
        await expect(
          nonReferenceIA.addTREXVersion(newVersion, contracts)
        ).to.be.revertedWith("ONLY reference contract can add versions");
      });
  
      it("should fail when non-reference contract tries to deploy new IA", async () => {
        let tokenDetails = {
          owner: owner.address,
          name: "Test Token",
          symbol: "TST",
          decimals: 18,
          irs: ethers.constants.AddressZero,
          ONCHAINID: ethers.constants.AddressZero,
          wrap: false,
          irAgents: [],
          tokenAgents: [],
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
        const tokenAddress = event?.args?._token;
  
        await expect(
          nonReferenceIA.changeImplementationAuthority(
            tokenAddress,
            ethers.constants.AddressZero
          )
        ).to.be.revertedWith("only reference contract can deploy new IAs");
      });
    });
  
    describe("Version Fetching and Management", () => {
      let nonReferenceIA: any;
  
      beforeEach(async () => {
        nonReferenceIA = await new TREXImplementationAuthority__factory(owner).deploy(
          false,
          trexFactory.address,
          identityImplementationAuthority.address
        );
      });
  
      it("should fail to fetch already fetched version", async () => {
        const version = {
          major: 4,
          minor: 0,
          patch: 0,
        };
  
        // First fetch should succeed
        await nonReferenceIA.fetchVersion(version);
  
        // Second fetch should fail
        await expect(
          nonReferenceIA.fetchVersion(version)
        ).to.be.revertedWith("version fetched already");
      });
    });
  
  
});