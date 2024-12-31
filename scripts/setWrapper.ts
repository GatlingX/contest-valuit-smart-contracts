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

    const wrapper = await WRAPPER.attach("0x8cA812CC10C060837426569b35e7aB2338ECDB0C");
    console.log("Proxy Attached");

    sleep(time);

    await wrapper.setEscrowController("0x90751145f8E00C0a956907D4EaA28BDa97b38251");
    console.log("Escrow Set");

    sleep(time);

    await wrapper.setStableCoin("usdc");
    console.log("Stable coin Set");

    sleep(time);

    await wrapper.setOnchainID("0xd6d10b9c916542982Ce9dF739540fCfB129132B6");
    console.log("OnchainID set");
    


   

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });