/** @type {(condition: any, message?: string) => asserts condition} */
const assert = (condition, message) => condition || (() => { throw new Error(message || "") })();

//TODO: change this class name and TxData name
class EasyEthers {
    /** @import * as Ethers from "ethers" */
    /** @import * as Hardhat from "hardhat" */
    /** @typedef {{network: string, from?: string, to?: string | null, value?: bigint, gasUsed?: bigint, gasPrice?: bigint, fee?: bigint, hash?: string, result?: any, events?: Object<string, any>}} TxData*/
    /** @typedef {Ethers.ContractFactory | Ethers.BaseContract} Contract */
    /** @typedef {Ethers.Signer | Ethers.Provider} Signer */
    /** @type {Contract | undefined} */ contract;
    /** @type {Signer | undefined} */ signer;

    /** @param {[signer: Signer, contract?: Contract]} args */
    constructor(...args) {
        const [signer, contract] = args;
        this.signer = signer;
        this.contract = contract;
    }

    /** @type {(hardhat: Hardhat, contractName?: string, contractAddress?: string) => Promise<EasyEthers>} */
    static async fromHardhat({ ethers }, contractName, contractAddress) {
        const instance = new EasyEthers(await ethers.provider.getSigner());
        if (contractName) {
            instance.contract = await ethers.getContractFactory(contractName);
            if (contractAddress && instance.contract) {
                instance.contract = instance.contract.attach(contractAddress);
            }
        }
        return instance;
    }

    /** @type {(ether: string, decimal?: number) => bigint} */
    static parseEther(ether, decimal = 18) {
        assert(typeof ether == "string" && !isNaN(Number(ether)), "invalid ether value");
        const [first, second = ''] = ether.trim().split('.');
        const value = BigInt(first) * BigInt(10 ** decimal);
        const fraction = BigInt(second.padEnd(decimal, '0').slice(0, decimal));
        return value + fraction;
    }

    /** @type {(wei: bigint, decimal?: number) => string} */
    static formatEther(wei, decimal = 18) {
        assert(typeof wei == "bigint", "invalid wei value");
        const value = wei / BigInt(10 ** decimal);
        const fraction = `${wei % BigInt(10 ** decimal)}`.padStart(decimal, '0');
        return `${value}.${fraction.slice(0, decimal)}`;
    }

    /** @type {(params?: string[], value?: string | bigint, gasLimit?: number) => Promise<TxData>} */
    async deploy(params = [], value = "0", gasLimit = 3_000_000) {
        assert(this.contract, "contract abi and bytecode not set");
        assert('deploy' in this.contract, "contract already deployed");
        assert(this.signer, "signer not set");
        assert(this.signer.provider, "no provider registered");
        assert(this.signer.sendTransaction, "no private key registered");

        const network = (await this.signer.provider.getNetwork()).name;
        typeof value == 'string' && (value = EasyEthers.parseEther(value));
        const args = [...params, { value, gasLimit }];
        this.contract = await this.contract.deploy(...args);
        assert(this.contract, "failed to deploy contract");
        const transaction = this.contract.deploymentTransaction();
        assert(transaction, "failed to get transaction");
        const receipt = await transaction.wait();
        assert(receipt, "failed to get receipt");

        const { from, contractAddress: to, gasUsed, gasPrice, fee, logs, hash } = receipt;
        return { network, from, to, value, gasUsed, gasPrice, fee, hash, events: this.#parseEvents(logs) };
    }

    //TODO: decide if Result will be string or list
    /** @type {(method: string, params?: any[], value?: string | bigint, gasLimit?: number) => Promise<TxData>} */
    async execute(method, params = [], value = "0", gasLimit = 3_000_000) {
        assert(this.contract, "contract abi and bytecode not set");
        assert('getFunction' in this.contract, "contract not deployed or attached");
        assert(this.signer, "signer not set");
        assert(this.signer.provider, "no provider registered");

        const network = (await this.signer.provider.getNetwork()).name;
        typeof value == 'string' && (value = EasyEthers.parseEther(value));
        const args = [...params, { value, gasLimit }];
        const result = await this.contract[method].staticCall(...args);
        /** @type {import("ethers").ethers.TransactionResponse?} */
        const transaction = await this.contract[method](...args);
        assert(transaction, "failed to execute method");
        if (transaction["wait"] == undefined)
            return { network, result: transaction };
        const receipt = await transaction.wait();
        assert(receipt, "failed to get receipt");

        const { from, to, gasUsed, gasPrice, fee, hash, logs } = receipt;
        return { network, from, to, value, gasUsed, gasPrice, fee, hash, result, events: this.#parseEvents(logs) };
    }

    /** @type {(address: string, value: string | bigint, gasLimit?: number) => Promise<TxData>} */
    async transfer(address, value, gasLimit = 3_000_000) {
        assert(this.signer, "signer not set");
        assert(this.signer.provider, "no provider registered");
        assert(this.signer.sendTransaction, "no private key registered");

        const network = (await this.signer.provider.getNetwork()).name;
        typeof value == 'string' && (value = EasyEthers.parseEther(value));
        const transaction = await this.signer.sendTransaction({ to: address, value, gasLimit });
        assert(transaction, "failed to send value");
        const receipt = await transaction.wait();
        assert(receipt, "failed to get receipt");

        const { from, to, gasUsed, gasPrice, fee, hash, logs } = receipt;
        return { network, from, to, value, gasUsed, gasPrice, fee, hash, events: this.#parseEvents(logs) };
    }

    //TODO: decide if Result will be string or list
    /** @type {(logs: readonly any[]) => {[event: string]: any}} */
    #parseEvents(logs) {
        /** @type {(args: any[]) => any} */
        const spread = (args) => args.length == 1 ? args[0] : args;
        return logs.filter(({ fragment }) => fragment?.type == 'event')
            .reduce((acc, { fragment: { name }, args }) => ({ ...acc, [name]: spread(args) }), {});
    }
}

module.exports = { EasyEthers }
