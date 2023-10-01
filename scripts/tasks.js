const { ethers, network, artifacts } = require("hardhat");




/**
 * solution for hardhat.ethers errors on custom networks
 * - fix: not returning gasPrice from receipt object
 * - fix: not finding estimateGas method on provider object
 * @param {string} contract
 */
async function hardhatFix(contract) {
    if (network.name == "hardhat" || !network.name) {
        const provider = ethers.provider;
        const signer = await ethers.provider.getSigner();
        const factory = await ethers.getContractFactory(contract, signer);
        return { provider, signer, factory };
    }

    const provider = new ethers.JsonRpcProvider(network.config["url"]);
    const signer = new ethers.Wallet(network.config.accounts[0], provider);
    const factory = await ethers.getContractFactory(contract, signer);

    return { provider, signer, factory };
}




/**
 * estimates contract's deploy/execution cost
 * @param {String} contract contract's name
 */
async function estimate(contract) {
    console.time("estimate");

    const { provider, factory } = await hardhatFix(contract);
    const { gasPrice } = await provider.getFeeData();

    function args(value = "0", params = []) {
        const valueToWei = ethers.parseEther(value || "0");
        return [...params, { value: valueToWei, gasLimit: 3_000_000 }];
    }

    /**
     * estimates contract's deploy cost
     * @param {String} [value] (optional) value to be paid in ethers
     * @param {Array<String>} [params] (optional) params for constructor
     */
    async function deploy(value = "0", params = []) {
        const transation = await factory.getDeployTransaction(...args(value, params));
        const gasUsed = await provider.estimateGas(transation);
        const fee = ethers.formatEther(gasUsed * gasPrice);
        return { gasUsed, gasPrice, fee }
    }

    /**
     * estimates contract's execution cost
     * @param {String} [address] contract's address
     * @param {String} [method] method's name
     * @param {String} [value] (optional) value to be paid in ethers
     * @param {Array<String>} [params] (optional) params for method
     */
    async function execute(address, method, value = "0", params = []) {
        const _contract = factory.attach(address);
        const gasUsed = await _contract[method].estimateGas(...args(value, params));
        const fee = ethers.formatEther(gasUsed * gasPrice);
        return { gasUsed, gasPrice, fee }
    }

    console.timeEnd("estimate");
    return { deploy, execute }
}




/**
 * deploy's a contract on blockchain
 * @param {String} contract contract's name
 * @param {String} [value] (optional) value to be paid in ethers
 * @param {Array<String>} [params] (optional) params if any for constructor
 * @returns {Promise<{from: String, gasUsed: BigInt, gasPrice: BigInt, fee: String, contractAddress: String, hash: String}>} object of response
 */
async function deploy(contract, value = "0", params = []) {
    console.time("deploy");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit: 3_000_000 }];

    const { factory } = await hardhatFix(contract);
    const transaction = await factory.deploy(...args);

    const receipt = await transaction.deploymentTransaction().wait();
    const { hash, from, gasPrice, contractAddress, gasUsed } = receipt;
    const fee = ethers.formatEther(gasUsed * gasPrice);

    console.timeEnd("deploy");
    return { from, gasUsed, gasPrice, fee, hash, contractAddress };
}




/**
 * runs a contract's method/function
 * @param {String} contract contract's name
 * @param {String} address contract's address
 * @param {String} method method's name
 * @param {String} [value] (optional) value to be paid in ethers
 * @param {Array<String>} [params] (optional) params for the method
 * @returns {Promise<String|{from: String, gasUsed: BigInt, gasPrice: BigInt, fee: String,hash: String, events: Array<any>}>} object of response
 */
async function execute(contract, address, method, value = "0", params = []) {
    console.time("execute");

    const valueToWei = ethers.parseEther(value || "0");
    const args = [...params, { value: valueToWei, gasLimit: 3_000_000 }];

    const { factory } = await hardhatFix(contract);
    const transaction = await factory.attach(address)[method](...args);

    const isObject = typeof transaction == 'object';
    const isTransaction = isObject && 'provider' in transaction;
    if (!isTransaction) return `${transaction}`;

    const { from, gasUsed, gasPrice, hash, logs } = await transaction.wait();;
    const fee = ethers.formatEther(gasUsed * gasPrice);
    const events = logs
        .filter(({ fragment: { type } }) => type === 'event')
        .map(({ fragment: { name }, args }) => ({ [name]: `${args}` }));

    console.timeEnd("execute");
    return { from, gasUsed, gasPrice, fee, hash, events };
}




module.exports = { estimate, deploy, execute };