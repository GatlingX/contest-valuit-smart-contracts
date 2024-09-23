const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x33485e94d7B4555137BA0f17FCf62f9946E86eBf",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0x335b7C3B643F30efE16D2514913a38350D26625e",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0x1E5465fF23813C85416d9f5fDE5004d9DcC18cA2",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x8A004064b1d1CB14e1d4912725c1AbdD1688D1b3",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0x0547B3E9253224978ADA177570e87707e0Ae24BD",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x2fFa8203e587C8Fa2AA8cbc83a980267985970A2",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //VERC20 Implementation
    await hre.run("verify:verify", {
        address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    //ERC20 Implementation Auth
    await hre.run("verify:verify", {
        address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
        //Path of your main contract.
        constructorArguments:["0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //Wrapper
    await hre.run("verify:verify", {
        address: "0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C",
        //Path of your main contract.
        constructorArguments:["0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C","0x0000000000000000000000000000000000000000"],
        contract: "contracts/wrapper/Wrapper.sol:Wrapper",
    });
    await sleep(3000);


    //TREXFactory
    await hre.run("verify:verify", {
        address: "0xf42F94223aF1BF1e2e3F4125Fff999605dbB3c77",
        //Path of your main contract.
        constructorArguments:['0xFa5219aDf0a62C35e54d36de0114658EDad6Ab3C',"0x3740d1Ac4463D8A778EcFA7d3d163bc7d35700C6"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x44A0E873065b7833dF42898734D979728e71713C",
        //Path of your main contract.
        constructorArguments:['0xf42F94223aF1BF1e2e3F4125Fff999605dbB3c77'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xC29295f67F5d476105f19E8513da0E5027e73e39",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xA3B55f368Eb944f8A664D04002F5460f592D40d7",
        //Path of your main contract.
        constructorArguments:['0xC29295f67F5d476105f19E8513da0E5027e73e39'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x3740d1Ac4463D8A778EcFA7d3d163bc7d35700C6",
        //Path of your main contract.
        constructorArguments:['0xA3B55f368Eb944f8A664D04002F5460f592D40d7'],
        contract: "contracts/onchainID/factory/IdFactory.sol:IdFactory",
    });
    await sleep(3000);


    //Compliance Modules
    await hre.run("verify:verify", {
        address: "0x9449BDAA38CE303355F9eD6eb22465437f351Ff8",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x8489CF77fC2167DeeF64D34445007380fAB47917",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x6aBA405c2d3baF83d38976E9E6325119165f197a",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x350Adb83814F4729aB91B9DFf81aF84bfA5f4083",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

