// SPDX-License-Identifier: MIT
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#ERC721Enumerable
// https://docs.openzeppelin.com/contracts/4.x/access-control

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./LibAccess.sol";

abstract contract NFT is ERC721Enumerable, Access {

    uint private _nextTokenId;
    mapping(uint => Data) internal _tokenById;

    struct Data { string name; string description; string image; }

    function mintTo(address _account, string[3] calldata _data) external virtual access(Level.MEMBER) {
        uint tokenId = _nextTokenId++;
        _tokenById[tokenId] = Data(_data[0], _data[1], _data[2]);
        _safeMint(_account, tokenId);
    }

    function burn(uint _tokenId) external virtual {
        delete _tokenById[_tokenId];
        _burn(_tokenId);
    }

    function tokensOf(address _account) external view returns (uint[] memory tokens) {
        tokens = new uint[](balanceOf(_account));
        for (uint i = 0; i < tokens.length; ) {
            tokens[i] = tokenOfOwnerByIndex(_account, i);
            unchecked { ++i; }
        }
    }

    function tokenURI(uint _tokenId) public view virtual override returns (string memory) {
        return _metadata(_tokenId);
    }

    function _metadata(uint _tokenId) internal view virtual returns (string memory) {
        Data memory data = _tokenById[_tokenId];
        bytes memory json = abi.encodePacked(
            '{',
                '"name":"',data.name,'",',
                '"description":"',data.description,'",',
                '"image":"',_image(_tokenId),'"',
            '}'
        );
        return string(abi.encodePacked('data:application/json;base64,', Base64.encode(json)));
    }

    function _image(uint _tokenId) internal view virtual returns (string memory) {
        return string(abi.encodePacked('data:image/svg+xml;base64,', _tokenById[_tokenId].image));
    }

    // function _image(uint _tokenId) internal view virtual returns (string memory) {
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
