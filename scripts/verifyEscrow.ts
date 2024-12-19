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
        address: "0x131c93F57aD3F729c7285dcE623d785a17a8e8A4",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/escrow/EscrowController.sol:EscrowController",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0xbd6f35D2308217d809534F0Ff95C99903D36DcA8",
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

