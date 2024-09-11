import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimIssuer, ClaimIssuer__factory, ClaimTopicsRegistry, ClaimTopicsRegistry__factory, ClaimTopicsRegistryProxy, CountryAllowModule, CountryAllowModule__factory, CountryRestrictModule, CountryRestrictModule__factory, DefaultCompliance, Fund, Fund__factory, FundFactory, FundFactory__factory, HoldTimeModule, HoldTimeModule__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryProxy, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdentityRegistryStorageProxy, IdFactory, IdFactory__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, ProxyV1, ProxyV1__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TokenProxy, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, TrustedIssuersRegistryProxy } from "../typechain-types";
import { Identity } from "../typechain-types/contracts/onchainID";
import { IdentityProxy, ImplementationAuthority } from "../typechain-types/contracts/onchainID/proxy";
import { Identity__factory } from "../typechain-types/factories/contracts/onchainID";
import { ImplementationAuthority__factory } from "../typechain-types/factories/contracts/onchainID/proxy";

describe(" Tokenization Testing ", function () {
    let signer: SignerWithAddress;
    let signers: SignerWithAddress[];
    let owner: SignerWithAddress;
    let tokenIssuer: SignerWithAddress;
    let transferAgent: SignerWithAddress;
    let user1: SignerWithAddress;
    let sponsor: SignerWithAddress;
    let user2: SignerWithAddress;
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
    //Fund Contract
    let fund: Fund;
    let fundFactory: FundFactory;
    let implFund: ImplementationAuthority;
    let proxyV1: ProxyV1;
  
    beforeEach(" ", async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      tokenIssuer = signers[1];
      transferAgent = signers[2];
      user1 = signers[4];
      user2 = signers[5];
      
  
      // console.log("trust ", trust);
  
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
  
      trexFactory = await new TREXFactory__factory(owner).deploy(trexImplementationAuthority.address, identityFactory.address);

      console.log("Factory Deployed", trexFactory.address);


      //Compliance Modules

    countryAllowCompliance = await new CountryAllowModule__factory(owner).deploy();
      
    supplyLimitCompliance = await new SupplyLimitModule__factory(owner).deploy();

    maxBalanceCompliance = await new MaxBalanceModule__factory(owner).deploy();

    holdTimeCompliance = await new HoldTimeModule__factory(owner).deploy();

    //Fund Contract

    fund = await new Fund__factory(owner).deploy();
    implFund = await new ImplementationAuthority__factory(owner).deploy(fund.address);
    fundFactory = await new FundFactory__factory(owner).deploy();
    proxyV1 = await new ProxyV1__factory(owner).deploy();

    await proxyV1.upgradeTo(fundFactory.address);
    

    })

        it("Deploy Token: ", async() => {
            let tokenDetails = {
                owner: owner.address,
                name: "Nickel",
                symbol: "NKL",
                decimals: 18,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [user1.address],
                tokenAgents: [user1.address],
                complianceModules: [countryAllowCompliance.address, 
                    supplyLimitCompliance.address, 
                    maxBalanceCompliance.address, 
                    holdTimeCompliance.address],
                complianceSettings: ["0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                    "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0", 
                    "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                    "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc"
                ]
            }
        
            let claimDetails = {
                claimTopics: [],
                issuers: [],
                issuerClaims: []
            };

            await identityFactory.addTokenFactory(trexFactory.address);

            const TX = await trexFactory.deployTREXSuite("process.env.TOKEN_SALT", tokenDetails, claimDetails);
        })

        it("Mint Tokens", async ()=> {

            let tokenDetails = {
                owner: owner.address,
                name: "Nickel",
                symbol: "NKL",
                decimals: 18,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [user1.address],
                tokenAgents: [user1.address],
                complianceModules: [countryAllowCompliance.address, 
                    supplyLimitCompliance.address, 
                    maxBalanceCompliance.address, 
                    holdTimeCompliance.address],
                complianceSettings: ["0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                    "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0", 
                    "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                    "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc"
                ]
            }
        
            let claimDetails = {
                claimTopics: [],
                issuers: [],
                issuerClaims: []
            };

            await identityFactory.addTokenFactory(trexFactory.address);

            const TX = await trexFactory.deployTREXSuite("process.env.TOKEN_SALT", tokenDetails, claimDetails);

            const receipt = await TX.wait();

            const event = receipt.events?.find(event=>event.event==="TREXSuiteDeployed");

            let token = event?.args; 

            // console.log("Token Address: ", token);
            let tokenAttached;
            let irAttached;

            if (Array.isArray(token) && token.length > 0) {
                let firstAddress = token[0];  // Directly accessing the first element
                let irAddress = token[1];
                tokenAttached = await tokenImplementation.attach(firstAddress);
                irAttached = await identityRegistryImplementation.attach(irAddress);
            }

            let tx = await identityFactory.createIdentity(user2.address,user2.address);
            const receipt1 = await tx.wait();

            const event1 = receipt1.events?.find(event=>event.event==="WalletLinked");

            let identity = event1?.args; 
            let useridentity

            if(Array.isArray(identity)){
                useridentity = identity[1]; 
            }

            console.log("User Identity: ", useridentity);

            await irAttached.connect(user1).registerIdentity(user2.address, useridentity, 1);

            await tokenAttached.connect(user1).mint(user2.address, 200);

        })

        it.only("Deploy Fund Contract", async () => {
            let tokenDetails = {
                owner: owner.address,
                name: "Nickel",
                symbol: "NKL",
                decimals: 18,
                irs: ethers.constants.AddressZero,
                ONCHAINID: ethers.constants.AddressZero,
                irAgents: [user1.address],
                tokenAgents: [user1.address],
                transferAgents:[],
                complianceModules: [countryAllowCompliance.address, 
                    supplyLimitCompliance.address, 
                    maxBalanceCompliance.address, 
                    holdTimeCompliance.address],
                complianceSettings: ["0x771c5281000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b",
                    "0x361fab2500000000000000000000000000000000000000000000000000000000000007d0", 
                    "0x9d51d9b700000000000000000000000000000000000000000000000000000000000000c8",
                    "0xf9455301000000000000000000000000000000000000000000000000000000006cd5fbcc"
                ]
            }
        
            let claimDetails = {
                claimTopics: [],
                issuers: [],
                issuerClaims: []
            };

            await identityFactory.addTokenFactory(trexFactory.address);

            const TX = await trexFactory.deployTREXSuite("process.env.TOKEN_SALT", tokenDetails, claimDetails);

            const receipt = await TX.wait();

            const event = receipt.events?.find(event=>event.event==="TREXSuiteDeployed");

            let token = event?.args; 

            // console.log("Token Address: ", token);
            let tokenAttached;
            let firstAddress;

            if (Array.isArray(token) && token.length > 0) {
                firstAddress = token[0];  // Directly accessing the first element
                // tokenAttached = await tokenImplementation.attach(firstAddress);
            }

            // let fundProxy = await new FundFactory__factory(owner).attach(proxyV1.address);
            
            console.log("I am here", trexFactory.address);
            await fundFactory.init(trexFactory.address);

            await fundFactory.setImpl(implFund.address);
            console.log("Fund Implementation Set");

            const tx = await fundFactory.createFund(firstAddress, 
                "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005",
                "Hello"
            );

            const receiptFund = await tx.wait();

            const event1 = receiptFund.events?.find(event=>event.event==="FundCreated");

            let fundContract = event1?.args; 

            let fundAddress;
            let fundAttached;

            if (Array.isArray(fundContract) && fundContract.length > 0) {
                fundAddress = fundContract[0];  // Directly accessing the first element
                fundAttached = await fund.attach(fundAddress);
            }

            console.log("fundContract Address: ", fundAddress, fundContract);




            console.log("Fund Name:", await fundAttached?.fundName(), Number(await fundAttached?.cusip()), await fundAttached?.spvValuation(), await fundAttached?.yieldType());
            console.log("Property Typr: ", Number( await fundAttached?.propertyType()),await fundAttached?.NAVLaunchPrice())
        })
  });


