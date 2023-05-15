// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "Token.sol";

contract PosipoolTicket is Token {
    constructor() ERC20("PosipoolTicket", "TICKET") Access() { }

    function approve(address spender, uint amount) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }

    function transfer(address to, uint amount) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }

    function transferFrom(address from, address to, uint amount) public virtual override returns (bool) { 
        revert("Cannot use this function!");
    }

    function increaseAllowance(address spender, uint addedValue) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }

    function decreaseAllowance(address spender, uint subtractedValue) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }
}