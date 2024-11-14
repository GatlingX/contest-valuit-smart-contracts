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
        address: "0x63952a22B3626FcFe954a512b22cA57C5950E3A8",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/escrow/Escrow.sol:Escrow",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
      address: "0x35f39906cCCfa2ec4e041b25164ddC6EacFEEb24",
      //Path of your main contract.
      constructorArguments:[],
      contract: "contracts/escrow/EscrowProxy.sol:EscrowProxy",
  });
  await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

