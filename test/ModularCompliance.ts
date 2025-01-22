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

describe(" Tokenization Testing ", function () { let signers: SignerWithAddress[]; let owner: SignerWithAddress; let tokenIssuer: SignerWithAddress; let transferAgent: SignerWithAddress; let user1: SignerWithAddress; let user2: SignerWithAddress; let user3: SignerWithAddress;

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
let AddressOfToken:any;


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
    await escrow.connect(owner).init([usdc.address, usdt.address],fundFactory.address);


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
});


  describe("bindToken", function () {
    it("should allow the owner to bind the token", async function () {
        await modularComplianceImplementation.init();
      // Bind the token using the owner
      await modularComplianceImplementation.bindToken(AddressOfToken);

      // Check if the token is bound
      const tokenBound = await modularComplianceImplementation.getTokenBound();
      expect(tokenBound).to.equal(AddressOfToken);
    });

    it("should not allow a non-owner or non-token address to bind the token", async function () {
        await modularComplianceImplementation.init();
      // Attempt to bind token from a non-owner and non-token address
      await expect(modularComplianceImplementation.connect(user1).bindToken(AddressOfToken))
        .to.be.revertedWith("only owner or token can call");
    });

    it("should revert when trying to bind a zero address", async function () {
      // Try binding a zero address
      await modularComplianceImplementation.init();
      await expect(modularComplianceImplementation.bindToken("0x0000000000000000000000000000000000000000"))
        .to.be.revertedWith("invalid argument - zero address");
    });

    it("should emit TokenBound event when binding is successful", async function () {
        await modularComplianceImplementation.init();
      await expect(modularComplianceImplementation.bindToken(AddressOfToken))
        .to.emit(modularComplianceImplementation, "TokenBound")
        .withArgs(AddressOfToken);
    });
  });


  describe("unbindToken", function () {
    it("should allow the owner to unbind the token", async function () {
      // Initialize the ModularCompliance contract
      await modularComplianceImplementation.init();
      
      // Bind the token to the compliance contract using the owner
      await modularComplianceImplementation.bindToken(AddressOfToken);

      // Unbind the token using the owner
      await modularComplianceImplementation.unbindToken(AddressOfToken);
  
      // Check if the token is unbound (address should be zero)
      const tokenBound = await modularComplianceImplementation.getTokenBound();
      expect(tokenBound).to.equal(ethers.constants.AddressZero);
    });
  
    it("should not allow a non-owner or non-token address to unbind the token", async function () {
        await modularComplianceImplementation.init();
        await modularComplianceImplementation.bindToken(AddressOfToken);

      // Attempt to unbind the token from a non-owner and non-token address
      await expect(modularComplianceImplementation.connect(user1).unbindToken(AddressOfToken))
        .to.be.revertedWith("only owner or token can call");
    });
  
    it("should revert when trying to unbind a token that is not bound", async function () {
      // Unbind the token first
      await modularComplianceImplementation.init();
        await modularComplianceImplementation.bindToken(AddressOfToken);
      await modularComplianceImplementation.unbindToken(AddressOfToken);
  
      // Try to unbind the token again (which is not bound anymore)
      await expect(modularComplianceImplementation.unbindToken(AddressOfToken))
        .to.be.revertedWith("This token is not bound");
    });
  });


  describe("addModule", function () {  
    it("should not allow a non-owner to add a module", async function () {
        await modularComplianceImplementation.init();
      // Attempt to add a module from a non-owner address (user1)
      await expect(modularComplianceImplementation.connect(user1).addModule(countryAllowCompliance.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  
    it("should revert when trying to add a zero address", async function () {
        await modularComplianceImplementation.init();
      // Try adding a zero address as a module
      await expect(modularComplianceImplementation.addModule(ethers.constants.AddressZero))
        .to.be.revertedWith("invalid argument - zero address");
    });
  
    it("should revert when trying to add the same module twice", async function () {
        await modularComplianceImplementation.init();
      // Add the module the first time
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);
  
      // Try adding the same module again (this should fail)
      await expect(modularComplianceImplementation.addModule(countryAllowCompliance.address))
        .to.be.revertedWith("module already bound");
    });
  
    it("should emit ModuleAdded event when adding a module", async function () {
        await modularComplianceImplementation.init();
      // Expect the event to be emitted when adding a module
      await expect(modularComplianceImplementation.addModule(countryAllowCompliance.address))
        .to.emit(modularComplianceImplementation, "ModuleAdded")
        .withArgs(countryAllowCompliance.address);
    });
  });


  describe("removeModule", function () {
    it("should allow the owner to remove a module", async function () {
      // Remove the module using the owner
      await modularComplianceImplementation.init();
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);
      await modularComplianceImplementation.removeModule(countryAllowCompliance.address);
  
      // Check if the module is removed (module bound should be false)
      const isModuleBound = await modularComplianceImplementation.isModuleBound(countryAllowCompliance.address);
      expect(isModuleBound).to.be.false;
  
      // Verify that the module is no longer in the modules array
      const modules = await modularComplianceImplementation.getModules();
      expect(modules).to.not.include(countryAllowCompliance.address);
    });
  
    it("should not allow a non-owner to remove a module", async function () {
        await modularComplianceImplementation.init();
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);

      // Attempt to remove the module from a non-owner address (user1)
      await expect(modularComplianceImplementation.connect(user1).removeModule(countryAllowCompliance.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  
    it("should revert when trying to remove a module that is not bound", async function () {
        await modularComplianceImplementation.init();
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);
      // Remove the module first
      await modularComplianceImplementation.removeModule(countryAllowCompliance.address);
  
      // Try removing the same module again (this should fail since it's no longer bound)
      await expect(modularComplianceImplementation.removeModule(countryAllowCompliance.address))
        .to.be.revertedWith("module not bound");
    });
  
    it("should revert when trying to remove a zero address", async function () {
        await modularComplianceImplementation.init();
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);
      // Try removing a zero address as a module
      await expect(modularComplianceImplementation.removeModule(ethers.constants.AddressZero))
        .to.be.revertedWith("invalid argument - zero address");
    });
  
    it("should emit ModuleRemoved event when removing a module", async function () {
        await modularComplianceImplementation.init();
      await modularComplianceImplementation.addModule(countryAllowCompliance.address);
      // Expect the event to be emitted when the module is removed
      await expect(modularComplianceImplementation.removeModule(countryAllowCompliance.address))
        .to.emit(modularComplianceImplementation, "ModuleRemoved")
        .withArgs(countryAllowCompliance.address);
    });
  });


  describe("created", function () {
    it("should allow the token to mint to the specified address", async function () {
      await modularComplianceImplementation.init();
      // Specify the recipient and the value to be minted
      const recipient = owner.address;
      const mintValue = 1000;
      await modularComplianceImplementation.bindToken(owner.address);
  
      // Call the 'created' function
      await modularComplianceImplementation.connect(owner).created(recipient, mintValue);
    });
  
    it("should not allow non-token addresses to call the 'created' function", async function () {
        await modularComplianceImplementation.init();
      // Try to call the 'created' function from a non-token address (user1)
      await expect(modularComplianceImplementation.connect(user1).created(user1.address, 1000))
        .to.be.revertedWith("error : this address is not a token bound to the compliance contract");
    });
  
    it("should revert when trying to mint zero value", async function () {
      // Try minting with a value of zero
      await modularComplianceImplementation.init();
      await modularComplianceImplementation.bindToken(owner.address);
      await expect(modularComplianceImplementation.created(owner.address, 0))
        .to.be.revertedWith("invalid argument - no value mint");
    });
  });
  

  describe("destroyed", function () {
    it("should allow the token to burn the specified amount", async function () {
        await modularComplianceImplementation.init();
        // Specify the recipient and the value to be minted
        const recipient = owner.address;
        const mintValue = 1000;
        await modularComplianceImplementation.bindToken(owner.address);
    
        // Call the 'created' function
        await modularComplianceImplementation.connect(owner).created(recipient, mintValue);

       // Specify the address and the amount to be burned
       const fromAddress = owner.address;
       const burnValue = 1000;
  
      // Call the 'destroyed' function
      await modularComplianceImplementation.connect(owner).destroyed(fromAddress, burnValue);
    });
  
    it("should not allow non-token addresses to call the 'destroyed' function", async function () {
        await modularComplianceImplementation.init();
        // Specify the recipient and the value to be minted
        const recipient = owner.address;
        const mintValue = 1000;
        await modularComplianceImplementation.bindToken(owner.address);
    
        // Call the 'created' function
        await modularComplianceImplementation.connect(owner).created(recipient, mintValue);


      // Try to call the 'destroyed' function from a non-token address (user1)
      await expect(modularComplianceImplementation.connect(user1).destroyed(owner.address, 1000))
        .to.be.revertedWith("error : this address is not a token bound to the compliance contract");
    });
  
    it("should revert when trying to burn zero value", async function () {
        await modularComplianceImplementation.init();
        // Specify the recipient and the value to be minted
        const recipient = owner.address;
        const mintValue = 1000;
        await modularComplianceImplementation.bindToken(owner.address);
    
        // Call the 'created' function
        await modularComplianceImplementation.connect(owner).created(recipient, mintValue);
      // Try burning with a value of zero
      await expect(modularComplianceImplementation.destroyed(owner.address, 0))
        .to.be.revertedWith("invalid argument - no value burn");
    });
  });

  
  describe("ModularCompliance Wrapper Tests", function () {
    it("should allow owner to set wrapper", async function () {
      await modularComplianceImplementation.init();
      await modularComplianceImplementation.setWrapper(wrapper.address, true);

      // Check that the wrapper is set correctly
      expect(await modularComplianceImplementation.getWrapper()).to.equal(wrapper.address);
      expect(await modularComplianceImplementation.isWrapperSet()).to.equal(true);
    });

    it("should allow owner to disable wrapper", async function () {
      await modularComplianceImplementation.init();
      await modularComplianceImplementation.setWrapper(wrapper.address, true);
      expect(await modularComplianceImplementation.isWrapperSet()).to.equal(true);

      // Now disable the wrapper
      await modularComplianceImplementation.setWrapper(wrapper.address, false);

      expect(await modularComplianceImplementation.isWrapperSet()).to.equal(false);
    });

    it("should prevent non-owner from setting wrapper", async function () {
      await modularComplianceImplementation.init();
      await expect(
        modularComplianceImplementation.connect(user1).setWrapper(wrapper.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow zero address as wrapper", async function () {
      await modularComplianceImplementation.init();
      await expect(
        modularComplianceImplementation.setWrapper(ethers.constants.AddressZero, true)
      ).to.be.revertedWith("Zero Address");
    });

    it("should retrieve the wrapper address correctly", async function () {
      await modularComplianceImplementation.init();
      // Set wrapper and check
      await modularComplianceImplementation.setWrapper(wrapper.address, true);
      const storedWrapper = await modularComplianceImplementation.getWrapper();
      expect(storedWrapper).to.equal(wrapper.address);
    });

    it("should revert when setting wrapper to zero address", async function () {
      await modularComplianceImplementation.init();
      await expect(
        modularComplianceImplementation.setWrapper(ethers.constants.AddressZero, true)
      ).to.be.revertedWith("Zero Address");
    });
  });

});