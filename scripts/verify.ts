import { ethers } from "hardhat";

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


     //TIR
    await hre.run("verify:verify", {
      address: "0xc1e06047be9841C88D9752203D7b52580f649CBd",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry",
    });
    await sleep(3000);

    //CTR
    await hre.run("verify:verify", {
        address: "0x8b6Da37f1d4e3D084Cb407C2ba43c51ba92Ed0a8",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry",
      });
    await sleep(3000);

    //IRS
    await hre.run("verify:verify", {
        address: "0x7881fbddA0d50AD5741893d78d6551075D88C743",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage",
      });
    await sleep(3000);

    //IR
    await hre.run("verify:verify", {
        address: "0x60776cb2Ee2Dd786Cd7EEbEC4CAE8370A0A4E68C",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry",
    });
    await sleep(3000);

    //Compliance
    await hre.run("verify:verify", {
        address: "0xd5be2e73De838a7d9D9c28Ea8785753D0a86007c",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/ModularCompliance.sol:ModularCompliance",
    });
    await sleep(3000);

    //Token
    await hre.run("verify:verify", {
        address: "0xbDA037623473058c079BE622EC18cCd43A3D520F",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/Token.sol:Token",
    });
    await sleep(3000);

    //TREXImplementationAuthority
    await hre.run("verify:verify", {
        address: "0xe905f499b2B025B4672c88ee99C70a6C2f974Fb0",
        //Path of your main contract.
        constructorArguments:[true, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'],
        contract: "contracts/proxy/authority/TREXImplementationAuthority.sol:TREXImplementationAuthority",
    });
    await sleep(3000);

    //TREXFactory
    await hre.run("verify:verify", {
        address: "0xCeb60e3323E39b33f720ddDEDEF277165dab121C",
        //Path of your main contract.
        constructorArguments:['0xe905f499b2B025B4672c88ee99C70a6C2f974Fb0',"0x25eFD929b52E4e22F6F2bcf67F8AAf5625cB7b78", "0x29C17871974e554EcCF13EAFF52ff3E516352e59"],
        contract: "contracts/factory/TREXFactory.sol:TREXFactory",
    });
    await sleep(3000);

    //IAFactory
    await hre.run("verify:verify", {
        address: "0xe98fd4898DC8ffC65184aFc2Cd85Afe5Ab691B70",
        //Path of your main contract.
        constructorArguments:['0xCeb60e3323E39b33f720ddDEDEF277165dab121C'],
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
        address: "0x9908c56f693872546AEDF50306910144637Bd9E4",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/CountryAllowModule.sol:CountryAllowModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x56ab113475E2bec70BCC46FAa7a8C6dfCB321716",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/SupplyLimitModule.sol:SupplyLimitModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xe94057de584a4EDe80019FAdFB494c2a937d2E07",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/MaxBalanceModule.sol:MaxBalanceModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x29cB70b8B0E825EB4CE9e50A9864Ba2B225cc625",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/compliance/modular/modules/HoldTimeModule.sol:HoldTimeModule",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x9028dC9a333002Aeb5A2776cdE2cEA5E9176305E",
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

