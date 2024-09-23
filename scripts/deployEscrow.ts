import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    // let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const ESCROW = await ethers.getContractFactory("Escrow");

    let time = 5000;

    const USDT = await ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy();
    await usdt.deployed();
    console.log("USDT: ", usdt.address);
    await sleep(time);


    //deploy identity implementation and implementation authority, link implementation
    const escrow = await ESCROW.deploy(usdt.address, 1);
    await escrow.deployed();
    console.log("Escrow : ", escrow.address);
    await sleep(time);
    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });