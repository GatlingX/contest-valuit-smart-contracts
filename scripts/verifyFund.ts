import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xbC850857f0AfF613708097fA776319396d90A18D",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xBd36441C0fBbEc1335b14817E357d62f339F8dCb",
        //Path of your main contract.
        constructorArguments:["0xbC850857f0AfF613708097fA776319396d90A18D"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x9A5FCb65b9A82b4fE54BBa3e191c4f9D3601118D",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x9b0c06f5ADC7e56393C13c9866903112838fF5C6",
        //Path of your main contract.
        constructorArguments:["0x9A5FCb65b9A82b4fE54BBa3e191c4f9D3601118D"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xD0e2f819948FA9FE0cf5a6AFAA779589A7F945d2",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xdFc729Ea55333d91DE197D06b724804A143e1De4",
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

