// SPDX-License-Identifier: MIT
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721Enumerable
// https://docs.openzeppelin.com/contracts/4.x/access-control

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./Access.sol";

abstract contract NFT is ERC721Enumerable, Access {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    mapping(uint => Data) internal _tokenById;
    struct Data { string name; string description; string url; string image; }

    function mintTo(address _account, string[4] calldata _data) accessLevel(1) external virtual {
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();
        _tokenById[newItemId] = Data(_data[0], _data[1], _data[2], _data[3]);
        _safeMint(_account, newItemId);
    }

    function burn(uint _tokenId) accessLevel(1) external {
        delete _tokenById[_tokenId];
        _burn(_tokenId);
    }

    function tokensOf(address _account) external view returns (uint[] memory tokenId) {
        tokenId = new uint[](balanceOf(_account));
        for(uint i = 0; i < tokenId.length;) {
            tokenId[i] = tokenOfOwnerByIndex(_account, i);
            unchecked{ ++i; }
        }
    }

    function tokenURI(uint _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "!_tokenId");
        return _metadata(_tokenId);
    }

    function _metadata(uint _tokenId) internal view virtual returns (string memory) {
        Data memory data = _tokenById[_tokenId];
        bytes memory json = abi.encodePacked(
            '{',
                '"name":"',data.name,'"',
                ',"description":"',data.description,'"',
                ',"image":"',_image(_tokenId),'"',
                ',"external_url":"',data.url,'"',
            '}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _image(uint _tokenId) internal view virtual returns (string memory) {
        return string(abi.encodePacked("data:image/svg+xml;base64,", _tokenById[_tokenId].image));
    }

    // function _image(uint _tokenId) internal view returns (string memory) {
    //     Data memory data = _tokenById[_tokenId];
    //     bytes memory svg = abi.encodePacked(
    //         '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">',
    //         '<rect width="100%" height="100%" fill="pink" />',
    //         '<text x="10%" y="50%" fill="black" font-size="15">',data.name,'</text>',
    //         '</svg>'
    //     );
    //     return string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(svg)));
    // }
}
