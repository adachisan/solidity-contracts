const hardhat = require("hardhat");
const assert = require("node:assert");
const { Ethers } = require("../utils/Ethers.js");

describe("Raffle", function () {
    let contract = /** @type {Ethers | null} */(null);
    it("deploy", async function () {
        contract = await Ethers.fromHardhat(hardhat, "Raffle");
        const deploy = await contract.deploy();
        assert(deploy.to, "failed to deploy");
    })
})