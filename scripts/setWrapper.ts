import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    // let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const WRAPPER = await ethers.getContractFactory("Wrapper");
    // const WrapperProxy = await ethers.getContractFactory("WrapperProxy");
    
    let time = 5000;

    const wrapper = await WRAPPER.attach("0xbA2bBD93FA6a5B18ED15269f261b676fC5d58E25");
    console.log("Proxy Attached");

    sleep(time);

    await wrapper.setEscrowController("0x503c08A37fF5Ab51Da984668E8C8B14539aB1Fa2",{gasLimit:3567532});
    console.log("Escrow Set");

    sleep(time);

    await wrapper.setStableCoin("usdc",{gasLimit:3567532});
    console.log("Stable coin Set");

    sleep(time);

    await wrapper.setOnchainID("0xf06757246c60DdF79d6f2b6D1475F179cbEaADee",{gasLimit:3567532});
    console.log("OnchainID set");
    


   

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });