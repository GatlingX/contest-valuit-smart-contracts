const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xC5Ec6bD95A6023c7bF004136C741F011Cbe68f04",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x47EE4D3B761CcDA2e6161e21f2E9704264966f01",
        //Path of your main contract.
        constructorArguments:["0xC5Ec6bD95A6023c7bF004136C741F011Cbe68f04"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0xE451CD1d21D4096A2B914dcBFa26dC114716f762",
      //Path of your main contract.
      constructorArguments:["0x47EE4D3B761CcDA2e6161e21f2E9704264966f01"],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

