import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x2c5272a39A129a56232063D7ec729E58A04cE827",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0xa715858c700311e17E0CA9BB1f7e747bA6Aa2C5a",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0x6D5854801B9e608398fA78a5b519790e82e96CE4",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x275c8Ba9F5B0d53B72FE61b3C60ad1a28FFd3537",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0x2f6ddC960e1999d6257176D31ea3F323680777f6",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x1b4819EFF90e4218add0DdF19fFE207B4fa87F48",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xB7a38Fe5f40617262a2B96E6D750877175e6739b",
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
        address: "0xed5A3343a96d12e67CC004791A276c8921707CD6",
        //Path of your main contract.
        constructorArguments:['0xB7a38Fe5f40617262a2B96E6D750877175e6739b',"0x610a97777774E17BB94f31Db9B0894a97F44FAc9", "0xAA72c4A5A079109461DA8C12594B18151CcdA6dD"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x4a05A5f9954C4Db68e95A9E67CC984f4354971d3",
        //Path of your main contract.
        constructorArguments:['0xed5A3343a96d12e67CC004791A276c8921707CD6'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xAeB3D3262FAD9bc427804FF7eb57891E385aB60A",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x4C1f5D3848f7342fC40541aDD53e65f03Ce36a99",
        //Path of your main contract.
        constructorArguments:['0xAeB3D3262FAD9bc427804FF7eb57891E385aB60A'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x610a97777774E17BB94f31Db9B0894a97F44FAc9",
        //Path of your main contract.
        constructorArguments:['0x4C1f5D3848f7342fC40541aDD53e65f03Ce36a99'],
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

