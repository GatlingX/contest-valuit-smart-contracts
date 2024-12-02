import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0xFBfD39799F08de5bb7f5Bb18cCD2a075208c9e11",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0x43cbAE8294a89bC433f97f0f45C50BE9bCEf0910",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0xb2f34Db663AB10fdCb00756811f8FB5986A77c02",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x463593B460B8cF86Af9591A1C22dd163f0aCc7d0",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0x4388FEa901B85F362fa7B172612e9a2a3b30FC52",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x3D608FF934C7C32772C81D970fb18483b5a7F0b8",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x3af1F28fdd198499778899857C83fc40F4dCF5C9",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //TREXFactory
    await hre.run("verify:verify", {
        address: "0x6a250f5d53B033424eB0faa64d29d64DCeeFEeCb",
        //Path of your main contract.
        constructorArguments:['0x3af1F28fdd198499778899857C83fc40F4dCF5C9',"0x9DFf583ec5d462eDe6117029AADcf800602eB652", "0x29C17871974e554EcCF13EAFF52ff3E516352e59"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0xA35Ab8C1b3FA5ebC92Fd368A67F6894aBb502623",
        //Path of your main contract.
        constructorArguments:['0x6a250f5d53B033424eB0faa64d29d64DCeeFEeCb'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xDcCB2ec44F8F55010A58f9AD75687632631A8ed0",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x4057BE370456AF7f607ab8e8f0B8101268b3b3d4",
        //Path of your main contract.
        constructorArguments:['0xDcCB2ec44F8F55010A58f9AD75687632631A8ed0'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x9DFf583ec5d462eDe6117029AADcf800602eB652",
        //Path of your main contract.
        constructorArguments:['0x4057BE370456AF7f607ab8e8f0B8101268b3b3d4'],
        contract: "contracts/onchainID/factory/IdFactory.sol:IdFactory",
    });
    await sleep(3000);


    //Compliance Modules
    await hre.run("verify:verify", {
        address: "0xC184C48b4b74c3063A4C3d47Cc3Fe470CfB4A674",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x83318b9113042d07FCBB907E62cA35bD91325e5d",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x7cdB0509A0e5a520e4A0a5e49d277E3D6a38afaf",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x544dDEDf4544CE2876c10b614633aeb937c3135D",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x0ac1ca8Ee1eDa6276cE52E5237f054c05e02f3E0",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryRestrictModule.sol:CountryRestrictModule",
    });
    await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

