require("@nomicfoundation/hardhat-toolbox");
const { task, subtask } = require("hardhat/config");
const { spawnSync } = require("node:child_process");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { Ethers } = require("./utils/Ethers.js");

const localNetworks = {
    hardhat: {
        gasPrice: 100000000000,
    },
    localhost: {
        url: "http://127.0.0.1:8545/",
        gasPrice: 100000000000,
        timeout: 60000,
    },
};

const publicNetworks = process.env.PRIVATE_KEY && {
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

function isLocalHostAvailable() {
    const { url } = localNetworks.localhost;
    return spawnSync("curl", ["--max-time", "0.1", url]).status === 0;
}

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
    defaultNetwork: isLocalHostAvailable() ? "localhost" : "hardhat",
    networks: {
        ...localNetworks,
        ...publicNetworks,
    }
};

/** @type {{ data: { [network: string]: { [contract: string]: string | undefined } | undefined } }} */
const cache = (() => {
    const file = "./cache/contracts.json";
    if (!existsSync(file)) return { data: {} };
    return { data: JSON.parse(readFileSync(file, "utf8")) };
})();

task("accounts", "shows list of accounts", async (_, { ethers }) => {
    console.log("📖📖📖");
    const accounts = await ethers.getSigners();
    for (const { address, provider } of accounts)
        console.log(`${address}\n${await provider.getBalance(address)}`)
});

task("contracts", "gets and sets contracts addresses")
    .addOptionalPositionalParam("contract", "contract's name", "")
    .addOptionalPositionalParam("address", "contract's address", "")
    .setAction(async ({ contract, address }, { artifacts, network: { name } }) => {
        contract && (await artifacts.artifactExists(contract));
        if (contract && address)
            (cache.data[name] ??= {})[contract] = address;
        console.log((cache.data[name] ?? {})[contract] || cache.data[name]);
    });

task("balance", "get balance of address in ethers")
    .addOptionalPositionalParam("address", "target address", "")
    .setAction(async ({ address }, { ethers }) => {
        const myAddress = (await ethers.provider.getSigner()).address;
        const balanceInWei = await ethers.provider.getBalance(address ? address : myAddress);
        console.log(ethers.formatEther(balanceInWei));
    });

task("deploy", "deploys contract")
    .addPositionalParam("contract", "contract's name")
    .addOptionalPositionalParam("params", "constructor params", "")
    .addOptionalPositionalParam("value", "value to send", "0")
    .setAction(async ({ contract, params, value }, hre) => {
        const paramsArray = !params ? [] : params.split(',');
        const instance = await Ethers.fromHardhat(hre, contract);
        const result = await instance.deploy(paramsArray, value);
        (cache.data[hre.network.name] ??= {})[contract] = result.to ?? "";
        console.log(result);
    });

task("execute", "execute contract's method")
    .addPositionalParam("contract", "contract's name")
    .addPositionalParam("method", "contract's method")
    .addOptionalPositionalParam("params", "constructor params", "")
    .addOptionalPositionalParam("value", "value to send", "0")
    .setAction(async ({ contract, method, params, value }, hre) => {
        const paramsArray = !params ? [] : params.split(',');
        const address = (cache.data[hre.network.name] ?? {})[contract];
        const instance = await Ethers.fromHardhat(hre, contract, address);
        console.log(await instance.execute(method, paramsArray, value));
    });

task("transfer", "transfer value to address")
    .addPositionalParam("address", "target address")
    .addPositionalParam("value", "value in ethers")
    .setAction(async ({ address, value }, hre) => {
        const instance = await Ethers.fromHardhat(hre);
        console.log(await instance.transfer(address, value));
    });

process.on("exit", () => {
    cache.data && writeFileSync("./cache/contracts.json", JSON.stringify(cache.data, null, 4));
})