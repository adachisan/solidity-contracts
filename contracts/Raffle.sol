// SPDX-License-Identifier: MIT

pragma solidity >=0.8.27;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

//o creador da rifa vai ganhar o sempre o premio total
//o creador da rifa pode ganhar o valor de volta se ninguem for sortiado
//o creador pode receber o valor de volta se ninguem for sorteado
//o creador pode cancelar a rifa antes do prazo, recebendo apenas 80% do valor de volta
//a ultima pessoa que comprar a rifa, ou sortear o contrato no fim do tempo, ganha um premio

contract Raffle {
	using Strings for *;
	uint public immutable FEE_PERCENT = 500; //500 / 100 = 5%
	uint public immutable MAX_TICKETS = 50;
    uint public immutable MIN_PRIZE = 0.001 ether;
	uint public immutable MAX_COST = 1 ether;
	uint public GAMES_COUNT = 0;
	address public immutable OWNER = msg.sender;

	//implemente nft per game, the winner will win the nft and money

	struct Game {
        address payable creator;
        uint prize;
		uint balance;
		uint startTime;
		uint endTime;
        uint price;
		int winnerIndex;
		string description;
		address[] indexBook;
	}
	struct Player {
		uint balance;
		uint firstGame;
		uint lastGame;
		uint[] games;
	}

	mapping(address => Player) private playerByAddress;
	mapping(uint => Game) private gameByIndex;

	function createGame(string memory _description, uint _size, uint _price, uint _endTime) external payable returns (uint) { 
		require(msg.value >= MIN_PRIZE, "Low prize");
        require(_size <= MAX_TICKETS, "Too many tickets");
		gameByIndex[GAMES_COUNT++] = Game(payable(msg.sender), msg.value, 0, block.timestamp, _endTime, _price, -1, _description, new address[](_size));
		return GAMES_COUNT;
	}

	function getGameJson(uint index) external view returns (string memory) {
		Game memory data = gameByIndex[index];
		bytes memory json = abi.encodePacked(
			"{", 
				'"index":"',index.toString(),'",',
				'"balance":"',data.balance.toString(),'",', 
				'"startTime":"',data.startTime.toString(),'",', 
				'"endTime":"',data.endTime.toString(),'",', 
				'"winnerIndex":"',data.winnerIndex.toStringSigned(),'",', 
				// '"indexBook":"',data.indexBook,'",', 
				'"description":"',data.description,'"', 
			"}"
		);
		// return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
		return string(json);
	}

	function getPlayerJson(address addr) external view returns (string memory) {
		Player memory player = playerByAddress[addr];
		return "not implemented yet";
	}

	function prizes(uint max) external view returns (uint[] memory _result) {
		uint vrf = VRF();
		_result = new uint[](max);
		for (uint i; i < max; ) {
			_result[i] = vrf % 10;
			vrf /= 10;
			unchecked { ++i; }
		}
	}

	// if "vrf % 10" then "vrf /= 10" it will have "78" interactions limit
	function VRF() internal view returns (uint _result) {
		uint[1] memory bn = [block.number];
		assembly {
			let memPtr := mload(0x40)
			if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
				invalid()
			}
			_result := mload(memPtr)
		}
		_result = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, _result)));
	}
}
