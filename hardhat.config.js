const { task, subtask } = require("hardhat/config");
const tasks = require('./scripts/tasks.js');
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();




/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gasPrice: 100000000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      gasPrice: 100000000000,
      timeout: 60000,
    },
    bnb: {
      url: "https://bsc-dataseed.bnbchain.org/",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
    },
    bnb_test: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
    },
    harmony: {
      url: "https://api.harmony.one",
      chainId: 1666600000,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
    },
    harmony_test: {
      url: "https://api.s0.b.hmny.io",
      chainId: 1666700000,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
    },
    posi: {
      url: "https://api.posichain.org/",
      chainId: 900000,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000,
    },
  }
};





task("accounts", "shows list of accounts", async (_, { ethers }) => {
  console.log("📖📖📖");
  const accounts = await ethers.getSigners();
  for (const { address, provider } of accounts)
    console.log(`${address}\n${await provider.getBalance(address)}`)
});




task("contracts", "gets and sets contracts addresses")
  .addOptionalPositionalParam("contract", "contract's name", "")
  .addOptionalPositionalParam("address", "contract's address", "")
  .setAction(async ({ contract, address }, { artifacts }) => {
    console.log("📁📁📁");
    !!contract && (await artifacts.artifactExists(contract));
    const response = tasks.cache(contract, address);
    console.log(response);
  });




task("send", "sends value to address")
  .addPositionalParam("value", "value in ethers")
  .addPositionalParam("address", "target address")
  .setAction(async ({ value, address }) => {
    const response = await tasks.send(address, value);
    console.log(response);
  });




task("balance", "get balance of address in ethers")
  .addPositionalParam("address", "target address")
  .setAction(async ({ address }, { ethers }) => {
    console.log("🤑🤑🤑");
    const balanceInWei = await ethers.provider.getBalance(address);
    const balanceInEthers = ethers.formatEther(balanceInWei);
    console.log(balanceInEthers);
  });




task("deploy", "deploys contract")
  .addPositionalParam("contract", "contract's name")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, value, params }, hre) => {
    const paramsArray = !params ? [] : params.split(',');
    const response = await tasks.deploy(contract, value, paramsArray);
    tasks.cache(contract, response.to);
    console.log(response);
  });




task("execute", "execute contract's method")
  .addPositionalParam("contract", "contract's name")
  .addPositionalParam("method", "contract's method")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, method, value, params }, hre) => {
    const paramsArray = !params ? [] : params.split(',');
    const address = tasks.cache(contract);
    if (!address) throw Error("contract address not found");
    const response = await tasks.execute(contract, address, method, value, paramsArray);
    console.log(response);
  });



