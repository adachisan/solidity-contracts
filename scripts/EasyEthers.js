const assert = require("node:assert");
const ethers = require("ethers").ethers;

class EasyEthers {
    /** @typedef {{from: string, to: string | null, gasUsed: bigint, gasPrice: bigint, fee: string, hash: string, events?: object[]}} TxData*/
    /** @type {ethers.ContractFactory | ethers.BaseContract | undefined} */ contract;
    /** @type {ethers.Signer | ethers.Provider} */ signer;

    /** @param {[rpc?: string, privateKey?: string, abi?: string, bytecode?: string, address?: string]} args */
    constructor(...args) {
        const [rpc, privateKey, abi, bytecode, address] = args;
        if (rpc) return;
        this.signer = new ethers.JsonRpcProvider(rpc);
        if (privateKey) {
            this.signer = new ethers.Wallet(privateKey, this.signer);
        }
        if (abi && bytecode) {
            this.contract = new ethers.ContractFactory(abi, bytecode, this.signer);
            if (address) {
                this.contract = this.contract.attach(address);
            }
        }
    }

    /** @type {(signer: ethers.Signer | ethers.Provider, contract?: ethers.ContractFactory | ethers.BaseContract) => EasyEthers} */
    static from(signer, contract) {
        const instance = new EasyEthers();
        instance.signer = signer;
        instance.contract = contract;
        return instance;
    }

    /** @type {(hardhat: any, contract?: string, address?: string) => Promise<EasyEthers>} */
    static async fromHardhat({ ethers }, contract, address) {
        const instance = new EasyEthers();
        instance.signer = await ethers.provider.getSigner();
        if (contract) {
            instance.contract = await ethers.getContractFactory(contract);
            if (address && instance.contract) {
                instance.contract = instance.contract.attach(address);
            }
        }
        return instance;
    }

    /** @type {(value?: string, params?: string[]) => Promise<TxData>} */
    async deploy(value = "0", params = [], gasLimit = 3_000_000) {
        // assert(this.signer instanceof ethers.Wallet, "no private key registered");
        assert(this.contract, "contract abi and bytecode not set");
        assert(this.contract instanceof ethers.ContractFactory, "contract already deployed");

        const valueToWei = ethers.parseEther(value || "0");
        const args = [...params, { value: valueToWei, gasLimit }];
        this.contract = await this.contract.deploy(...args);
        const transaction = this.contract.deploymentTransaction();
        assert(transaction, "failed to deploy contract");

        const { from, gasPrice, hash } = transaction;
        const receipt = await transaction.wait();
        assert(receipt, "failed to deploy contract");

        const { contractAddress: to, gasUsed, logs } = receipt;
        const fee = ethers.formatEther(gasUsed * gasPrice);
        const events = this.#parseEvents(logs);

        return { from, to, gasUsed, gasPrice, fee, hash, events };
    }

    /** @type {(method: string, value?: string, params?: string[]) => Promise<String | TxData>} */
    async execute(method, value = "0", params = [], gasLimit = 3_000_000) {
        assert(this.contract, "contract abi and bytecode not set");
        assert(this.contract instanceof ethers.BaseContract, "contract not deployed or attached");

        const valueToWei = ethers.parseEther(value || "0");
        const args = [...params, { value: valueToWei, gasLimit }];

        /** @type {ethers.TransactionResponse} */
        const transaction = await this.contract[method](...args);
        const isTransaction = typeof transaction == 'object' && 'provider' in transaction;
        if (!isTransaction) return `${transaction}`;

        const { from, to, gasPrice, hash } = transaction;
        const receipt = await transaction.wait();
        assert(receipt, "failed to send transaction");

        const { gasUsed, logs } = receipt;
        const fee = ethers.formatEther(gasUsed * gasPrice);
        const events = this.#parseEvents(logs);

        return { from, to, gasUsed, gasPrice, fee, hash, events };
    }

    /** @type {(address: string, value?: string) => Promise<TxData>} */
    async transfer(address, value) {
        assert(this.signer.sendTransaction, "no private key registered");

        const valueToWei = ethers.parseEther(value || "0");
        const transaction = await this.signer.sendTransaction({ to: address, value: valueToWei, gasLimit: 3_000_000 });

        const { from, to, gasPrice, hash } = transaction;
        const receipt = await transaction.wait();
        assert(receipt, "failed to send transaction");

        const { gasUsed } = receipt;
        const fee = ethers.formatEther(gasUsed * gasPrice);

        return { from, to, gasUsed, gasPrice, fee, hash }
    }

    /** @type {(logs: readonly any[]) => {[key: string]: string}[]} */
    #parseEvents(logs) {
        return logs.filter(({ fragment }) => fragment?.type == 'event')
            .map(({ fragment: { name }, args }) => ({ [name]: `${args}` }));
    }
}

module.exports = { EasyEthers }