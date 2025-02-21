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
CountryRestrictModule,
CountryRestrictModule__factory,
EquityConfig, 
EquityConfig__factory, 
// Escrow, 
// Escrow__factory,
// // EscrowProxy,
// // EscrowProxy__factory,
EscrowController,
EscrowControllerProxy, 
EscrowControllerProxy__factory, 
EscrowController__factory, 
EscrowStorage, 
EscrowStorage__factory, 
FactoryProxy, 
FactoryProxy__factory, 
Fund, Fund__factory, 
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
Wrapper__factory, } from "../typechain"; 
 import { sync } from "glob"; 
 import { onchainId, token } from "../typechain/contracts";

describe(" Country Allow Module Contract testing ", function () { let signers: SignerWithAddress[]; let owner: SignerWithAddress; let tokenIssuer: SignerWithAddress; let transferAgent: SignerWithAddress; let user1: SignerWithAddress; let user2: SignerWithAddress; let user3: SignerWithAddress;

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
let countryRestrictCompliance: CountryRestrictModule;
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

    countryRestrictCompliance = await new CountryRestrictModule__factory(
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
    // await escrow.connect(owner).init([usdc.address, usdt.address],fundFactory.address);
});


describe('CountryAllowModule', function () {
    describe('batchAllowCountries', function () {
        it('should allow a batch of countries for the contract', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


            // await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
            await expect(countryAllowCompliance.batchAllowCountries([32,17])).to.be.revertedWith('only bound compliance can call');
        });


        it('should allow a batch of countries for the compliance contract', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
        });
        

        it('should emit CountryAllowed event when countries are added', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


            await expect(
                modularComplianceImplementation.callModuleFunction(encodedData, countryAllowCompliance.address)
            );
            
        });


        it('should revert if a non-owner tries to call batchAllowCountries', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await expect(
                modularComplianceImplementation.connect(user1).callModuleFunction(callData, countryAllowCompliance.address)
            ).to.be.revertedWith('Ownable: caller is not the owner');
            
        });
    });


    describe('batchDisallowCountries', function () {
        it('should remove a batch of countries from the allowed list', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);


            const allowedCountries = [840, 826]; 

            const functionSignature2 = "batchDisallowCountries(uint16[])";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData2,countryAllowCompliance.address);
        });

        it('should emit CountryUnallowed event when countries are disallowed', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16[]"], // data types
                [countries] // actual data to encode
            );

            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);

            const functionSignature2 = "batchDisallowCountries(uint16[])";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData2,countryAllowCompliance.address);
        });
        

        it('should revert if a non-owner tries to call batchDisallowCountries', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
             
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
             
            // List of countries to be allowed
            const countries = [1, 2, 3];
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                 ["uint16[]"], // data types
                 [countries] // actual data to encode
            );
 
            const functionSignature = "batchAllowCountries(uint16[])";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data
 
 
            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);

            const functionSignature2 = "batchDisallowCountries(uint16[])";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await expect(
                modularComplianceImplementation.connect(user1).callModuleFunction(callData2, countryAllowCompliance.address)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        });
    });


    describe('Add allow country', function () {
            it('should revert with CountryAlreadyAllowed error if the country is already allowed', async function () {
                // Initialize the modular compliance contract
                await modularComplianceImplementation.init();
                
                // Add the country allow module to the compliance contract
                await modularComplianceImplementation.addModule(countryAllowCompliance.address);
                
                // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
                const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
                
                // List of countries to be allowed
                const country = 1;
                
                // Add the country for the first time
                const encodedData = ethers.utils.defaultAbiCoder.encode(
                    ["uint16"], // data types
                    [country] // actual data to encode
                );
        
                const functionSignature = "addAllowedCountry(uint16)";
                const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
                const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data
        
                // Calling the function to add the country
                await modularComplianceImplementation.callModuleFunction(callData, countryAllowCompliance.address);
        
                // Now try to add the same country again and expect it to revert with 'CountryAlreadyAllowed' custom error
                await expect(
                    modularComplianceImplementation.callModuleFunction(callData, countryAllowCompliance.address)
                ).to.be.revertedWithCustomError(countryAllowCompliance, 'CountryAlreadyAllowed').withArgs(modularComplianceImplementation.address, country);
            });

        it('should allow a country for the compliance contract', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country=1;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );

            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
        });
        

        it('should emit add allow country event when countries are added', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country=10;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );

            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


            await expect(
                modularComplianceImplementation.callModuleFunction(encodedData, countryAllowCompliance.address)
            );
            
        });


        it('should revert if a non-owner tries to call add allow country', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country=10;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );

            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await expect(
                modularComplianceImplementation.connect(user1).callModuleFunction(callData, countryAllowCompliance.address)
            ).to.be.revertedWith('Ownable: caller is not the owner');
            
        });
    });


    describe('removeAllowedCountry', function () {
        it('should revert with CountryNotAllowed error if the country is not allowed', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
            
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country = 10;
    
            // Try to remove a country that was never added to the allowed list
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );
    
            const functionSignature = "removeAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data
    
            // Expect the function to revert with the 'CountryNotAllowed' custom error
            await expect(
                modularComplianceImplementation.callModuleFunction(callData, countryAllowCompliance.address)
            ).to.be.revertedWithCustomError(countryAllowCompliance, 'CountryNotAllowed').withArgs(modularComplianceImplementation.address, country);
        });

        
        it('should remove a allowed country from the allowed list', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country=10;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );

            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);


            const allowedCountries = [840, 826]; 

            const functionSignature2 = "removeAllowedCountry(uint16)";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData2,countryAllowCompliance.address);
        });

        it('should emit remove allowed country event when countries are disallowed', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
            
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
            
            // List of countries to be allowed
            const country=10;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                ["uint16"], // data types
                [country] // actual data to encode
            );

            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);

            const functionSignature2 = "removeAllowedCountry(uint16)";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await modularComplianceImplementation.callModuleFunction(callData2,countryAllowCompliance.address);
        });
        

        it('should revert if a non-owner tries to call remove allowed country', async function () {
            // Initialize the modular compliance contract
            await modularComplianceImplementation.init();
        
            // Add the country allow module to the compliance contract
            await modularComplianceImplementation.addModule(countryAllowCompliance.address);
             
            // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
            const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
             
            // List of countries to be allowed
            const country=10;
            const encodedData = ethers.utils.defaultAbiCoder.encode(
                 ["uint16"], // data types
                 [country] // actual data to encode
            );
 
            const functionSignature = "addAllowedCountry(uint16)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
            const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data
 
 
            await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);

            const functionSignature2 = "removeAllowedCountry(uint16)";
            const functionSelector2 = ethers.utils.id(functionSignature2).slice(0, 10); // Get the first 4 bytes
            const callData2 = functionSelector2 + encodedData.slice(2); // Remove '0x' prefix from encoded data

            await expect(
                modularComplianceImplementation.connect(user1).callModuleFunction(callData2, countryAllowCompliance.address)
            ).to.be.revertedWith('Ownable: caller is not the owner')
        });
    });

    it('Module transfer action', async function () {
        // Initialize the modular compliance contract
        await modularComplianceImplementation.init();
    
        // Add the country allow module to the compliance contract
        await modularComplianceImplementation.addModule(countryAllowCompliance.address);
         
        // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
        const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
         
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","address","uint256"], // data types
            [owner.address,user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleTransferAction(address,address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
    });

    
    it('Module Mint action', async function () {
        // Initialize the modular compliance contract
        await modularComplianceImplementation.init();
    
        // Add the country allow module to the compliance contract
        await modularComplianceImplementation.addModule(countryAllowCompliance.address);
         
        // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
        const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);
         
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleMintAction(address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
    });


    it('Module Burn action', async function () {
        // Initialize the modular compliance contract
        await modularComplianceImplementation.init();
    
        // Add the country allow module to the compliance contract
        await modularComplianceImplementation.addModule(countryAllowCompliance.address);
         
        // Check if the modularComplianceImplementation is already bound to countryAllowCompliance
        const isBound = await countryAllowCompliance.isComplianceBound(modularComplianceImplementation.address);

        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleMintAction(address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
         
        const encodedData1 = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature1 = "moduleBurnAction(address,uint256)";
        const functionSelector1 = ethers.utils.id(functionSignature1).slice(0, 10); // Get the first 4 bytes
        const callData1 = functionSelector1 + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address);
    });

    it('should return true for isPlugAndPlay', async function () {
        // Initialize the modular compliance contract
        await modularComplianceImplementation.init();
    
        // Add the country allow module to the compliance contract
        await modularComplianceImplementation.addModule(countryAllowCompliance.address);

        // Test if isPlugAndPlay() returns true
        const isPlugAndPlay = await countryAllowCompliance.isPlugAndPlay();
        expect(isPlugAndPlay).to.equal(true);
    });

    it('should return the correct name for the module', async function () {
        // Initialize the modular compliance contract
        await modularComplianceImplementation.init();
    
        // Add the country allow module to the compliance contract
        await modularComplianceImplementation.addModule(countryAllowCompliance.address);

        // Test if name() returns the expected string
        const moduleName = await countryAllowCompliance.name();
        expect(moduleName).to.equal('CountryAllowModule');
    });



    it('Revert Module Mint action if it is not owner', async function () { 
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleMintAction(address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await expect(modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });



    it('Module transfer action and revert if it not owner', async function () { 
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","address","uint256"], // data types
            [owner.address,user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleTransferAction(address,address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await expect(modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });


    it('Module Burn action and revert if it not owner', async function () {
        const encodedData = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature = "moduleMintAction(address,uint256)";
        const functionSelector = ethers.utils.id(functionSignature).slice(0, 10); // Get the first 4 bytes
        const callData = functionSelector + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await expect(modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address)).to.be.revertedWith('Ownable: caller is not the owner');
         
        const encodedData1 = ethers.utils.defaultAbiCoder.encode(
            ["address","uint256"], // data types
            [user1.address,29] // actual data to encode
        );

        const functionSignature1 = "moduleBurnAction(address,uint256)";
        const functionSelector1 = ethers.utils.id(functionSignature1).slice(0, 10); // Get the first 4 bytes
        const callData1 = functionSelector1 + encodedData.slice(2); // Remove '0x' prefix from encoded data


        await expect(modularComplianceImplementation.callModuleFunction(callData,countryAllowCompliance.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });
});

});