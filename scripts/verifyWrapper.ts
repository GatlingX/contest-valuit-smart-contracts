const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xd09050812Ec68B0b391B07A1b453D1E01ae76140",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x1fc6F27ae855f181dAa599281D5C6EF79eD7aeF1",
        //Path of your main contract.
        constructorArguments:["0xd09050812Ec68B0b391B07A1b453D1E01ae76140"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0xC90B3c80E3c379A76FBdf6f79769e4FdE6115804",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);

  await hre.run("verify:verify", {
    address: "0xcBC4c5Bd2874c30eb22b61f3EC391b4243520ba9",
    //Path of your main contract.
    constructorArguments:[],
    contract: "contracts/wrapper/WrapperProxy.sol:WrapperProxy",
});
await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

