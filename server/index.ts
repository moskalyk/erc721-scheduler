import * as dotenv from "dotenv";
import { v2 } from '@0xsequence/core'
import { RpcRelayer } from '@0xsequence/relayer'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers, utils } from 'ethers'
import { Wallet } from '@0xsequence/wallet'

dotenv.config();

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fetch from 'cross-fetch'

const app = express()
const PORT = 4000

const context = v2.DeployedWalletContext;
const serverPrivateKey = process.env!.PKF!;

const provider = new ethers.providers.JsonRpcProvider('https://nodes.sequence.app/base-goerli')
const walletEOA = new ethers.Wallet(serverPrivateKey, provider)
const relayer = new RpcRelayer({url: 'https://base-goerli-relayer.sequence.app', provider: provider})

const config = v2.config.ConfigCoder.fromSimple({
    threshold: 1,
    checkpoint: 0,
    signers: [{ weight: 1, address: walletEOA.address }]
})

const wallet = Wallet.newWallet({
    context: context,
    coders: v2.coders,
    config,
    provider,
    relayer,
    orchestrator: new Orchestrator([walletEOA]),
    chainId: 84531
})

console.log(`relaying from address: ${wallet.address}`)

const corsOptions = {
    origin: ['http://localhost:3000', "*"],
};
  
app.use(cors(corsOptions));
app.use(bodyParser.json())

// Sample JSON objects to enqueue
let jsonQueue = [
  { id: 1, data: "https://bafybeidkgg4fowas234dnibzpz4yslhb2eqr6oq7lmiqcmz4wdls27p4ca.ipfs.nftstorage.link/" },
  { id: 2, data: "https://bafybeicnxnnksu4zb7k6bnrjum6atki6ik6id6e2orw6hiuq5hh7fq4zcq.ipfs.nftstorage.link/" },
  { id: 3, data: "https://bafybeia44gd2o2pkbzmhdru5gyfvly5ev75jrfsetqy3k4oegj2dfrcmie.ipfs.nftstorage.link/" },
  { id: 4, data: "https://bafybeid6lpzo5h4n2bczh5mya66sdcw2rsjxbxyoa7e57vpwxttkewjsyy.ipfs.nftstorage.link/" },
  { id: 0, data: "https://bafybeiccf6bnqkfrsreaxajhjb7kxvsckts2g2o26arclguwvozhgzmisa.ipfs.nftstorage.link/" },
];

// Function to process a JSON object
async function processJson(json) {
  console.log("Processing JSON:", json);
  const contractAddress = '0x426e1787e32f231408410e699E0E31FE6C34CFA8'
  
  // Add your processing logic here
  const interface721 = new ethers.utils.Interface([
    'function setBaseURI(string memory baseURI_) onlyRelayer public'
  ])

  const data = interface721.encodeFunctionData('setBaseURI', [json.data])

  const tx = {
    to: contractAddress,
    data
  }
  const res = await wallet.sendTransaction(tx)
  console.log(res)
  await fetch('https://metadata.sequence.app/tokens/84531/0x426e1787e32f231408410e699E0E31FE6C34CFA8/0/refresh')
}

// Timer interval (in milliseconds)
const timerInterval = 30000; // 30 second

// Function to process the JSON queue on a timer
async function processQueueWithTimer() {
  if (jsonQueue.length > 0) {
    const json = jsonQueue.shift(); // Get the first JSON object from the queue
    processJson(json); // Process the JSON object
  } else {
    console.log("Queue is empty.");
  //   clearInterval(queueTimer); // Stop the timer if the queue is empty
  }
}

const onlyAuthor = (req: any, res: any, next: any) => {
  //TODO: get owner from smart contract
  if(req.body.author == process.env.AUTHOR) {
    next()
  } else {
    res.sendStatus(404)
  }
}

app.post('/append', onlyAuthor, (req: any, res: any) => {
  if(req.body.author ==  process.env.AUTHOR){
      jsonQueue.push({ id: jsonQueue.length+1, data: req.body.baseURI })
      res.sendStatus(200)
  } else {
      res.sendStatus(404)
  }
})

app.post('/restart', onlyAuthor, (req: any, res: any) => {
  jsonQueue = [
      { id: 1, data: "https://bafybeidkgg4fowas234dnibzpz4yslhb2eqr6oq7lmiqcmz4wdls27p4ca.ipfs.nftstorage.link/" },
      { id: 2, data: "https://bafybeicnxnnksu4zb7k6bnrjum6atki6ik6id6e2orw6hiuq5hh7fq4zcq.ipfs.nftstorage.link/" },
      { id: 3, data: "https://bafybeia44gd2o2pkbzmhdru5gyfvly5ev75jrfsetqy3k4oegj2dfrcmie.ipfs.nftstorage.link/" },
      { id: 4, data: "https://bafybeid6lpzo5h4n2bczh5mya66sdcw2rsjxbxyoa7e57vpwxttkewjsyy.ipfs.nftstorage.link/" },
      { id: 0, data: "https://bafybeiccf6bnqkfrsreaxajhjb7kxvsckts2g2o26arclguwvozhgzmisa.ipfs.nftstorage.link/" },
    ];
  res.sendStatus(200)
})

// Start the timer
const queueTimer = setInterval(processQueueWithTimer, timerInterval);

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
  