import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xd168F5132fFCee46Df0FD41A60af7B043F0A61D7",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x0a23b2cD9F2Ae1b9d7E07e7397168Ff1760D94b4",
        //Path of your main contract.
        constructorArguments:["0xd168F5132fFCee46Df0FD41A60af7B043F0A61D7"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xdED93274c7D1D3b18E372047faFB2FDf55091Dd0",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x4eab50d04bA65c772E61f6829a38D2A8F021A127",
        //Path of your main contract.
        constructorArguments:["0xdED93274c7D1D3b18E372047faFB2FDf55091Dd0"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xf091a1d1016dA8082085AFD0d900CFEa753a7a0B",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x337353061355F51dBDDdDe886121e62B366EFc43",
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

