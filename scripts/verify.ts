import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x068426FCc9D8e486D14277ADF3BDB3a393CF3f30",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0x71f051b05622FcC2b78bb521CB85B188286903D2",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0x5249f64Ca8B8490468c96bF8b5C542e99B0d7A87",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x843a3E03C4902a2b30B41B646bDD71dF76acB79c",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0x512cd537F2B9907E848bd471186d02bA4fE89506",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x0d1F06e6a8BC0Bb883eBa40317F379C572b0B601",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xd3A80F5CafFFCcCb0d5ad0FE6ad0Bf6A012bCC43",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    // //VERC20 Implementation
    // await hre.run("verify:verify", {
    //     address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
    //     //Path of your main contract.
    //     constructorArguments:[],
    //     contract: "contracts/token/VERC20.sol:VERC20",
    // });
    // await sleep(3000);

    // //ERC20 Implementation Auth
    // await hre.run("verify:verify", {
    //     address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
    //     //Path of your main contract.
    //     constructorArguments:["0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C"],
    //     contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    // });
    // await sleep(3000);

    // //Wrapper
    // await hre.run("verify:verify", {
    //     address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
    //     //Path of your main contract.
    //     constructorArguments:["0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C"],
    //     contract: "contracts/wrapper/Wrapper.sol:Wrapper",
    // });
    // await sleep(3000);


    //TREXFactory
    await hre.run("verify:verify", {
        address: "0xB6F552fddBda8fDA884a96BEe5067CA3F0913cC8",
        //Path of your main contract.
        constructorArguments:['0xd3A80F5CafFFCcCb0d5ad0FE6ad0Bf6A012bCC43',"0x9B5FeF7f654774b3eBd8AaD57F51F749AEE35c4B", "0x894BEe6D987bFfE075eE34dc4F9597A62C7bDD83"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x9ffC2226C17058E7d238F6E05385510FD8eB6199",
        //Path of your main contract.
        constructorArguments:['0xB6F552fddBda8fDA884a96BEe5067CA3F0913cC8'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xa2778DB3331040F8e01dE12d331D366c5ae8910E",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x8fab508c3525afA64baf6Af7D583780F659B8Eae",
        //Path of your main contract.
        constructorArguments:['0xa2778DB3331040F8e01dE12d331D366c5ae8910E'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x9B5FeF7f654774b3eBd8AaD57F51F749AEE35c4B",
        //Path of your main contract.
        constructorArguments:['0x8fab508c3525afA64baf6Af7D583780F659B8Eae'],
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

