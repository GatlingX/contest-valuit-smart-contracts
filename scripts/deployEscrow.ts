import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    // let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const ESCROWPROXY = await ethers.getContractFactory("EscrowControllerProxy")
    const ESCROW = await ethers.getContractFactory("EscrowController");

    let time = 5000;

    // const USDT = await ethers.getContractFactory("USDT");
    // const usdt = await USDT.deploy();
    // await usdt.deployed();
    // console.log("USDT: ", usdt.address);
    // await sleep(time);

    // const USDC = await ethers.getContractFactory("USDC");
    // const usdc = await USDC.deploy();
    // await usdc.deployed();
    // console.log("USDC: ", usdc.address);
    // await sleep(time);


    //deploy escrow implementation, escrow proxy
    const escrow = await ESCROW.deploy();
    await escrow.deployed();
    console.log("EscrowController : ", escrow.address);
    await sleep(time);

    const escrowProxy = await ESCROWPROXY.deploy();
    await escrowProxy.deployed();
    console.log("EscrowControllerProxy: ", escrowProxy.address);
    await sleep(time);

    //Upgrade Proxy
    await escrowProxy.upgradeTo(escrow.address);
    console.log("EscrowController Proxy Upgraded");
    await sleep(time);

    //Attach and Initialize Escrow
    const escrowAttached = await ESCROW.attach(escrowProxy.address);

    await escrowAttached.init(["0x836559dEcaA375EdfDa232090934Ea326468A7A6","0xFaD778bb6F185C024477E9FB9beAdc8a042fd01C"], "0x63CA3CD0e2E4306cB9b74758A6f329c65cd9669d","0xAC1a10a087Abd76075F0C61677242823C175954b",{gasLimit:3567532});
    console.log("EscrowController Proxy Initialized");
    await sleep(time);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });