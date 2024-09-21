const assert = require("assert");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { ethers, network } = require("hardhat");

/** @typedef {import("ethers").TransactionResponse} TransactionResponse */
/**
 * @typedef {Object} TxData
 * @property {string} from address that executed the transaction
 * @property {string} to contract/target address
 * @property {BigInt} gasUsed amount of gas used
 * @property {BigInt} gasPrice gas price of current network
 * @property {string} fee cost of the transaction in ethers
 * @property {string} hash hash of the transaction
 * @property {object[]} [events] list of events emitted from contract
 */

/** @type {(contract: string, address?: string) => string | object } */
function cache(contract, address) {
    assert(contract, "missing contract name");
    const [file, name] = ["./cache/contracts.json", network.name];
    const tryParse = (x) => { try { return x(); } catch { return { [name]: {} }; } };
    const data = tryParse(() => JSON.parse(readFileSync(file, "utf8")));
    if (address) {
        data[name] = { ...data[name], [contract]: address };
        writeFileSync(file, JSON.stringify(data, null, 4));
    }
    return contract ? data[name][contract] : data[name];
}

/** @type {(logs: readonly any[]) => {[key: string]: string}[]} */
function getEvents(logs) {
    return logs.filter(({ fragment }) => fragment?.type == 'event')
        .map(({ fragment: { name }, args }) => ({ [name]: `${args}` }));
}

/** @type {(contract: string, value?: string, params?: string[]) => Promise<TxData>} */
async function deploy(contract, value = "0", params = [], gasLimit = 3_000_000) {
    console.time("🚀🚀🚀");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit }];
    const factory = await ethers.getContractFactory(contract);
    const transaction = (await factory.deploy(...args)).deploymentTransaction();
    assert(transaction, "failed to deploy contract");
    const { from, gasPrice, hash } = transaction;
    const receipt = await transaction.wait();
    assert(receipt, "failed to deploy contract");
    const { contractAddress: to, gasUsed, logs } = receipt;
    const fee = ethers.formatEther(gasUsed * gasPrice);
    const events = getEvents(logs);

    console.timeEnd("🚀🚀🚀");

    return { from, to: to ?? "unknown", gasUsed, gasPrice, fee, hash, events };
}

/** @type {(contract: string, address: string, method: string, value?: string, params?: string[]) => Promise<String | TxData>} */
async function execute(contract, address, method, value = "0", params = [], gasLimit = 3_000_000) {
    console.time("📲📲📲");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit }];
    const factory = await ethers.getContractFactory(contract);
    /** @type {TransactionResponse} */
    const transaction = await factory.attach(address)[method](...args);
    const isObject = typeof transaction == 'object';
    const isTransaction = isObject && 'provider' in transaction;
    if (!isTransaction) return `${transaction}`;
    const { from, to, gasPrice, hash } = transaction;
    const receipt = await transaction.wait();
    assert(receipt, "failed to send transaction");
    const { gasUsed, logs } = receipt;
    const fee = ethers.formatEther(gasUsed * gasPrice);
    const events = getEvents(logs);

    console.timeEnd("📲📲📲");

    return { from, to: to ?? "unknown", gasUsed, gasPrice, fee, hash, events };
}

/** @type {(address: string, value?: string) => Promise<TxData>} */
async function send(address, value) {
    console.time("💸💸💸");

    const valueToWei = ethers.parseEther(value || "0");
    const singer = await ethers.provider.getSigner();
    const transaction = await singer.sendTransaction({ to: address, value: valueToWei });
    const { from, to, gasPrice, hash } = transaction;
    const receipt = await transaction.wait();
    assert(receipt, "failed to send transaction");
    const { gasUsed } = receipt;
    const fee = ethers.formatEther(gasUsed * gasPrice);

    console.timeEnd("💸💸💸");

    return { from, to: to ?? "unknown", gasUsed, gasPrice, fee, hash }
}

module.exports = { cache, deploy, execute, send };