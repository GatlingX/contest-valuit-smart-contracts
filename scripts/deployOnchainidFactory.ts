import { ethers } from "hardhat";
const BN = require("ethers").BigNumber;
// import { AddressZero } from "../test/utilities/utilities";
// import { BurnBridge__factory } from "../typechain";
// import { convertWithDecimal } from "../test/utilities/utilities";
async function main() {
  // const owner = "0x5F38A8Cf7147Ef29Cb18fE79B2405d1bc45e697C";

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
    const [deployer, investor] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

    const IMPLAUTH = await ethers.getContractFactory("ImplementationAuthority");
    const IDFACTORY = await ethers.getContractFactory("IdFactory");
    const IDENTITY = await ethers.getContractFactory("Identity");

    //deploy identity implementation and implementation authority, link implementation
    let idImpl = await IDENTITY.deploy(DEAD_ADDRESS, true);
    await idImpl.deployed();
    console.log("Identity Implementation : ", idImpl.address);
    await sleep(5000);

    let implAuth = await IMPLAUTH.deploy(idImpl.address);
    await implAuth.deployed();
    console.log("ImplementationAuthority (linked to Identity): ", implAuth.address);
    await sleep(5000);

    //deploy IDFactory
    let idFactory = await IDFACTORY.deploy(implAuth.address);
    await idFactory.deployed();
    console.log("IdFactory : ", idFactory.address);
    await sleep(5000);
    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });