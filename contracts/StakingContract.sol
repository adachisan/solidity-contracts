//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import {StakingPrecompiles, Directive} from "./StakingPrecompiles.sol";
//0xE730F87e2c41dBBc4a67277aE745EB97eEc3B61F
contract StakingContract is StakingPrecompiles {
    address public immutable owner = msg.sender;

    event StakingPrecompileCalled(uint8 directive, bool success);

    function acceptMoney() public payable {}

    function _delegate(address validatorAddress, uint256 amount) public returns (bool success) {
        uint256 result = delegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.DELEGATE), success);
    }

    function _undelegate(address validatorAddress, uint256 amount) public returns (bool success) {
        uint256 result = undelegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.UNDELEGATE), success);
    }

    function _collectRewards() public returns (bool success) {
        uint256 result = collectRewards();
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.COLLECT_REWARDS), success);
    }

    function deposit() external payable {
        require(msg.value > 100 ether);
    }

    function destroy() external {
        selfdestruct(payable(owner));
    }
}
