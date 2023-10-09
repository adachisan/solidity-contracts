// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

abstract contract Access {

    uint public immutable initialBlock = block.number;
    uint public accessKey = block.timestamp;
    bool public noOwners = false;
    address public owner = tx.origin;
    mapping(address => uint) public memberKey;

    enum Level { OWNER, MEMBER }

    event ResetAccess(uint oldKey, uint newKey);
    event GiveAccess(address indexed member, uint key);
    event GiveOwner(address indexed oldOwner, address indexed newOwner);
    event FreeContract(string message);

    function hasAccess(address _account) public view returns (bool) {
        return memberKey[_account] == accessKey;
    }

    function resetAccess() public access(Level.OWNER) {
        uint oldkey = accessKey;
        accessKey = block.timestamp;
        emit ResetAccess(oldkey, accessKey);
    }

    function giveAccess(address _account) public access(Level.OWNER) {
        memberKey[_account] = accessKey;
        emit GiveAccess(_account, accessKey);
    }

    function giveOwner(address _account) external access(Level.OWNER) {
        owner = _account;
        emit GiveOwner(msg.sender, owner);
    }

    function freeContract() external access(Level.OWNER) {
        accessKey = block.timestamp;
        owner = address(0);
        noOwners = true;
        emit FreeContract("This contract is now free from owners/members");
    }

    modifier access(Level _level) {
        bool isOwner = msg.sender == owner;
        bool isMember = hasAccess(msg.sender);
        bool onlyOwner = _level == Level.OWNER;
        bool canAccess = isOwner || !onlyOwner && isMember;
        require(canAccess, "!access");
        _;
    }

}
