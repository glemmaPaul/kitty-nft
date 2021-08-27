import { Command } from 'commander';

import config from './config.js';
import { getAllEscrows } from './services.js'

const program = new Command();

program
  .command('all-escrows [address]')
  .description('Deploy NFT contract')
  .action(async (address = config.nftAddress) => {
    console.log(await getAllEscrows(address || config.nftAddress))
  });

program
  .command('mint [address] [uri]')
  .description("Mints given uri in NFT contract")
  .action(async (address = config.nftAddress, uri) => {
    
  })

program.parse(process.argv);