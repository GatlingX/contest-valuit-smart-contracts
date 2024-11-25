import { ethers } from "hardhat";
import { FundFactory__factory } from "../typechain";
const BN = require("ethers").BigNumber;

async function main() {

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    // let owner = 0xE24f577cfAfC4faaE1c42E9c5335aA0c5D5742db;

    const WRAPPER = await ethers.getContractFactory("Wrapper");
    const WrapperProxy = await ethers.getContractFactory("WrapperProxy");
    const VERC20 = await ethers.getContractFactory("VERC20");
    const IMPLAUTH = await ethers.getContractFactory("ImplementationAuthority");

    let time = 5000;


    const verc20 = await VERC20.deploy();
    await verc20.deployed();
    console.log("verc20: ", verc20.address);
    await sleep(time);

    const implAuth = await IMPLAUTH.deploy(verc20.address);
    await implAuth.deployed();
    console.log("ImplementationAuthority (linked to VERC20): ", implAuth.address);
    await sleep(time);

    //deploy wrapper implementation
    const wrapper = await WRAPPER.deploy();
    await wrapper.deployed();
    console.log("Wrapper : ", wrapper.address);
    await sleep(time);

    const wrapperProxy = await WrapperProxy.deploy();
    await wrapperProxy.deployed();
    console.log("Wrapper Proxy: ", wrapperProxy.address);
    await sleep(time);

    await wrapperProxy.upgradeTo(wrapper.address);
    console.log("Proxy Upgraded")

    const wrapperAttached = await WRAPPER.attach(wrapperProxy.address);

    await wrapperAttached.init(implAuth.address);
    console.log("Proxy Initialized");

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });