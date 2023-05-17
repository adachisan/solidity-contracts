// SPDX-License-Identifier: MIT

// https://github.com/posipool/lucky-wheel

pragma solidity >= 0.8.0;

import "contracts/Access.sol";

interface Ticket {
    function balanceOf(address account) external view returns (uint);
    function mint(address _to, uint _amount) external returns (bool);
    function burnOrigin(uint _amount) external returns (bool);
}

contract Lukywheel is Access {
    uint public constant spinPrice = 1 ether;
    uint public constant maxSpins = 30;
    Ticket ticket;

    bool public locked;
    Prize[] public prizes;
    struct Prize { string name; uint posi; uint ticket; uint weight; }

    constructor(address _tokenAddress) Access() {
        ticket = Ticket(_tokenAddress);
        prizes.push(Prize("LOSE", 0, 0, 32));
        prizes.push(Prize("0.5_POSI", 0.5 ether, 0, 32));
        prizes.push(Prize("1_TICKET", 0, 1 ether, 20));
        prizes.push(Prize("2_POSI", 2 ether, 0, 10));
        prizes.push(Prize("4_POSI", 4 ether, 0, 3));
        prizes.push(Prize("6_POSI", 6 ether, 0, 2));
        prizes.push(Prize("8_POSI", 8 ether, 0, 1));
    }

    event Spin(address indexed, string[], uint);

    function spin(uint _spins) accessLevel(0) priceCheck(_spins) external payable {
        string[] memory result = new string[](_spins);
        Prize[] memory _prizes = prizes;
        Prize memory prize;
        (uint posis, uint tickets, uint vrf) = (0, 0, _VRF());
        //must use the line bellow for Remix VM
        //vrf = uint(keccak256(abi.encodePacked(block.timestamp)));
        for (uint i = 0; i < _spins;) {
            prize = _selectPrize(_prizes, vrf % 100);
            result[i] = prize.name;
            posis += prize.posi;
            tickets += prize.ticket;
            vrf /= 100;
            unchecked { ++i; }
        }
        require(ticket.mint(msg.sender, tickets), "!mint");
        payable(msg.sender).transfer(posis);
        emit Spin(msg.sender, result, block.timestamp);
    }

    function _selectPrize(Prize[] memory _prizes, uint _vrf) internal pure returns (Prize memory) {
        (uint sum, uint len) = (0, _prizes.length);
        for (uint i = 0; i < len;) {
            sum += _prizes[i].weight;
            if (_vrf < sum) return _prizes[i];
            unchecked { ++i; }
        }
        revert("sum != 100");
    }

    function priceOf(address _player, uint _spins) public view returns (uint) {
        uint tickets = ticket.balanceOf(_player);
        uint totalPrice = _spins * spinPrice;
        return tickets > totalPrice ? 0 : totalPrice - tickets;
    }

    //https://docs.posichain.org/developers/dapps-development/posichain-vrf
    function _VRF() internal view returns (uint _result) {
        uint[1] memory bn = [block.number];
        assembly {
            let memPtr := mload(0x40)
            if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
                invalid()
            }
            _result := mload(memPtr)
        }
        _result = uint(keccak256(abi.encodePacked(msg.sender, _result)));
    }

    function setLock(bool _enabled) accessLevel(1) external {
        locked = _enabled;
    }

    function destroy() accessLevel(1) external {
        selfdestruct(payable(_owner));
    }

    modifier priceCheck(uint _spins) {
        uint price = priceOf(msg.sender, _spins);
        require(!locked, "locked");
        require(_spins > 0 && _spins <= maxSpins, "!spins");
        require(msg.value == price, "!price");
        require(ticket.burnOrigin(_spins * spinPrice - price));
        _;
    }
}
