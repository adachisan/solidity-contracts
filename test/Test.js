const hardhat = require("hardhat");
const assert = require("node:assert");
const { EasyEthers } = require("../scripts/easyEthers.js");

describe("Test", function () {
    let contract = /** @type {EasyEthers | null} */(null);
    it("deploy", async function () {
        contract = await EasyEthers.fromHardhat(hardhat, "Test");
        const result = await contract.deploy();
        assert(result.to, "failed to deploy");
    })
    it("random", async function () {
        assert(contract, "contract not deployed");
        const random = (await contract.execute("random")).result;
        assert(random, "failed to get random");
        assert(typeof random == "bigint", "random is not bigint");
        assert(random > 0, "random is zero");
    })
    it("mapping", async function () {
        assert(contract, "contract not deployed");
        const set = await contract.execute("set", ["hello world"], "12.3456");
        assert(set.value ?? "" == EasyEthers.parseEther("12.3456").toString(), "failed to get mapping");
        const [value, time, message] = (await contract.execute("get")).result;
        assert(value == EasyEthers.parseEther("12.3456"), "failed to get value");
        assert(typeof time == 'bigint', "failed to get time");
        assert(message == "hello world", "failed to get message");
        const json = (await contract.execute("json")).result;
        assert(JSON.parse(json).message == "hello world", "failed to get json");
        const base64 = (await contract.execute("base64")).result;
        assert(base64 == `data:application/json;base64,${btoa(json)}`, "failed to get base64");
        const encoded = (await contract.execute("encoded")).result;
        assert(encoded == `data:application/json,${encodeURIComponent(json)}`, "failed to get encoded");
        const log = await contract.execute("log");
        assert(log, "failed to get log");

        // console.dir(set, { depth: null });
        // console.dir(log, { depth: null });
    })
    it("child", async function () {
        assert(contract, "contract not deployed");
        const result = await contract.execute("create");
        assert(result, "failed to get child");

        // console.dir(result);
        // console.dir(await contract.execute("json"));
        // console.dir(await contract.execute("random"));
    })
})