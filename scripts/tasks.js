const assert = require("node:assert");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { EasyEthers } = require("./EasyEthers.js");
const hre = require("hardhat");

/** @type {(contract: string, address?: string) => string | object } */
function cache(contract, address) {
    const [file, name] = ["./cache/contracts.json", hre.network.name];
    const tryParse = (x) => { try { return x(); } catch { return { [name]: {} }; } };
    const data = tryParse(() => JSON.parse(readFileSync(file, "utf8")));
    if (address) {
        data[name] = { ...data[name], [contract]: address };
        writeFileSync(file, JSON.stringify(data, null, 4));
    }
    return contract ? data[name][contract] : data[name];
}

async function deploy(contract, value, params) {
    const instance = await EasyEthers.fromHardhat(hre, contract);
    return instance.deploy(value, params);
}

async function execute(contract, method, value, params) {
    const address = cache(contract);
    assert(address, "contract address not found");
    const instance = await EasyEthers.fromHardhat(hre, contract, address);
    return instance.execute(method, value, params);
}

async function transfer(address, value) {
    const instance = await EasyEthers.fromHardhat(hre);
    return instance.transfer(address, value);
}

module.exports = { cache, deploy, execute, transfer };