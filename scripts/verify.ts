import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0x54401E45CA260a69D41B5a1c0c7009B9a38b576d",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0xDba093EAdb2eD501A66cb333389BE406422Ce2ee",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0x5e138E45076790DFe204538F8325Ad87F5bCF422",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x4e9443bcB1234a55FA627c592863c2aF3D0deD58",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0xECF190BC5023965e44EcC39Ec4F9465034142da8",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0x98Aaf7A2CDFc2D9E2B45eb84d04E82A559CF7B8c",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x0240751A2322cbDd63922338eCdB6D4eA2085DbA",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //TREXFactory
    await hre.run("verify:verify", {
        address: "0x59FA898063EC4560E1ade0b4B522b3abb3DF4BA8",
        //Path of your main contract.
        constructorArguments:['0x0240751A2322cbDd63922338eCdB6D4eA2085DbA',"0x309188097F63a064310B00e514FD2a5D3cd7227c", "0x29C17871974e554EcCF13EAFF52ff3E516352e59"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0x75faF8BbbC8599239544Df2E8f58e60AAdCF7157",
        //Path of your main contract.
        constructorArguments:['0x59FA898063EC4560E1ade0b4B522b3abb3DF4BA8'],
        contract: "contracts/proxy/authority/IAFactory.sol:IAFactory",
    });
    await sleep(3000);

    //ONCHAIN ID CONTRACTS

    //Identity Implementation
    await hre.run("verify:verify", {
        address: "0xC651C1a58449368228E6f8900cB6e50BDAA278ec",
        //Path of your main contract.
        constructorArguments:['0x000000000000000000000000000000000000dEaD', true],
        contract: "contracts/onchainID/Identity.sol:Identity",
    });
    await sleep(3000);

    //ImplementationAuthority
    await hre.run("verify:verify", {
        address: "0x524927F838B4cc280BCD8fEFD755337b94cC8866",
        //Path of your main contract.
        constructorArguments:['0xC651C1a58449368228E6f8900cB6e50BDAA278ec'],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    //IdFactory
    await hre.run("verify:verify", {
        address: "0x309188097F63a064310B00e514FD2a5D3cd7227c",
        //Path of your main contract.
        constructorArguments:['0x524927F838B4cc280BCD8fEFD755337b94cC8866'],
        contract: "contracts/onchainID/factory/IdFactory.sol:IdFactory",
    });
    await sleep(3000);


    //Compliance Modules
    await hre.run("verify:verify", {
        address: "0xAF05bcbd40DD7235C8A84530010b43aEA8ee34ce",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x51aaDeB0cC8F33Ac1de9797965691F519405147E",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x4FCDA5D91106BD313c9b12F271EC958067e7e514",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xFB4226A5928f6c39B3D4e5222FE4b63e14169298",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x24FB72aE57124Eb65A9ad1a9F4916144f4f697C7",
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

