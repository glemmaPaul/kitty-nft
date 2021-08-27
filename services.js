import Web3 from 'web3'
import fs from 'fs'

// The applications default account
let applicationAccount = null

// ABI for web3.Contract invocations
const KittyNFTABI = JSON.parse(fs.readFileSync('./contracts/abis/KittyNFT.json', 'utf-8'))
const KittyEscrowABI = JSON.parse(fs.readFileSync('./contracts/abis/KittyEscrow.json', 'utf-8'))

let web3 = new Web3(
  new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/ba5aa7cc03dd47aba4cd41d2af3fe530')
); 

export function setupWallet(givenPrivateKey) {
    // check if private key starts with 0x (Metamask does not add this automatically)
    const privateKey = givenPrivateKey.startsWith('0x') ? givenPrivateKey : `0x${givenPrivateKey}`
    applicationAccount = web3.eth.accounts.privateKeyToAccount(privateKey)
    web3.eth.accounts.wallet.add(applicationAccount)
}

function contractFactory(address, abi) {
    return new web3.eth.Contract(abi, address, {
        from: applicationAccount.address,
        gasPrice: web3.utils.toWei('30', 'gwei')
    })
}

function getKittyNFTInstance(address) {
    return contractFactory(address, KittyNFTABI)
}

function getKittyEscrowInstance(address) {
    return contractFactory(address, KittyEscrowABI)
}

export async function mintNFT(address, tokenURI) {
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
                if (!data.events.EscrowCreated) {
                    reject(new Error('Could not find Transfer event in receipt'))
                }

                resolve(data.events.EscrowCreated.returnValues.escrowAddress)
            })
            .on('error', reject);
    })
}

function getEscrowPrice(escrowAddress) {
    const escrowInstance = getKittyEscrowInstance(escrowAddress)
    return new Promise((resolve, reject) => {
        escrowInstance.methods.price().call((error, result) => {
            console.log(error, result)
            if (error) {
                return reject(error)
            }

            resolve(result)
        })
    })
}

export async function buyEscrow(escrowAddress, weiAmount = null) {
    const transactionAmount = weiAmount || await getEscrowPrice(escrowAddress)

    return new Promise(async (resolve, reject) => {
        const txOptions = {
            from: applicationAccount.address,
            to: escrowAddress,
            value: transactionAmount,
            gasPrice: web3.utils.toWei('30', 'gwei')
        }
        // First get gas limit
        const gas = await web3.eth.estimateGas(txOptions)
        web3.eth.sendTransaction({
            ...txOptions,
            gas
        }, (error) => {
            if (error) {
                reject(error)
            }  
        })
        .on('error', reject)
        .on('receipt', (tx) => {
            resolve(tx)
        })
    })
}

/**
 * Get all EscrowCreated events for given NFT address
 * @param {String} address NFT Address
 * @returns Array of web3 events
 */
export async function getAllEscrowCreationEvents(address) {
    const instance = getKittyNFTInstance(address)

    return new Promise((resolve, reject) => {
        instance.getPastEvents(
            'EscrowCreated',
            // We dont start from block 0, cause that is of no use as of now
            { fromBlock: 9187993, toBlock: 'latest' },
            (errors, events) => {
                if (!errors && errors !== null) {
                    // process events
                    reject(new Error((errors || ['Unknown error experienced']).join(', ')))
                }
                resolve(events)
            }
        );
    })
}
