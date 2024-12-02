const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0xF4FB723C6E8241f993D0166EB0d89Fc2a1C0BC34",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/token/VERC20.sol:VERC20",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x610ABcB2066a91B515F718609073AEc52bDD0Ff3",
        //Path of your main contract.
        constructorArguments:["0xF4FB723C6E8241f993D0166EB0d89Fc2a1C0BC34"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0xA4e12341c705A27A928E45E5F1A9dc630497EE02",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/wrapper/Wrapper.sol:Wrapper",
  });
  await sleep(3000);

  await hre.run("verify:verify", {
    address: "0xd84Ac42bcD4C4E9E965e75Ca998add631ed0729E",
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

