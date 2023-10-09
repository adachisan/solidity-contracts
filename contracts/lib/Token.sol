// SPDX-License-Identifier: MIT
// https://docs.openzeppelin.com/contracts/4.x/erc20
// https://docs.openzeppelin.com/contracts/4.x/access-control

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Access.sol";

abstract contract Token is ERC20, Access {

    bool public isMintable = true;

    function setMintable(bool _mintable) external access(Level.OWNER) {
        isMintable = _mintable;
        emit Transfer(msg.sender, address(this), _mintable ? 1 : 0);
    }

    function mintTo(address _to, uint _amount) external access(Level.MEMBER) returns (bool) {
        require(isMintable, "!mintable");
        _mint(_to, _amount);
        return true;
    }

    function burnOrigin(uint _amount) external access(Level.MEMBER) returns (bool) {
        _burn(tx.origin, _amount);
        return true;
    }
    
    function burn(uint _amount) external {
        _burn(msg.sender, _amount);
    }

}