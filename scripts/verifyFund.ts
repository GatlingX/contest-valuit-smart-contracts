import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xFF808687d6Ac23382ACa2451C9aaE2AF8B1C5eda",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x9600775b8Afc22499950aedecC5cE4b5FD607184",
        //Path of your main contract.
        constructorArguments:["0xFF808687d6Ac23382ACa2451C9aaE2AF8B1C5eda"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x743bbA3Ee07Ee3dF830BF1d6d6072e18bC87A325",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x72d28C4F8c1d9fea3A20269924F7161057D1822c",
        //Path of your main contract.
        constructorArguments:["0x743bbA3Ee07Ee3dF830BF1d6d6072e18bC87A325"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x014d724D3c719597C1bD77a987614E7c3a2C2641",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x12a927Dbc3cBF16e281D083979F5d922DDaA8B2F",
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

