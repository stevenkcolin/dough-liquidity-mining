require("dotenv").config();
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-typechain";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-web3";

import { task } from "hardhat/config";



const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const KOVAN_PRIVATE_KEY = process.env.KOVAN_PRIVATE_KEY || "";
const KOVAN_PRIVATE_KEY_SECONDARY = process.env.KOVAN_PRIVATE_KEY_SECONDARY || "";
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY || "";
const RINKEBY_PRIVATE_KEY_SECONDARY = process.env.RINKEBY_PRIVATE_KEY_SECONDARY || "";
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || "";
const MAINNET_PRIVATE_KEY_SECONDARY = process.env.MAINNET_PRIVATE_KEY_SECONDARY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "";
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY || "";
const ROPSTEN_PRIVATE_KEY_SECONDARY = process.env.ROPSTEN_PRIVATE_KEY_SECONDARY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.5.12",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      blockGasLimit: 7612388,
      gas: 7612388,
      gasPrice: 20000000000,
      // accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
      accounts: [
        ROPSTEN_PRIVATE_KEY,
        ROPSTEN_PRIVATE_KEY_SECONDARY
      ].filter((item) => item !== "")
    },
    frame: {
      url: "http://localhost:1248"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
};

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});


export default config;