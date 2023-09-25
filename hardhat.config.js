const { task, subtask, types } = require("hardhat/config");

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
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
    }
  }
};



task("accounts", "shows list of accounts", async (args, { ethers }) => {
  const private = process.env.PRIVATE_KEY || "";
  !!private && console.log("Personal accounts: ");
  !!private && console.log(new ethers.Wallet(private).address);
  !!private && console.log(await ethers.provider.getBalance(new ethers.Wallet(private).address));

  console.log("Hardhat accounts: ");
  const accounts = await ethers.getSigners();
  accounts.forEach(async ({ address, provider }) => console.log(`${address}: ${await provider.getBalance(address)}`));
});



task("deploy", "deploys contract")
  .addPositionalParam("contract", "contract's name")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, value, params }) => {
    const { deploy } = require('./scripts/tasks.js');
    const paramsArray = !params ? [] : params.split(',');
    const response = await deploy(contract, value, paramsArray);
    console.log(response);
  });



task("execute", "execute contract's method")
  .addPositionalParam("contract", "contract's name")
  .addPositionalParam("address", "contract's address")
  .addPositionalParam("method", "contract's method")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, address, method, value, params }) => {
    const { execute } = require('./scripts/tasks.js');
    const paramsArray = !params ? [] : params.split(',');
    const response = await execute(contract, address, method, value, paramsArray);
    console.log(response);
  });



// task("x")
//   .addPositionalParam("subTask")
//   .addPositionalParam("msg")
//   .setAction(async ({ subTask, msg }, hre) => await hre.run(subTask, { msg }));
// subtask("a")
//   .addPositionalParam("msg")
//   .setAction(async ({ msg }) => console.log("a: " + msg));
// subtask("b")
//   .addPositionalParam("msg")
//   .setAction(async ({ msg }) => console.log("b: " + msg));



task("estimate:deploy", "estimates deploy cost")
  .addPositionalParam("contract", "contract's name")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, value, params }) => {
    const { estimate } = require('./scripts/tasks.js');
    const paramsArray = !params ? [] : params.split(',');
    const response = await (await estimate(contract)).deploy(value, paramsArray);
    console.log(response);
  });

task("estimate:execute", "estimates execution cost")
  .addPositionalParam("contract", "contract's name")
  .addPositionalParam("address", "contract's address")
  .addPositionalParam("method", "contract's method")
  .addOptionalPositionalParam("value", "value to send", "0")
  .addOptionalPositionalParam("params", "constructor params", "")
  .setAction(async ({ contract, address, method, value, params }) => {
    const { estimate } = require('./scripts/tasks.js');
    const paramsArray = !params ? [] : params.split(',');
    const response = await (await estimate(contract)).execute(address, method, value, paramsArray);
    console.log(response);
  });
