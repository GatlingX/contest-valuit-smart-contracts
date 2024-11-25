const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

  //     await hre.run("verify:verify", {
  //       address: "0xFaD778bb6F185C024477E9FB9beAdc8a042fd01C",
  //       //Path of your main contract.
  //       constructorArguments:[],
  //       contract: "contracts/Helpers/USDT.sol:USDT",
  //   });
  //   await sleep(3000);

  //   await hre.run("verify:verify", {
  //     address: "0x836559dEcaA375EdfDa232090934Ea326468A7A6",
  //     //Path of your main contract.
  //     constructorArguments:[],
  //     contract: "contracts/Helpers/USDC.sol:USDC",
  // });
  // await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xfc556E2D14db33f33782c90f013406033f50D71b",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/escrow/EscrowController.sol:EscrowController",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0x8bD1ec53b9CcC4c252c21B97058f9913fe4d1B0D",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/escrow/EscrowControllerProxy.sol:EscrowControllerProxy",
  });
  await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

