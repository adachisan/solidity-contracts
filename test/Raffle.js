const { ethers, network } = require("hardhat");
const assert = require("node:assert");

/** @typedef {import("ethers").Contract} Contract */
/** @typedef {import("ethers").BaseContract} BaseContract */
/** @typedef {import("ethers").ContractTransactionResponse} ContractTransactionResponse */
/** @typedef {import("ethers").TransactionResponse} TransactionResponse */
/** @typedef {BaseContract & { deploymentTransaction(): ContractTransactionResponse; } & Omit<Contract, keyof BaseContract>} DeployedContract */

describe("Raffle", function () {
    let contract = /** @type {DeployedContract | null} */(null);
    it("deploy", async function () {
        const factory = await ethers.getContractFactory("Raffle");
        contract = await factory.deploy();
        const transaction = contract.deploymentTransaction();
        assert(transaction, "failed to get transaction");
        const receipt = await transaction.wait();
        assert(receipt, "failed to get receipt");
    })
    it("createGame", async function () {
        assert(contract, "contract not deployed");
        const dayTimestamp = 86_400_000;
        const params = ["test description", 35, ethers.parseEther("0.1"), Date.now() + dayTimestamp];
        const args = [...params, { value: ethers.parseEther("0.01"), gasLimit: 3_000_000 }];
        for (let i = 0; i < 3; i++) {
            const result = await contract.createGame.staticCall(...args);
            assert(typeof result == 'bigint', "result is not bigint");
            assert(result > i, `result should be > ${i}`);
            console.log(result);
            const transaction = /** @type {TransactionResponse} */(await contract.createGame(...args));
            const receipt = await transaction.wait();
            assert(receipt, "failed to get receipt");
        }
    })
})