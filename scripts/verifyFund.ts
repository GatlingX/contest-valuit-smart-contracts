import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x620A9A4DcF84A395370798A10c18205912610240",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x5AD4cdd1AA0cfa4dA51a3C5eeaBf9547b42FE6f2",
        //Path of your main contract.
        constructorArguments:["0x620A9A4DcF84A395370798A10c18205912610240"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x447623EB8c2EeB32Bef361dD06DCA04CDEaA0252",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x8Ad787d0b721FB480EdfCe4Cd847f9FD411dacBD",
        //Path of your main contract.
        constructorArguments:["0x447623EB8c2EeB32Bef361dD06DCA04CDEaA0252"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xF8221740cC1Ac7BB31834978C1A9ce5f2F88c02F",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xAC1a10a087Abd76075F0C61677242823C175954b",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FactoryProxy.sol:FactoryProxy",
    });
    await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

