const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xcb03E874C293BA829FBc06a79eA40fE9C0a40684",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x61914e3150171C3eBf99d1Aa7DD6a050d2755b42",
        //Path of your main contract.
        constructorArguments:["0xcb03E874C293BA829FBc06a79eA40fE9C0a40684"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0xbfc70f68eacbB37eB4FB60F8C832056d58fD2BBc",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);

  await hre.run("verify:verify", {
    address: "0x29C17871974e554EcCF13EAFF52ff3E516352e59",
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

