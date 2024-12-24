import '@xyrusworx/hardhat-solidity-json';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
import '@openzeppelin/hardhat-upgrades';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
// import '@primitivefi/hardhat-dodoc';
import "hardhat-contract-sizer";
import dotenv from "dotenv";
import 'solidity-coverage';


require("hardhat-contract-sizer");
dotenv.config();


export default {
  
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
        optimizer: {
          enabled: true,
          runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: '0.8.20',
        settings: {
        optimizer: {
          enabled: true,
          runs: 200,
          },
          viaIR: true,
        },
      },
    
  ]
  },
  
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,      
    },
    basetest:{
      url: `${process.env.BASE_URL}`,
      accounts:[`0x${process.env.PVTKEY}`],
      timeout: 2000000,
    },
    
  },
  etherscan: {
    apiKey: {
      // avalanche: `${process.env.AVAX_API}`,
      "base-sepolia": `${process.env.BASE_API}`,
      
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
         apiURL: "https://api-sepolia.basescan.org/api",
         browserURL: "https://sepolia.basescan.org"
        }
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  gasReporter: {
    enabled: false,
  },

  mocha: {
    timeout: 2000000,
  },
}


