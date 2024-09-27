// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint);
    function burnOrigin(uint _amount) external returns (bool);
    function mint(address _to, uint _amount) external returns (bool);
}

contract Example {
    using Strings for *;

    event constructorEvent(string);

    constructor() payable {
        string memory message = string(abi.encodePacked("test contract created at ", block.number.toString()));
        emit constructorEvent(message);
    }

    function random() public view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }

    function burnToken(address _address, uint _amount) external {
        IERC20 token = IERC20(_address);
        require(token.burnOrigin(_amount));
    }

    //loop performance testing
    function loop_slow() external view returns (uint i) {
        for (i = 0; i < 1 ether; ++i) {
            if (gasleft() < 1000) break;
        }
    }

    function loop_fast() external view returns (uint i) {
        do {
            unchecked { ++i; }
            if (gasleft() < 1000) break;
        } while (i < 1 ether);
    }

    //mapping cost testing
    mapping(address => Data) public data;
    struct Data { uint a; uint b; }

    function set(uint _a, uint _b) external {
        data[msg.sender] = Data(_a, _b);
    }

    function get() external view returns (Data memory) {
        return data[msg.sender];
    }

    //child contract testing
    event CreateContract(address);

    function createContract() external {
        Child_contract child = new Child_contract();
        address child_address = address(child);
        emit CreateContract(child_address);
    }

    function executeContract(address _contract) external view returns (string memory) {
        return Child_contract(_contract).message();
    }
}

contract Child_contract {
    using Strings for *;
    address public immutable father = msg.sender;
    address public immutable creator = tx.origin;
    uint public immutable number = block.number;
    uint public immutable birth = block.timestamp;

    function message() external view returns (string memory) {
        return string(abi.encodePacked("this is a child contract made from ", father.toHexString(), " by ", creator.toHexString(), " created in ", birth.toString(), " on block number ", number.toString()));
    }
}
