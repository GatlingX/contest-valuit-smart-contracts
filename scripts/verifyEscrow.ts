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
        address: "0x81e9F9b635e67Fb0766587022c72D118458CCEE4",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/escrow/EscrowController.sol:EscrowController",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0x0d61B20c6adEB65Eae9521329CC4B6BAc82D818D",
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

