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
    it("creategame", async function () {
        assert(contract, "contract not deployed");
        const args = ["game description", 50, Ethers.parseEther("10000"), 5_000];
        const creategame = await contract.execute("createGame", args, "10");
        console.dir(creategame, { depth: null });
        assert(creategame.result > 0, "game not counted");
        const getGameJson = await contract.execute("getGameJson", [creategame.result]);
        const json = JSON.parse(getGameJson.result);
        console.dir(json, { depth: null });
    })
})