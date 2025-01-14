import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x04bceb9b9278399029bAB068c3eEfAC07a2e6FF2",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x77Dad48BB498E9F41a9b44b2FD70FF32442193e8",
        //Path of your main contract.
        constructorArguments:["0x04bceb9b9278399029bAB068c3eEfAC07a2e6FF2"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x83B2522B6C1C41D49826296b0eF7c62F3Ff2D075",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x6b93FF285A79D2BCE5e9021fe29E390116A9e346",
        //Path of your main contract.
        constructorArguments:["0x83B2522B6C1C41D49826296b0eF7c62F3Ff2D075"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xCf849d78836B49d479B4608CA519B1077F598Beb",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x55fCa649e6b5DBa805aC240eC3b5bcE8743b88fA",
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

