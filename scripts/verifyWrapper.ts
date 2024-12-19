const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x4847C320a9cdc1b37bCE3b70cf4d81A332641037",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xa5543E09e5745aB7F3620583BA18daC00c8f1b23",
        //Path of your main contract.
        constructorArguments:["0x4847C320a9cdc1b37bCE3b70cf4d81A332641037"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0x7Df9e5706429Dc89BE4034318ad1bd14D8D77859",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);

  await hre.run("verify:verify", {
    address: "0x5459D7822eac8956aBE15a2F40549A3f7b4fbf7F",
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

