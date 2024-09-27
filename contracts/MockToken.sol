// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./LibToken.sol";

contract MockTicket is Token {
    
    constructor() ERC20("PosipoolTicket", "TICKET") { }

    function approve(address spender, uint amount) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }

    function transfer(address to, uint amount) public virtual override returns (bool) {
        revert("Cannot use this function!");
    }

    function transferFrom(address from, address to, uint amount) public virtual override returns (bool) { 
        revert("Cannot use this function!");
    }

}