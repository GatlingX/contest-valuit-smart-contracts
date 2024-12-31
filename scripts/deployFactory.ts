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
    const [deployer] = await ethers.getSigners();
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

    const IMPLAUTH = await ethers.getContractFactory("TREXImplementationAuthority");
    const IAFACTORY = await ethers.getContractFactory("IAFactory");
    const TREXFACTORY = await ethers.getContractFactory("TREXFactory");
    const TOKENIMPL = await ethers.getContractFactory("Token");
    const CTR = await ethers.getContractFactory("ClaimTopicsRegistry");
    const IR = await ethers.getContractFactory("IdentityRegistry");
    const IRS = await ethers.getContractFactory("IdentityRegistryStorage");
    const TIR = await ethers.getContractFactory("TrustedIssuersRegistry");
    const COMPLIANCE = await ethers.getContractFactory("ModularCompliance");
    const WRAPPER = await ethers.getContractFactory("Wrapper");

    let time = 5000;

    // deploy TREXCONTRACTS see ITREXImplementationAuthority.sol interface for implementation struct details
    let tir = await TIR.deploy();
    await tir.deployed();
    console.log("TIR: ", tir.address);
    await sleep(time);
    let tirInitTx = await tir.init();
    await tirInitTx.wait();
    console.log("TIR impl initialized");
    await sleep(time);
   
    
    let ctr = await CTR.deploy();
    await ctr.deployed();
    console.log("CTR: ", ctr.address);
    await sleep(time);
    let ctrInitTx = await ctr.init();
    await ctrInitTx.wait();
    console.log("CTR impl initialized");
    await sleep(time);


    let irs = await IRS.deploy();
    await irs.deployed();
    console.log("IRS: ", irs.address);
    await sleep(time);
    let irsInitTx = await irs.init();
    await irsInitTx.wait();
    console.log("IRS impl initialized");
    await sleep(time);
  

    let ir = await IR.deploy();
    await ir.deployed();
    console.log("IR: ", ir.address);
    await sleep(time);
    let irInitTx = await ir.init(tir.address, ctr.address, irs.address);
    await irInitTx.wait();
    console.log("IR impl initialized");
    await sleep(time);
 

    let compliance = await COMPLIANCE.deploy();
    await compliance.deployed();
    console.log("Compliance: ", compliance.address);
    await sleep(time);
    let complianceInitTx = await compliance.init();
    await complianceInitTx.wait();
    console.log("Compliance impl initialized");
    await sleep(time);
   

    let token = await TOKENIMPL.deploy();
    await token.deployed();
    console.log("Token Implementation: ", token.address);
    await sleep(time);
    //TODO change symbol and name to "reference" ? 
    let tokenInitTx = await token.init(ir.address, compliance.address, "dead", "dead", 18, ZERO_ADDRESS);
    await tokenInitTx.wait();
    console.log("Token impl initialized");
    await sleep(time);


    // //TREXContracts
    let TREXcontracts = {
        tokenImplementation: token.address,
        ctrImplementation: ctr.address,
        irImplementation: ir.address,
        irsImplementation: irs.address,
        tirImplementation: tir.address,
        mcImplementation: compliance.address
    }

    //TREXVersion
    let TREXversion = {
        major: 4,
        minor: 0,
        patch: 0
    }

    // deploy implementation authority
    let implementationAuth = await IMPLAUTH.deploy(true, ZERO_ADDRESS, ZERO_ADDRESS);
    await implementationAuth.deployed();
    await sleep(time);
    console.log("Reference Impl Auth : ", implementationAuth.address);
    let addAndUseTx = await implementationAuth.addAndUseTREXVersion(TREXversion, TREXcontracts);
    await addAndUseTx.wait();
    console.log("addAndUseTREXVersion success", );
    await sleep(time);

    // deploy and set up TREX Token Factory
    let trexFactory = await TREXFACTORY.deploy(implementationAuth.address,"0x25eFD929b52E4e22F6F2bcf67F8AAf5625cB7b78", "0x29C17871974e554EcCF13EAFF52ff3E516352e59");
    await trexFactory.deployed();
    console.log("TREX Factory: ", trexFactory.address);
    await sleep(time);

    // deploy IAFactory
    let iaFactory = await IAFACTORY.deploy(trexFactory.address);
    await iaFactory.deployed();
    console.log("IAFactory :", iaFactory.address);
    await sleep(time);

    //set up implementation authority
    let setTrexTx = await implementationAuth.setTREXFactory(trexFactory.address);
    await setTrexTx.wait();
    console.log("IAFactory: setTREXFactory success");
    await sleep(time);
    let setIaFactTx = await implementationAuth.setIAFactory(iaFactory.address);
    await setIaFactTx.wait();
    console.log("IAFactory: setIAFactory success");
    await sleep(time);

    //deploy Compliance Modules
    const CountryAllowModule = await ethers.getContractFactory("CountryAllowModule");
    let countryallow = await CountryAllowModule.deploy();
    await countryallow.deployed();
    console.log("Country Allow Module: ",countryallow.address);
    await sleep(time);

    const SupplyLimitModule = await ethers.getContractFactory("SupplyLimitModule");
    let supplylimit = await SupplyLimitModule.deploy();
    await supplylimit.deployed();
    console.log("Supply Limit Module: ",supplylimit.address);
    await sleep(time);


    const MaxBalanceModule = await ethers.getContractFactory("MaxBalanceModule");
    let maxbalance = await MaxBalanceModule.deploy();
    await maxbalance.deployed();
    console.log("Max Balance Module: ",maxbalance.address);
    await sleep(time);


    const HoldTimeModule = await ethers.getContractFactory("HoldTimeModule");
    let holdtime = await HoldTimeModule.deploy();
    await holdtime.deployed();
    console.log("Hold Time Module: ",holdtime.address);
    await sleep(time);

    const CountryRestrictModule = await ethers.getContractFactory("CountryRestrictModule");
    let countryrestrict = await CountryRestrictModule.deploy();
    await countryrestrict.deployed();
    console.log("Country Restrict Module: ", countryrestrict.address);
    await sleep(time);





    

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });