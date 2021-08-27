import fs from 'fs';
import { Command } from 'commander';
import config from './config.js';
import { 
  getAllEscrowCreationEvents, 
  mintNFT, 
  setupWallet, 
  createEscrow, 
  buyEscrow, 
  disconnectProvider } from './services.js'

const walletPath = './.wallet'

if (!fs.existsSync(walletPath)) {
    console.log("Wallet private key not found, add .wallet in root folder containing your private key")
    process.exit(1)
}
else {
    setupWallet(fs.readFileSync(walletPath, 'utf-8'))
}

const program = new Command();

program
  .command('all-escrows')
  .description('Deploy NFT contract')
  .option('-a --address <address>', "The target NFT contract address", config.nftAddress)
  .action(async (options) => {
    const escrows = await getAllEscrowCreationEvents(options.address)
    // Generate message to show which Escrows are created
    const message = escrows.reduce((acc, event) => {
    const values = event.returnValues
        return `${acc}Escrow for Token ID: ${values.tokenId} \nPrice: ${values.price} Wei \nBidding Address: ${values.escrowAddress} \n\n`
    }, 'Escrows created: \n\n')
    console.log(message)

    disconnectProvider()
  });

program
  .command('mint <uri>')
  .description("Mints given uri in NFT contract")
  .option('-a --address <address>', "The target NFT contract address", config.nftAddress)
  .action(async (uri, options) => {
    const itemID = await mintNFT(options.address, uri)

    console.log(`Newly minted item ID: ${itemID}`)

    disconnectProvider()
  })

program
  .command('create-escrow <tokenId> <price>')
  .description('Creates an escrow for given Item ID with given Price in Wei')
  .option('-a --address <address>', "The target NFT contract address", config.nftAddress)
  .action(async (tokenId, price, options) => {
    const escrowAddress = await createEscrow(options.address, tokenId, price)

    console.log(`Newly created escrow on address: ${escrowAddress}`)

    disconnectProvider()
  })

program
  .command('buy-escrow <escrowAddress> [weiAmount]')
  .description('Places a bid to an escrow with given wei amount')
  .action(async (escrowAddress, weiAmount) => {
    try {
        const txResults = await buyEscrow(escrowAddress, weiAmount)
        console.log(`Transaction confirmed on block: ${txResults.blockNumber}, transaction hash: ${txResults.transactionHash} congratulations 🎉`)
    }
    catch (e) {
        console.log(e.message)
    }
    
    disconnectProvider()
  })

program.parse(process.argv);
