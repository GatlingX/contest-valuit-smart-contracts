import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x4EBCE03f93EE370b9cD0F6616547Fc46C255b082",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0xbE269a9C433eE1286acfC2Cf4aDDf79976560926",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0xaC2cC326Ded25b53253c5E482eDD2d0146E4BA33",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x17EF6Fa0670404450A7334EC5E2e1e0E76F15054",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0xab818383C008202C44Ed77566669530a1Ed23837",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0xE8DffAE1D353d86E39E9549EB4A41819fED1199A",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xaB89094b01ab75F03FEc3f960C5908F9586EF7d8",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //TREXFactory
    await hre.run("verify:verify", {
        address: "0x63CA3CD0e2E4306cB9b74758A6f329c65cd9669d",
        //Path of your main contract.
        constructorArguments:['0xaB89094b01ab75F03FEc3f960C5908F9586EF7d8',"0x25eFD929b52E4e22F6F2bcf67F8AAf5625cB7b78", "0x29C17871974e554EcCF13EAFF52ff3E516352e59"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x1d4E0ffDE7a936b6d8Df5DD03d41cef35B777b9d",
        //Path of your main contract.
        constructorArguments:['0x63CA3CD0e2E4306cB9b74758A6f329c65cd9669d'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xe667b5b54543dF9C86109DBdbAa70A91d2c33aDb",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x858B19fc6AE6973623524644EB777F41f84809D1",
        //Path of your main contract.
        constructorArguments:['0xe667b5b54543dF9C86109DBdbAa70A91d2c33aDb'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x25eFD929b52E4e22F6F2bcf67F8AAf5625cB7b78",
        //Path of your main contract.
        constructorArguments:['0x858B19fc6AE6973623524644EB777F41f84809D1'],
        contract: "contracts/onchainID/factory/IdFactory.sol:IdFactory",
    });
    await sleep(3000);


    //Compliance Modules
    await hre.run("verify:verify", {
        address: "0xb29762C7914C14E3233168F8779a98ca719B4e02",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xCCb8b0efc0a23b92b57A1259047cF8330646cC4f",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x6149168ecE1dd0Ad91E92059626f0E177B56298a",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xAa1866aAb51091c32a924Ec04dddb4A922786408",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x4BE393130685c4051c588b4739D3340c39A6DF05",
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

