import fs from 'fs';
import { Command } from 'commander';
import config from './config.js';
import { getAllEscrows, mintKittyNFT, setupWallet } from './services.js'

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
    console.log(await getAllEscrows(options.address))
  });

program
  .command('mint <uri>')
  .description("Mints given uri in NFT contract")
  .option('-a --address <address>', "The target NFT contract address", config.nftAddress)
  .action(async (uri, options) => {
    const itemID = await mintKittyNFT(options.address, uri)

    console.log(`Newly minted item ID: ${itemID}`)
  })

program
  .command('create-escrow <itemID> <price>')
  .description('Creates an escrow for given Item ID with given Price in Wei')
  .action(async (itemID, price) => {
    
  })

program.parse(process.argv);