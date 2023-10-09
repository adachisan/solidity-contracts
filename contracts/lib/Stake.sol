// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface Token {
    function balanceOf(address _account) external view returns (uint);
    function mintTo(address _to, uint _amount) external returns (bool);
    function burnOrigin(uint _amount) external returns (bool);
}

abstract contract Stake {

    uint public APR; //25 for 25% per year
    Token public immutable token;

    mapping(address => Data) internal _delegator;
    struct Data { uint amount; uint pending; uint time; }

    event TokenWithdraw(address indexed _account, uint _amount);
    event Deposit(address indexed _account, uint _amount);
    event Claim(address indexed _account, uint _amount);

    constructor(uint _apr, address _token) {
        APR = _apr;
        token = Token(_token);
    }

    function deposit(uint _amount) external virtual {
        require(_amount >= minDeposit(), "!limit");
        require(token.balanceOf(msg.sender) >= _amount, "!balance");
        require(token.burnOrigin(_amount), "!burn");
        _saveRewards(msg.sender);
        _delegator[msg.sender].amount += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function tokenWithdraw(uint _amount) external virtual {
        require(_delegator[msg.sender].amount >= _amount);
        _saveRewards(msg.sender);
        _delegator[msg.sender].amount -= _amount;
        require(token.mintTo(msg.sender, _amount));
        emit TokenWithdraw(msg.sender, _amount);
    }

    function claim() external {
        uint amount = _saveRewards(msg.sender);
        _delegator[msg.sender].pending = 0;
        require(token.mintTo(msg.sender, amount));
        emit Claim(msg.sender, amount);
    }

    function balanceOf(address _account) external view returns (uint) {
        return _delegator[_account].amount;
    }

    function unclaimedOf(address _account) external view returns (uint) {
        return _calculateRewards(_account) + _delegator[_account].pending;
    } 

    function minDeposit() public view returns (uint) {
        return (100 * 365 * 86400) / (APR * 3600);
    }

    function _calculateRewards(address _account) internal view returns (uint) {
        uint staked = _delegator[_account].amount;
        uint period = block.timestamp - _delegator[_account].time;
        uint perYear = (staked * period * APR) / 100;
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
