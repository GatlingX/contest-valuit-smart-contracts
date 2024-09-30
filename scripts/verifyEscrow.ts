const hre = require("hardhat");

async function main() {
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      await hre.run("verify:verify", {
        address: "0x2a709159b17C51af79D8d11fF5c664648c4Cd340",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/Helpers/USDT.sol:USDT",
    });
    await sleep(3000);


    await hre.run("verify:verify", {
        address: "0x0dA98cfe6a04D5D7109F62aCef3879ED36166fd6",
        //Path of your main contract.
        constructorArguments:["0x2a709159b17C51af79D8d11fF5c664648c4Cd340",1],
        contract: "contracts/escrow/Escrow.sol:Escrow",
    });
    await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

