// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "Access.sol";

interface Token {
    function balanceOf(address _account) external view returns (uint);
    function mint(address _to, uint _amount) external returns (bool);
    function burnOrigin(uint _amount) external returns (bool);
}

abstract contract Stake is Access {
    uint internal _APR;
    mapping(address => Data) internal _delegator;
    struct Data { uint amount; uint pending; uint time; }
    Token token;

    event TokenWithdraw(address indexed, uint);
    event Deposit(address indexed, uint);
    event Claim(address indexed, uint);
    event SetAPR(address indexed, uint);

    constructor(uint _apr, address _token) Access() {
        _APR = _apr;
        token = Token(_token);
    }

    function getAPR() external view returns (uint) {
        return _APR;
    }

    function setAPR(uint _apr) accessLevel(1) external returns (bool) {
        _APR = _apr;
        emit SetAPR(msg.sender, _apr);
        return true;
    } 

    function deposit(uint _amount) accessLevel(0) external virtual returns (bool) {
        require(_amount >= minDeposit(), "!limit");
        require(token.balanceOf(msg.sender) >= _amount, "!balance");
        require(token.burnOrigin(_amount), "!burn");
        _saveRewards(msg.sender);
        _delegator[msg.sender].amount += _amount;
        emit Deposit(msg.sender, _amount);
        return true;
    }

    function tokenWithdraw(uint _amount) accessLevel(0) external virtual returns (bool) {
        require(_delegator[msg.sender].amount >= _amount);
        require(token.mint(msg.sender, _amount));
        _saveRewards(msg.sender);
        _delegator[msg.sender].amount -= _amount;
        emit TokenWithdraw(msg.sender, _amount);
        return true;
    }

    function claim() accessLevel(0) external returns (bool) {
        uint amount = _saveRewards(msg.sender);
        _delegator[msg.sender].pending = 0;
        require(token.mint(msg.sender, amount));
        emit Claim(msg.sender, amount);
        return true;
    }

    function balanceOf(address _account) external view returns (uint) {
        return _delegator[_account].amount;
    }

    function unclaimedOf(address _account) external view returns (uint) {
        return _calculateRewards(_account) + _delegator[_account].pending;
    } 

    function minDeposit() public view returns (uint) {
        return (100 * 365 * 86400) / (_APR * 3600);
    }

    function _calculateRewards(address _account) internal view returns (uint) {
        uint staked = _delegator[_account].amount;
        uint period = block.timestamp - _delegator[_account].time;
        uint perYear = (staked * period * _APR) / 100;
        uint perDay = perYear / 365;
        uint perSeconds = perDay / 86400;
        return perSeconds;
    } 

    function _saveRewards(address _account) internal returns (uint) {
        _delegator[_account].pending += _calculateRewards(_account);
        _delegator[_account].time = block.timestamp;
        return _delegator[_account].pending;
    }
}
