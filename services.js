import Web3 from 'web3'
import fs from 'fs'

// The applications default account
let applicationAccount = null

// ABI for web3.Contract invocations
const KittyNFTABI = JSON.parse(fs.readFileSync('./contracts/abis/KittyNFT.json', 'utf-8'))

let web3 = new Web3(
  new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/ba5aa7cc03dd47aba4cd41d2af3fe530')
); 

export function setupWallet(givenPrivateKey) {
    // check if private key starts with 0x (Metamask does not add this automatically)
    const privateKey = givenPrivateKey.startsWith('0x') ? givenPrivateKey : `0x${givenPrivateKey}`
    applicationAccount = web3.eth.accounts.privateKeyToAccount(privateKey)
    web3.eth.accounts.wallet.add(applicationAccount)
}

function getKittyNFTInstance(address) {
    return new web3.eth.Contract(KittyNFTABI, address, {
        from: applicationAccount.address,
        gasPrice: web3.utils.toWei('30', 'gwei')
    })
}

export async function mintKittyNFT(address, tokenURI) {
    const instance = getKittyNFTInstance(address)
    const mintNFTMethod = instance.methods.mintNFT(tokenURI)
    const gas = Math.floor(await mintNFTMethod.estimateGas())
    
    return new Promise((resolve, reject) => {
        mintNFTMethod.send({ gas })
            .on('receipt', function(data){
                if (!data.events.Transfer) {
                    reject(new Error('Could not find Transfer event in receipt'))
                }
                
                resolve(data.events.Transfer.returnValues.tokenId)
            });
    })
}

export async function createEscrow(address, tokenID, price) {
    const instance = getKittyNFTInstance(address)
    const escrowMethod = instance.methods.createEscrow(tokenID, price)
    const gas = Math.floor(await escrowMethod.estimateGas())
    
    return new Promise((resolve, reject) => {
        escrowMethod.send({ gas })
            .on('receipt', function(data){
                if (!data.events.Transfer) {
                    reject(new Error('Could not find Transfer event in receipt'))
                }
                
                resolve(data.events.Transfer.returnValues.tokenId)
            });
    })
}

export async function getAllEscrows(address) {
    const instance = getKittyNFTInstance(address)

    return new Promise((resolve, reject) => {
        instance.getPastEvents(
            'EscrowCreated',
            { fromBlock: 9187993, toBlock: 'latest' },
            (errors, events) => {
                if (!errors && errors !== null) {
                    // process events
                    reject(new Error((errors || ['Unknown error experienced']).join(', ')))
                }
        
                // Generate message to show which Escrows are created
                const message = events.reduce((acc, event) => {
                    const values = event.returnValues
                    return `${acc}Escrow for Token ID: ${values.tokenId} \nPrice: ${values.price} Wei \nBidding Address: ${values.escrowAddress} \n\n`
                }, 'Escrows created: \n\n')

                // NOTE: Usually we would just send an array, but for speed purposes only the message is sent back
                resolve(message)
            }
        );
    })
}
