import hre from "hardhat";

async function main() {
    
    function sleep(ms: any) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }


    await hre.run("verify:verify", {
        address: "0x689C8ff410C4bEf88DB997627f447fDeB91442F9",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/Fund.sol:Fund",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xbDF9bEbE582C113089CE91ea01d211B8fDD01452",
        //Path of your main contract.
        constructorArguments:["0xB8c220D64aDA3FC5637d035444BD03951537FDB8"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x3be51D2Db859193aEA530f8b72B9bcDc38a67163",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/fund/EquityConfig.sol:EquityConfig",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0xAB040145B5d93159Dc248A38A690F266A9e2c273",
        //Path of your main contract.
        constructorArguments:["0x3be51D2Db859193aEA530f8b72B9bcDc38a67163"],
        contract: "contracts/onchainID/proxy/ImplementationAuthority.sol:ImplementationAuthority",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x31bb8736284A43EEE1F798B98634728D9f12f321",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FundFactory.sol:FundFactory",
    });
    await sleep(3000);

    await hre.run("verify:verify", {
        address: "0x1B7E0939F7a00697DEadB57770ae3731d68f0cd9",
        //Path of your main contract.
        constructorArguments:[],
        contract: "contracts/factory/FactoryProxy.sol:FactoryProxy",
    });
    await sleep(3000);
  

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

