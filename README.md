# Kitty NFT CLI

Example project of a NFT token in combination of an Escrow.

## Installation
Make sure to create a file named `.wallet` your wallet private key inside, this private key will then be used for all consecutive ethereum blockchain executions.

And of course, as always:
```
yarn install
```

## Methods

### Mint NFT
```
node index.js mint example.com
```

Returns a newly created Token ID

### Create Escrow for minted NFT

```
node index.js create-escrow <TokenID> <Price>
```

Example:
```
node index.js create-escrow 6 500
```

This will create an escrow for Token ID 6 with a price of 500 Wei


**Returns** a new escrow address for other wallets to send funds to

### Send funds to Escrow for buying NFT ownership

```
node index.js buy-escrow <escrowAddress>
```

Example:
```
node index.js buy-escrow 0xC12f5AE96EaCdDB3fA9b63D2fae33D5c2a8f5fA6
```

**Returns** successful transaction or error


### List all Escrows created
```
node index.js all-escrows
```

Example result:
```
Escrows created: 

Escrow for Token ID: 1 
Price: 50000 Wei 
Bidding Address: 0x3F5C061334c49fde0A76581836234FCb2c06ace7 
```

