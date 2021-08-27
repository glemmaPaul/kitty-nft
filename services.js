import Web3 from 'web3'
import fs from 'fs'

const KittyNFTABI = JSON.parse(fs.readFileSync('./contracts/abis/KittyNFT.json', 'utf-8'))

let web3 = new Web3(
  new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/ba5aa7cc03dd47aba4cd41d2af3fe530")
);


function getKittyNFTInstance(address) {
    return new web3.eth.Contract(KittyNFTABI, address)
}

export function getAllEscrows(address) {
    const instance = getKittyNFTInstance(address)

    return new Promise((resolve, reject) => {
        instance.getPastEvents(
            "EscrowCreated",
            { fromBlock: 9187993, toBlock: "latest" },
            (errors, events) => {
                if (!errors && errors !== null) {
                    // process events
                    reject(new Error((errors || ["Unknown error experienced"]).join(", ")))
                }
        
                // Generate message to show which Escrows are created
                const message = events.reduce((acc, event) => {
                    const values = event.returnValues
                    return `${acc}Escrow for Token ID: ${values.tokenId} \nPrice: ${values.price} Wei \nBidding Address: ${values.escrowAddress} \n\n`
                }, "Escrows created: \n\n")

                // NOTE: Usually we would just send an array, but for speed purposes only the message is sent back
                resolve(message)
            }
        );
    })
}
