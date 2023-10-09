# Collection of Solidity smart contracts.

Solidity is a programming language used for writing smarts contracts on EVM (Ethereum Virtual Machine) compatible blockchains.
These smart contracts are scripts deployed on blockchain that executes methods when requested.
This repository includes various types of contracts such as tokens, staking, betting, and more.

`commands:`

- init localhost network on windows
```bash
start npx hardhat node 
```

- init localhost network on mac/linux
```bash
npx hardhat node &
```

- clear cache and artifacts
```bash
npx hardhat clean
```

- compile contracts on /contracts dir
```bash
npx hardhat compile
```

- shows all accounts and balance of current network
```bash
npx hardhat accounts
```

- defines contact and address of current context
```bash
npx hardhat contract --contract --address
```

- deploys contract from current context
```bash
npx hardhat deploy --contract --value --params
```

- execute contract from current context
```bash
npx hardhat execute --contract --method --value --params
```
