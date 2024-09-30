require("@nomicfoundation/hardhat-toolbox");
const { task, subtask } = require("hardhat/config");
const { spawnSync } = require("node:child_process");

const networks = {
    hardhat: {
        gasPrice: 100000000000,
    },
    localhost: {
        url: "http://127.0.0.1:8545/",
        gasPrice: 100000000000,
        timeout: 60000,
    },
};

const privateNetworks = process.env.PRIVATE_KEY && {
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
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.27",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    defaultNetwork: spawnSync("curl", ["--max-time", "0.1", networks.localhost.url]).status ? "hardhat" : "localhost",
    networks: {
        ...networks,
        ...privateNetworks,
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
        contract && (await artifacts.artifactExists(contract));
        const { cache } = require('./scripts/tasks.js');
        const response = cache(contract, address);
        console.log(response);
    });

task("balance", "get balance of address in ethers")
    .addOptionalPositionalParam("address", "target address", "")
    .setAction(async ({ address }, { ethers }) => {
        console.log("🤑🤑🤑");
        const myAddress = (await ethers.provider.getSigner()).address;
        const balanceInWei = await ethers.provider.getBalance(address ? address : myAddress);
        const balanceInEthers = ethers.formatEther(balanceInWei);
        console.log(balanceInEthers);
    });

task("deploy", "deploys contract")
    .addPositionalParam("contract", "contract's name")
    .addOptionalPositionalParam("params", "constructor params", "")
    .addOptionalPositionalParam("value", "value to send", "0")
    .setAction(async ({ contract, params, value }, hre) => {
        const { deploy } = require('./scripts/tasks.js');
        const paramsArray = !params ? [] : params.split(',');
        console.log(await deploy(contract, paramsArray, value));
    });

task("execute", "execute contract's method")
    .addPositionalParam("contract", "contract's name")
    .addPositionalParam("method", "contract's method")
    .addOptionalPositionalParam("params", "constructor params", "")
    .addOptionalPositionalParam("value", "value to send", "0")
    .setAction(async ({ contract, method, params, value }, hre) => {
        const { execute } = require('./scripts/tasks.js');
        const paramsArray = !params ? [] : params.split(',');
        console.log(await execute(contract, method, paramsArray, value));
    });

task("transfer", "transfer value to address")
    .addPositionalParam("address", "target address")
    .addPositionalParam("value", "value in ethers")
    .setAction(async ({ address, value }) => {
        const { transfer } = require('./scripts/tasks.js');
        console.log(await transfer(address, value));
    });