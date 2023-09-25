// SPDX-License-Identifier: MIT
// https://docs.openzeppelin.com/contracts/4.x/erc20
// https://docs.openzeppelin.com/contracts/4.x/access-control

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Access.sol";

abstract contract Token is ERC20, Access {
    bool internal _mintable = true;

    function isMintable() external view returns (bool) {
        return _mintable;
    }

    function setMint(bool _enable) accessLevel(2) external {
        _mintable = _enable;
        emit Transfer(msg.sender, address(this), _enable ? 1 : 0);
    }

    function mint(address _to, uint _amount) accessLevel(1) external returns (bool) {
        require(_mintable, "cannot mint anymore!");
        _mint(_to, _amount);
        return true;
    }

    function burnOrigin(uint _amount) accessLevel(1) external returns (bool) {
        _burn(tx.origin, _amount);
        return true;
    }

    function burn(uint _amount) accessLevel(0) external {
        _burn(msg.sender, _amount);
    }
}