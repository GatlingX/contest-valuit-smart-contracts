import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const FUND = await ethers.getContractFactory("Fund");
    const IMPLAUTH = await ethers.getContractFactory("ImplementationAuthority");
    const FUNDFACTORY = await ethers.getContractFactory("FundFactory");
    const FUNDPROXY = await ethers.getContractFactory("FactoryProxy");

    let time = 5000;
    //deploy identity implementation and implementation authority, link implementation
    const fundImpl = await FUND.deploy();
    await fundImpl.deployed();
    console.log("Fund Implementation : ", fundImpl.address);
    await sleep(time);

    const implAuth = await IMPLAUTH.deploy(fundImpl.address);
    await implAuth.deployed();
    console.log("ImplementationAuthority (linked to Fund): ", implAuth.address);
    await sleep(time);

    //deploy FundFactory
    const fundFactory = await FUNDFACTORY.deploy();
    await fundFactory.deployed();
    console.log("Fund Factory : ", fundFactory.address);
    await sleep(time);

    //deploy Fund Proxy
    const fundProxy = await FUNDPROXY.deploy();
    await fundProxy.deployed();
    console.log("Fund Proxy: ", fundProxy.address);
    await sleep(time);

    //Upgrade Proxy
    await fundProxy.upgradeTo(fundFactory.address);
    console.log("Fund Proxy Upgraded");
    await sleep(time);

    //Attach and Initialize Factory
    const fundAttached = await FUNDFACTORY.attach(fundProxy.address);

    // console.log(fundAttached);

    await fundAttached.init("0xf42F94223aF1BF1e2e3F4125Fff999605dbB3c77");

    console.log("Fund Factory Initialized");
    await sleep(time);

    await fundAttached.setImpl(implAuth.address);
    console.log("Fund Implementation set");

    
    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });