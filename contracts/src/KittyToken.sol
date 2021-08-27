// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title KittyEscrow
 * @dev Escrow to bid on a NFT
 */
contract KittyEscrow {
    address private nft;
    uint256 private tokenId;
    address private buyer;
    address private seller;
    
    // Price in Wei
    uint public price;
    
    // event for EVM logging
    event EscrowFulfilled(address indexed buyer);
    
    /**
     * @dev Creates an escrow that can be paid through the buy() method
     */
    constructor(address _seller, uint256 _tokenId, uint _price) {
        nft = msg.sender;
        seller = _seller;
        price = _price;
        tokenId = _tokenId;
    }
    
    /**
     * buy
     * @dev gives the ability to buy the NFT token
     **/
    function buy() public payable {
        require(msg.value == price, "Price has to be exactly the same stated in Escrow");
        ERC721 nftInterface = ERC721(nft);
        
        require(nftInterface.getApproved(tokenId) == address(this), "Cannot buy token, this Escrow is not allowed to transfer");
        nftInterface.safeTransferFrom(seller, msg.sender, tokenId);
        
        buyer = msg.sender;
        
        payable(seller).transfer(price);
        
        emit EscrowFulfilled(msg.sender);
    }

}


contract KittyNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIDs;
    
    event EscrowCreated(uint256 indexed tokenId, uint256 price, address escrowAddress);

    constructor() public ERC721("Kitten NFT", "KITTY") {}
    
    /**
     * @dev Mints a new NFT
     * @param tokenURI identifier to be minted
     **/
    function mintNFT(string memory tokenURI) public returns (uint256) {
       _tokenIDs.increment();
       uint256 newItemId = _tokenIDs.current();
       _safeMint(msg.sender, newItemId);
       _setTokenURI(newItemId, tokenURI);
       return newItemId;
    }
    
    function createEscrow(uint256 tokenId, uint256 price) public returns (address) {
        KittyEscrow escrowContract = new KittyEscrow(msg.sender, tokenId, price);
        
        approve(address(escrowContract), tokenId);
        
        emit EscrowCreated(tokenId, price, address(escrowContract));

        return address(escrowContract);
    }
    
}

