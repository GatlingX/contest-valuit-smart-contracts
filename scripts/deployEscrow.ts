import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    // let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const ESCROWPROXY = await ethers.getContractFactory("EscrowProxy")
    const ESCROW = await ethers.getContractFactory("Escrow");

    let time = 5000;

    const USDT = await ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy();
    await usdt.deployed();
    console.log("USDT: ", usdt.address);
    await sleep(time);

    const USDC = await ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy();
    await usdc.deployed();
    console.log("USDC: ", usdc.address);
    await sleep(time);


    //deploy escrow implementation, escrow proxy
    const escrow = await ESCROW.deploy();
    await escrow.deployed();
    console.log("Escrow : ", escrow.address);
    await sleep(time);

    const escrowProxy = await ESCROWPROXY.deploy();
    await escrowProxy.deployed();
    console.log("EscrowProxy: ", escrowProxy.address);
    await sleep(time);

    //Upgrade Proxy
    await escrowProxy.upgradeTo(escrow.address);
    console.log("Escrow Proxy Upgraded");
    await sleep(time);

    //Attach and Initialize Escrow
    const escrowAttached = await ESCROW.attach(escrowProxy.address);

    await escrowAttached.init([usdt.address,usdc.address],1);
    console.log("Escrow Initialized");
    await sleep(time);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });