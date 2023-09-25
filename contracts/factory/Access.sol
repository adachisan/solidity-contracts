// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

abstract contract Access {
    uint internal immutable _block = block.number;
    address internal immutable _owner = tx.origin;
    mapping(address => uint) internal _accessLevel;

    constructor() {
        _accessLevel[tx.origin] = 2; 
    }

    event SetAccessLevel(address indexed, address indexed, uint);
    event Withdraw(address indexed, address indexed, uint);

    function initialBlock() external view returns (uint) {
        return _block;
    }

    function accessLevelOf(address _account) external view returns (uint) {
        return _accessLevel[_account];
    }

    function setAccessLevel(address _account, uint _level) accessLevel(2) external {
        _accessLevel[_account] = _level;
        emit SetAccessLevel(msg.sender, _account, _level);
    }

    function withdraw(uint _amount) accessLevel(2) external {
        require(address(this).balance >= _amount, "!balance");
        payable(msg.sender).transfer(_amount);
        emit Withdraw(address(this), msg.sender, _amount);
    }

    uint private _entered = 0;
    modifier accessLevel(uint _level) {
        require(_entered  == 0, "!reentrancy");
        require(_accessLevel[msg.sender] >= _level, "!access");
        _entered = 1;
        _;
        _entered = 0;
    }
}