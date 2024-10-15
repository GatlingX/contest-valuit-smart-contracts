const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x4EE0D3830Bb97cbb0CB1DBC56f03D9b73835FA97",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x4a0d48B16E939c62Af83b8ca420D7276459AB815",
        //Path of your main contract.
        constructorArguments:["0x4EE0D3830Bb97cbb0CB1DBC56f03D9b73835FA97"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    // await hre.run("verify:verify", {
    //     address: "0x59c338A14770Bb71302Ec0B58bF0960Bc38bC29b",
    //     //Path of your main contract.
    //     constructorArguments:[],
    //     contract: "contracts/factory/FundFactory.sol:FundFactory",
    // });
    // await sleep(3000);

    // await hre.run("verify:verify", {
    //     address: "0x34529f0882d6714F765aC0B131F6b094A69aEa16",
    //     //Path of your main contract.
    //     constructorArguments:[],
    //     contract: "contracts/factory/FactoryProxy.sol:FactoryProxy",
    // });
    // await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

