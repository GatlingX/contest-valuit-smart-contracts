const BN = require("ethers").BigNumber;
const { ethers, web3 } = require("hardhat");
const {
    time, 
    constants,
  } = require("@openzeppelin/test-helpers");
const ether = require("@openzeppelin/test-helpers/src/ether");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main () {
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