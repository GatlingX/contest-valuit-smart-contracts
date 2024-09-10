import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ClaimIssuer, ClaimIssuer__factory, ClaimTopicsRegistry, ClaimTopicsRegistry__factory, ClaimTopicsRegistryProxy, CountryAllowModule, CountryAllowModule__factory, CountryRestrictModule, CountryRestrictModule__factory, DefaultCompliance, HoldTimeModule, HoldTimeModule__factory, IdentityRegistry, IdentityRegistry__factory, IdentityRegistryProxy, IdentityRegistryStorage, IdentityRegistryStorage__factory, IdentityRegistryStorageProxy, IdFactory, IdFactory__factory, MaxBalanceModule, MaxBalanceModule__factory, ModularCompliance, ModularCompliance__factory, SupplyLimitModule, SupplyLimitModule__factory, Token, Token__factory, TokenProxy, TREXFactory, TREXFactory__factory, TREXImplementationAuthority, TREXImplementationAuthority__factory, TrustedIssuersRegistry, TrustedIssuersRegistry__factory, TrustedIssuersRegistryProxy } from "../typechain-types";
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

        it.only("Mint Tokens", async ()=> {

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
  });


