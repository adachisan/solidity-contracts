// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./factory/Stake.sol";

contract PosipoolStake is Stake {
    
    struct Delegators { address wallet; uint amount; }
    event UpdateDelegators(address indexed, uint);

    constructor(uint _apr, address _token) Stake(_apr, _token) {}

    function changedDelegators(Delegators[] calldata _account) external view returns (Delegators[] memory _result) {
        _result = new Delegators[](_account.length);
        for (uint i = 0; i < _account.length;) {
            uint oldAmount = _delegator[_account[i].wallet].amount;
            if (oldAmount != _account[i].amount) {
                _result[i] = _account[i];
            }
            unchecked { ++i; }
        }
    }

    function updateDelegators(Delegators[] calldata _account) accessLevel(1) external returns (bool) {
        for (uint i = 0; i < _account.length;) {
            _saveRewards(_account[i].wallet);
            _delegator[_account[i].wallet].amount = _account[i].amount;
            unchecked { ++i; }
        }
        emit UpdateDelegators(msg.sender, _account.length);
        return true;
    }

    function deposit(uint _amount) external virtual override returns (bool) {
        revert("Cannot use this function!");
        return false;
    }

    function tokenWithdraw(uint _amount) external virtual override returns (bool) {
        revert("Cannot use this function!");
        return false;
    }
}
