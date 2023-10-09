// SPDX-License-Identifier: MIT

// https://github.com/posipool/lucky-wheel

pragma solidity >=0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface Token {
    function balanceOf(address account) external view returns (uint);
    function mintTo(address _to, uint _amount) external returns (bool);
    function burnOrigin(uint _amount) external returns (bool);
}

contract Lukywheel is Ownable {
    uint public constant spinPrice = 1 ether;
    uint public constant maxSpins = 30;
    Token public immutable token;

    bool public locked;
    Prize[] public prizes;
    struct Prize { string name; uint posi; uint ticket; uint weight; }

    event Spin(address indexed _sender, string[] _result);
    event Deposit(address indexed _sender, uint _amount);

    constructor(address _tokenAddress) payable Ownable(msg.sender) {
        token = Token(_tokenAddress);
        prizes.push(Prize("LOSE", 0, 0, 32));
        prizes.push(Prize("0.5_POSI", 0.5 ether, 0, 32));
        prizes.push(Prize("1_TICKET", 0, 1 ether, 20));
        prizes.push(Prize("2_POSI", 2 ether, 0, 10));
        prizes.push(Prize("4_POSI", 4 ether, 0, 3));
        prizes.push(Prize("6_POSI", 6 ether, 0, 2));
        prizes.push(Prize("8_POSI", 8 ether, 0, 1));
    }

    function spin(uint _spins) external payable priceCheck(_spins) {
        string[] memory result = new string[](_spins);
        Prize[] memory _prizes = prizes;
        Prize memory prize;
        (uint posis, uint tickets, uint vrf) = (0, 0, VRF());
        for (uint i = 0; i < _spins; ) {
            prize = _selectPrize(_prizes, vrf % 100);
            result[i] = prize.name;
            posis += prize.posi;
            tickets += prize.ticket;
            vrf /= 100;
            unchecked { ++i; }
        }
        require(token.mintTo(msg.sender, tickets), "!mint");
        payable(msg.sender).transfer(posis);
        emit Spin(msg.sender, result);
    }

    function _selectPrize(Prize[] memory _prizes, uint _vrf) private pure returns (Prize memory) {
        (uint sum, uint len) = (0, _prizes.length);
        for (uint i = 0; i < len; ) {
            sum += _prizes[i].weight;
            if (_vrf < sum) return _prizes[i];
            unchecked { ++i; }
        }
        revert("sum != 100");
    }

    function priceOf(address _player, uint _spins) public view returns (uint) {
        uint tickets = token.balanceOf(_player);
        uint totalPrice = _spins * spinPrice;
        return tickets > totalPrice ? 0 : totalPrice - tickets;
    }

    //https://docs.posichain.org/developers/dapps-development/posichain-vrf
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

    function deposit() external payable {
        require(msg.value > 0, "!value");
        emit Deposit(msg.sender, msg.value);
    }

    function setLock(bool _enabled) external onlyOwner {
        locked = _enabled;
    }

    function destroy() external onlyOwner {
        selfdestruct(payable(owner()));
    }

    modifier priceCheck(uint _spins) {
        uint price = priceOf(msg.sender, _spins);
        require(!locked, "locked");
        require(_spins > 0 && _spins <= maxSpins, "!spins");
        require(msg.value == price, "!price");
        require(token.burnOrigin(_spins * spinPrice - price));
        _;
    }
}
