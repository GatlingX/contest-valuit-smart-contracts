import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const FUND = await ethers.getContractFactory("Fund");
    const EQUITYCONFIG = await ethers.getContractFactory("EquityConfig");
    const IMPLAUTH = await ethers.getContractFactory("ImplementationAuthority");
    const FUNDFACTORY = await ethers.getContractFactory("FundFactory");
    const FUNDPROXY = await ethers.getContractFactory("FactoryProxy");

    let time = 5000;
    //deploy fund implementation and implementation authority, link implementation
    const fundImpl = await FUND.deploy();
    await fundImpl.deployed();
    console.log("Fund Implementation : ", fundImpl.address);
    await sleep(time);

    const implAuth = await IMPLAUTH.deploy(fundImpl.address);
    await implAuth.deployed();
    console.log("ImplementationAuthority (linked to Fund): ", implAuth.address);
    await sleep(time);

    //deploy EquityConfig implementation and implementation authority, link implementation
    const equityConfigImpl = await EQUITYCONFIG.deploy();
    await equityConfigImpl.deployed();
    console.log("EQUITY CONFIG Implementation : ", equityConfigImpl.address);
    await sleep(time);

    const implAuthEQUITYCONFIG = await IMPLAUTH.deploy(equityConfigImpl.address);
    await implAuthEQUITYCONFIG.deployed();
    console.log("ImplementationAuthority (linked to EQUITYCONFIG): ", implAuthEQUITYCONFIG.address);
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

    await fundAttached.init("0x8707f0C8e179B0A5A33BE4DBC4ce326D3E45E4BA");

    console.log("Fund Factory Initialized");
    await sleep(time);

    await fundAttached.setImpl(implAuth.address, implAuthEQUITYCONFIG.address);
    console.log("Fund Implementation set");

    
    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });