import { expect } from "chai";
import { ethers, network } from "hardhat";

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
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  // const trustSigningKey = ethers.Wallet.createRandom();

  // console.log("claimIssuerSigningKey ", trustSigningKey);

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
  let agentContract: AgentRole;
  let agentUpgradeable: AgentRoleUpgradeable;
  let snapshotId: any;

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
          [1739675128]
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
      });
      it("claimTopic exists", async () => {
        await claimTopicsRegistryImplementation.connect(owner).addClaimTopic(1);
        await expect(
          claimTopicsRegistryImplementation.connect(owner).addClaimTopic(1)
        ).to.be.revertedWith("claimTopic already exists");
      });
      it("removeClaimTopic", async () => {
        await claimTopicsRegistryImplementation
          .connect(owner)
          .removeClaimTopic(1);
      });
      it("removing already removed claimTopic", async () => {
        await claimTopicsRegistryImplementation
          .connect(owner)
          .removeClaimTopic(1);
      });
      it("getClaimTopics", async () => {
        await claimTopicsRegistryImplementation.connect(owner).getClaimTopics();
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
    });
    describe("TrustedIssuerRegistry", () => {
      it("init", async () => {
        await expect(
          trustedIssuersRegistryImplementation.init()
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });

      it("addTrustedIssuer", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
      });
      it("removeTrustedIssuer exists", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .removeTrustedIssuer(owner.address);
      });
      it("getTrustedIssuers", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .getTrustedIssuers();
      });
      it("getTrustedIssuersForClaimTopic", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .getTrustedIssuersForClaimTopic(20);
      });
      it("isTrustedIssuer", async () => {
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .addTrustedIssuer(owner.address, [20]);
        await trustedIssuersRegistryImplementation
          .connect(owner)
          .isTrustedIssuer(owner.address);
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
  });

  describe("Modules", () => {
    describe("MaxBalanceModule", () => {
      // it("initialize", async () => {
      //   await maxBalanceCompliance.connect(owner).initialize();
      // });

      it("Module name", async () => {
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
        await supplyLimitCompliance.connect(owner).name();
      });
      it("getSupplyLimit", async () => {
        await supplyLimitCompliance
          .connect(owner)
          .getSupplyLimit(supplyLimitCompliance.address);
      });
      it("canComplianceBind", async () => {
        await supplyLimitCompliance
          .connect(owner)
          .canComplianceBind(supplyLimitCompliance.address);
      });
      it("moduleBurnAction", async () => {
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
      });
      it("getSupplyLimit", async () => {
        await holdTimeCompliance
          .connect(owner)
          .getHoldTime(holdTimeCompliance.address);
      });
      it("canComplianceBind", async () => {
        await holdTimeCompliance
          .connect(owner)
          .canComplianceBind(holdTimeCompliance.address);
      });
      it("moduleBurnAction", async () => {
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
        await countryAllowCompliance.connect(owner).name();
      });
      it("addAllowedCountry", async () => {
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
        await countryAllowCompliance
          .connect(owner)
          .canComplianceBind(countryAllowCompliance.address);
      });
      it("moduleBurnAction", async () => {
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

    //     describe.only("AgentRoleUpgradeable", () => {
    //       it.only("addTA", async () => {
    // let owner = await agentUpgradeable.owner()
    // console.log('owner', owner)
    //         await agentUpgradeable.addTA(user2.address);
    //         expect(await agentUpgradeable.isTA(user2.address)).to.be.true;
    //       });
    //       it.only("removeTA", async () => {
    //         await agentUpgradeable.addTA(user2.address);
    //         await agentUpgradeable.removeTA(user2.address);
    //         expect(await agentUpgradeable.isTA(user2.address)).to.be.false;
    //       });
    //       it.only("isTA", async () => {
    //         await agentUpgradeable.addTA(user2.address);
    //         await agentUpgradeable.isTA(user2.address);
    //       });
    //     });
  });

  describe("Factory", () => {
    describe("Idfactory", () => {
      it("removeTokenFactory", async () => {
        await identityFactory.addTokenFactory(trexFactory.address);
        await identityFactory.removeTokenFactory(trexFactory.address);
      });
      it("createIdentity", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
      });
      it("createTokenIdentity", async () => {
        const salt = "200";
        await identityFactory.createTokenIdentity(
          tokenImplementation.address,
          owner.address,
          salt
        );
        let user2Identity = await identityFactory.getIdentity(user2.address);
      });
      it("linkWallet", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityFactory.connect(user2).linkWallet(user2Identity);
      });
      it("unlinkWallet", async () => {
        await identityFactory.createIdentity(user2.address, user2.address);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityFactory.connect(user2).linkWallet(user2Identity);
        await identityFactory.connect(user2).unlinkWallet(user2Identity);
      });
      it("isSaltTaken", async () => {
        const salt = "200";
        await identityFactory.createIdentity(user2.address, salt);
        await identityFactory.connect(owner).isSaltTaken(salt);
      });
      it("getWallets", async () => {
        const salt = "200";
        await identityFactory.createIdentity(user2.address, salt);
        let user2Identity = await identityFactory.getIdentity(user2.address);
        await identityFactory.connect(owner).getWallets(user2Identity);
      });
      it("getToken", async () => {
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

  describe("ProxyAuthority", () => {
    describe("TREXImplementationAuthority", () => {
      it("setTREXFactory ", async () => {
        await trexImplementationAuthority.setTREXFactory(trexFactory.address);
      });
      it("setIAFactory ", async () => {
        await trexImplementationAuthority.setTREXFactory(trexFactory.address);

        await trexImplementationAuthority.setIAFactory(
          identityImplementationAuthority.address
        );
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
});
