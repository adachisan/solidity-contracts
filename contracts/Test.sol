// SPDX-License-Identifier: MIT
pragma solidity >=0.8.27;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract Test {
    using Strings for *;

    event constructorEvent(string);

    constructor() payable {
        emit constructorEvent(string(abi.encodePacked("created at ", block.number.toString())));
    }

    function random() public view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }

    //loop performance testing
    function slow() external view returns (uint i) {
        for (i = 0; i < 1 ether; ++i) {
            if (gasleft() < 1000) break;
        }
    }

    function fast() external view returns (uint i) {
        do {
            unchecked { ++i; }
            if (gasleft() < 1000) break;
        } while (i < 1 ether);
    }

    //mapping testing
    mapping(address => Data) public dataByAddress;
    struct Data { uint balance; uint changed; string message; }
    event DataEvent(Data);

    function set(string calldata _message) external payable {
        Data memory user = dataByAddress[msg.sender];
        user.balance += msg.value;
        user.changed = block.timestamp;
        user.message = _message;
        dataByAddress[msg.sender] = user;
    }

    function get() external view returns (Data memory) {
        return dataByAddress[msg.sender];
    }

    function log() public returns (Data memory) {
        Data memory user = dataByAddress[msg.sender];
        emit DataEvent(user);
        return user;
    }

    function json() external view returns (string memory) {
        Data memory user = dataByAddress[msg.sender];
		bytes memory data = abi.encodePacked(
			"{", 
				'"balance":"',user.balance.toString(),'",', 
				'"changed":"',user.changed.toString(),'",', 
				'"message":"',user.message,'"', 
			"}"
		);
		return string(data);
    }

    function base64() external view returns (string memory) {
        Data memory user = dataByAddress[msg.sender];
		bytes memory data = abi.encodePacked(
			"{", 
				'"balance":"',user.balance.toString(),'",', 
				'"changed":"',user.changed.toString(),'",', 
				'"message":"',user.message,'"', 
			"}"
		);
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(data)));
    }

    function encoded() external view returns (string memory) {
        Data memory user = dataByAddress[msg.sender];
		bytes memory data = abi.encodePacked(
			"{", 
				'"balance":"',user.balance.toString(),'",', 
				'"changed":"',user.changed.toString(),'",', 
				'"message":"',user.message,'"', 
			"}"
		);
        return string(abi.encodePacked("data:application/json,", encodeURI(data)));
    }

    function encodeURI(bytes memory _text) public pure returns (string memory) {
        bytes memory result = new bytes(_text.length * 3);
        bytes memory seed = "0123456789ABCDEF";
        // bytes memory allowed = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-.!~*'()";
        uint size = 0;
        for (uint i = 0; i < _text.length; i++) {
            bytes1 char = _text[i];
            if ((char >= '0' && char <= '9') 
            || (char >= 'A' && char <= 'Z') 
            || (char >= 'a' && char <= 'z') 
            || char == '_' || char == '-' || char == '.' || char == '!' || char == '~' 
            || char == '*' || char == '\'' || char == '(' || char == ')') {
                result[size++] = char;
            } else {
                result[size++] = '%';
                result[size++] = seed[uint8(char) >> 4];
                result[size++] = seed[uint8(char) & 0x0F];
            }
        }
        assembly { mstore(result, size) }
        return string(result);
    }

    //child contract testing
    event CreateEvent(address);

    function create() external returns (address _address) {
        Child child = new Child();
        _address = address(child);
        emit CreateEvent(_address);
    }

    function execute(address _address) external view returns (string memory) {
        return Child(_address).message();
    }
}

contract Child {
    using Strings for *;
    address public immutable father = msg.sender;
    address public immutable creator = tx.origin;
    uint public immutable birth = block.timestamp;

    function message() external view returns (string memory) {
        return string(abi.encodePacked("created from ", father.toHexString(), " by ", creator.toHexString(), " in ", birth.toString()));
    }
}