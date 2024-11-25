import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x37B4A338B83B697d6ff41A7989d947C9258C1C49",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x706fE965d0b6424bAE2b4f5704fB1Fe4BDd59DF3",
        //Path of your main contract.
        constructorArguments:["0x37B4A338B83B697d6ff41A7989d947C9258C1C49"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x55822fF7ad134Ce094ba06ce8d36EA68Eb6B0f5A",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xA2F2e43084161E1c23Edf907fC8EB3E5347Cb969",
        //Path of your main contract.
        constructorArguments:["0x55822fF7ad134Ce094ba06ce8d36EA68Eb6B0f5A"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x40de41E4c7733273dF89d4fdd80151f19AAC05DA",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xFc8F537167Aa3b344999117a093FBc8acB429315",
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

