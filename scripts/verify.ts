import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x43D91C17cf2B84048F6B5f799FF5550347495819",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0x6c529b32552eb18C78a606d1E2F11ef19D7D0a0A",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0xeb43096336FC3b643e36C4ec80c755F727924F28",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0xA7507fDbEbaAE0d502D8C742661230FA782da8d0",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0x8166177bEb2e1Bf7Cd0131D8191D31B8357F0eb9",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x047EC170F2c120913f2B838DbCAeC8874ffD3033",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x0038cd79666Ed0E3Bbd13fF95fbbBD18690C7A0c",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //TREXFactory
    await hre.run("verify:verify", {
        address: "0xC20C2BE7462D9D710b336641d15a4917F3b0Bfa0",
        //Path of your main contract.
        constructorArguments:['0x0038cd79666Ed0E3Bbd13fF95fbbBD18690C7A0c',"0xBc06057e7bAc63dAA09509f57cd75A3ac88EFF00", "0x29C17871974e554EcCF13EAFF52ff3E516352e59"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x9F259F66e3264f3BACb7a10d27B3E8aa86816A34",
        //Path of your main contract.
        constructorArguments:['0xC20C2BE7462D9D710b336641d15a4917F3b0Bfa0'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xe9cAf373cd5a1627c7e05F2Cad943E64C0E1DCbA",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xdcE4c8915eFeB6b1d14E32928e7A1D335D143b10",
        //Path of your main contract.
        constructorArguments:['0xe9cAf373cd5a1627c7e05F2Cad943E64C0E1DCbA'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0xBc06057e7bAc63dAA09509f57cd75A3ac88EFF00",
        //Path of your main contract.
        constructorArguments:['0x858B19fc6AE6973623524644EB777F41f84809D1'],
        contract: "contracts/onchainID/factory/IdFactory.sol:IdFactory",
    });
    await sleep(3000);


    //Compliance Modules
    await hre.run("verify:verify", {
        address: "0xf5D0D1069056C292962f662391FBb3Ed00AbD79c",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x3350bF4495E6BF8D9ad680B58741dfDa95Bf390D",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x8c373315B4b67c2948ec4FE2F3d0fb740EbC15a1",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x31873895675eB24C53733D52A7427A8375EDAC2a",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xd83958aB0eC3B523512d5F996CAF9bB96e316363",
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

