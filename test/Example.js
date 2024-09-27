const { ethers, network } = require("hardhat");
const assert = require("node:assert");

/** @typedef {import("ethers").Contract} Contract */
/** @typedef {import("ethers").BaseContract} BaseContract */
/** @typedef {import("ethers").ContractTransactionResponse} ContractTransactionResponse */
/** @typedef {import("ethers").TransactionResponse} TransactionResponse */
/** @typedef {BaseContract & { deploymentTransaction(): ContractTransactionResponse; } & Omit<Contract, keyof BaseContract>} DeployedContract */

describe("Example", function () {
    let contract = /** @type {DeployedContract | null} */(null);
    it("deploy", async function () {
        const factory = await ethers.getContractFactory("Example");
        contract = await factory.deploy();
        const transaction = contract.deploymentTransaction();
        assert(transaction, "failed to get transaction");
        const receipt = await transaction.wait();
        assert(receipt, "failed to get receipt");
    })
    it("random", async function () {
        assert(contract, "contract not deployed");
        const random = await contract.random();
        assert(random, "failed to get random");
        assert(typeof random == "bigint", "random is not bigint");
        assert(random > 0, "random is zero");
    })
    it("mapping", async function () {
        assert(contract, "contract not deployed");
        const set = await contract.set(13, 44);
        assert(set, "failed to get mapping");
        const get = await contract.get();
        assert.deepEqual(get, [13n, 44n], "failed to get mapping");
    })
    it("createContract", async function () {
        assert(contract, "contract not deployed");
        const createContract = await contract.createContract();
        assert(createContract, "failed to create contract");
    })
})