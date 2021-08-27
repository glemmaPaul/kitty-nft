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

function getGasPrice() {
    // TODO: Make a call to ethgasstation to retrieve average gas price
    return web3.utils.toWei('3', 'gwei')
}

function contractFactory(address, abi) {
    return new web3.eth.Contract(abi, address, {
        from: applicationAccount.address,
        gasPrice: getGasPrice()
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
                    reject(new Error('Could not find EscrowCreated event in receipt'))
                }

                resolve(data.events.EscrowCreated.returnValues.escrowAddress)
            })
            .on('error', reject);
    })
}

/**
 * 
 * @param {String} escrowAddress Address where Escrow contract is located
 * @returns Price in Wei
 */
function getEscrowPrice(escrowAddress) {
    const escrowInstance = getKittyEscrowInstance(escrowAddress)
    return new Promise((resolve, reject) => {
        escrowInstance.methods.price().call((error, result) => {
            if (error) {
                return reject(error)
            }
            resolve(result)
        })
    })
}

export async function buyEscrow(escrowAddress, weiAmount = null) {
    return new Promise(async (resolve, reject) => {
        const transactionAmount = weiAmount || await getEscrowPrice(escrowAddress).catch(reject)
        const txOptions = {
            from: applicationAccount.address,
            to: escrowAddress,
            value: transactionAmount,
            gasPrice: getGasPrice()
        }

        // First get gas estimation
        const gas = await web3.eth.estimateGas(txOptions).catch(reject)
        
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
                    reject(new Error(errors.join(', ')))
                }
                resolve(events)
            }
        );
    })
}


/**
 * For example purposes only, websocket connections do not automatically close
 * thus we disconnect the provider after the commands are executed
 */
 export function disconnectProvider() {
    web3.currentProvider.disconnect()
}