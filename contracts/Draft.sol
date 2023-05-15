// SPDX-License-Identifier: MIT
pragma solidity >= 0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint);
    function burnOrigin(uint _amount) external returns (bool);
    function mint(address _to, uint _amount) external returns (bool);
}

contract Functions {
    using Strings for uint;
    address public immutable owner = msg.sender;
    mapping(address => Data) public data;
    struct Data { uint a; uint b; }

    function random() public view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.number, msg.sender)));
    }

    function createContract() external returns (address) {
        return address(new Functions_Child(msg.sender));
    }

    function executeContract(address _contract) external view returns (address) {
        return Functions_Child(_contract).origin();
    }

    function withdraw(uint _amount) external onlyOwner {
        require(address(this).balance >= _amount, "withdraw");
        payable(msg.sender).transfer(_amount);
    }

    function destroy() external {
        selfdestruct(payable(owner));
    }

    function burnToken(uint _amount) external  {
        IERC20 token = IERC20(0xb40E1013e3DddF1E6c86A6D676CF7Fdd850928BA);
        require(token.burnOrigin(_amount));
    }

    function loop1() external view returns (uint i) {
        for (i = 0; i < 1 ether; ++i) {
            if (gasleft() < 1000) break;
        }
    }

    function loop2() external view returns (uint i) {
        do {
            unchecked { ++i; }
            if (gasleft() < 1000) break;
        } while (i < 1 ether);
    }

    function toString1(uint _number) external pure returns (string memory) {
        return _number.toString();
    }

    function toString2(uint _number) external pure returns (string memory) {
        if (_number <= 0) return "0";

        (uint i, uint size) = (_number, 0);
        while (i != 0) { size++; i /= 10; }
        i = _number;
        
        bytes memory result = new bytes(size);
        while (i != 0) {
            size--;
            result[size] = bytes1(uint8(48 + i % 10));
            i /= 10;
        }
        
        return string(result);
    }

    function mapping1() external view returns (uint gas) {
        gas = gasleft();
        uint a = data[msg.sender].a;
        uint b = data[msg.sender].b;
        gas -= gasleft();
    }

    function mapping2() external view returns (uint gas) {
        gas = gasleft();
        Data memory _data = data[msg.sender];
        uint a = _data.a;
        uint b = _data.b;
        gas -= gasleft();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "onlyOwner");
        _;
    }

    uint public gas;
    modifier gasCheck() {
        //block.gaslimit
        gas = gasleft();
        _;
        gas -= gasleft();
    }
}

contract Functions_Child {
    address public father;
    address public sender;
    address public origin;

    constructor(address _father) {
        father = _father;
        sender = msg.sender;
        origin = tx.origin;
    }
}
