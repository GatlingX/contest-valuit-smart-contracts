import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x683c8632f6cd885b9A7276C974AC73A66A911C4F",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xE44D34ffBD47306C73214AE4c07367Ef25dF3768",
        //Path of your main contract.
        constructorArguments:["0x683c8632f6cd885b9A7276C974AC73A66A911C4F"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x79FA5372f0e4fFF1c64b3B3AfFC0CF7b193Dc76A",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x79c0E7585edbB094a5CA23E71903F02c84C14269",
        //Path of your main contract.
        constructorArguments:["0x79FA5372f0e4fFF1c64b3B3AfFC0CF7b193Dc76A"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xd8Ed05a917bd8454dAe8171D2bb8b4E9581E32B5",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xB5d83077d40a795Ce415EA82773a06DAFb4A8565",
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

