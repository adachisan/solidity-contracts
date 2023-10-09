



/** 
 * gets and sets contracts address on cache
 * @param {string} [contract]
 * @param {string} [address]
 * @returns {string | object}
*/
function cache(contract, address) {
    const { readFileSync, writeFileSync, existsSync } = require("fs");
    const { network } = require("hardhat");

    const [file, name] = ["./cache/contracts.json", network.name];
    const tryParse = (x) => { try { return x(); } catch { return { [name]: {} }; } };
    const data = tryParse(() => JSON.parse(readFileSync(file, "utf8")));

    if (!!address) {
        data[name] = { ...data[name], [contract]: address };
        writeFileSync(file, JSON.stringify(data, null, 4));
    }

    return !!contract ? data[name][contract] : data[name];
}




/**
 * @param {any[]} logs 
 * @returns {{[key: string]: string}[]}
 */
function getEvents(logs) {
    return logs.filter(({ fragment: { type } }) => type === 'event')
        .map(({ fragment: { name }, args }) => ({ [name]: `${args}` }));
}




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




/**
 * deploy's a contract on blockchain
 * @param {String} contract contract's name
 * @param {String} [value] (optional) value to be sent in ethers
 * @param {Array<String>} [params] (optional) params if any for constructor
 * @returns {Promise<TxData>}
 */
async function deploy(contract, value = "0", params = [], gasLimit = 3_000_000) {
    const { ethers } = require("hardhat");

    console.time("🚀🚀🚀");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit }];

    const factory = await ethers.getContractFactory(contract);
    const transaction = (await factory.deploy(...args)).deploymentTransaction();

    const { from, gasPrice, hash } = transaction;
    const { contractAddress: to, gasUsed, logs } = await transaction.wait();
    const fee = ethers.formatEther(gasUsed * gasPrice);
    const events = getEvents(logs);

    console.timeEnd("🚀🚀🚀");

    return { from, to, gasUsed, gasPrice, fee, hash, events };
}




/**
 * runs a contract's method/function
 * @param {String} contract contract's name
 * @param {String} address contract's address
 * @param {String} method method's name
 * @param {String} [value] (optional) value to be sent in ethers
 * @param {Array<String>} [params] (optional) params for the method
 * @returns {Promise<String | TxData>}
 */
async function execute(contract, address, method, value = "0", params = [], gasLimit = 3_000_000) {
    const { ethers } = require("hardhat");

    console.time("📲📲📲");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit }];

    const factory = await ethers.getContractFactory(contract);
    const transaction = await factory.attach(address)[method](...args);

    const isObject = typeof transaction == 'object';
    const isTransaction = isObject && 'provider' in transaction;
    if (!isTransaction) return `${transaction}`;

    const { from, to, gasPrice, hash } = transaction;
    const { gasUsed, logs } = await transaction.wait();;
    const fee = ethers.formatEther(gasUsed * gasPrice);
    const events = getEvents(logs);

    console.timeEnd("📲📲📲");

    return { from, to, gasUsed, gasPrice, fee, hash, events };
}



/**
 * runs a contract's method/function
 * @param {String} address contract's address
 * @param {String} value value to be sent in ethers
 * @returns {Promise<TxData>}
 */
async function send(address, value) {
    const { ethers } = require("hardhat");

    console.time("💸💸💸");

    const valueToWei = ethers.parseEther(value || "0");
    const singer = await ethers.provider.getSigner();
    const transaction = await singer.sendTransaction({ to: address, value: valueToWei });
    const { from, to, gasPrice, hash } = transaction;
    const { gasUsed } = await transaction.wait();
    const fee = ethers.formatEther(gasUsed * gasPrice);

    console.timeEnd("💸💸💸");

    return { from, to, gasUsed, gasPrice, fee, hash }
}




module.exports = { cache, deploy, execute, send };