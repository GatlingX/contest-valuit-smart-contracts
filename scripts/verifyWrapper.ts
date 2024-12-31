const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x075b3a4d5cf8710Ea352C628C9eb2b9D43F3316d",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x346EdeB01dA0f09691825eBed6A2b4c550d5E75e",
        //Path of your main contract.
        constructorArguments:["0x075b3a4d5cf8710Ea352C628C9eb2b9D43F3316d"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0x381C20632F89aba1EABc2094aa4473f34d39Be09",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);

  await hre.run("verify:verify", {
    address: "0x8cA812CC10C060837426569b35e7aB2338ECDB0C",
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

