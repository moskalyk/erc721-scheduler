import * as dotenv from "dotenv";
import { v2 } from '@0xsequence/core'
import { RpcRelayer } from '@0xsequence/relayer'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers, utils } from 'ethers'
import { Wallet } from '@0xsequence/wallet'

dotenv.config();

// Ensure you have run 'npm install mongodb'
import mongoose from 'mongoose';
import { parseBuffer } from 'music-metadata';
import { Media } from './models/Media.ts'
import { Counter } from './models/Counter.ts'

// ethereum
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

// mongo
var username = 'mm';
var password = process.env.PASSWORD;
var hosts = 'lon5-c14-0.mongo.objectrocket.com:43793,lon5-c14-1.mongo.objectrocket.com:43793,lon5-c14-2.mongo.objectrocket.com:43793';
var database = 'erc721';
var options = '?replicaSet=faf5ae88bece406282f758108bb2641e';
var connectionString = 'mongodb://' + username + ':' + password + '@' + hosts + '/' + database + options;
// Connect to the remote MongoDB database
console.log(connectionString)
mongoose.connect(connectionString)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

async function updateMediaTime(mediaId, newTime) {
    try {
        const updatedMedia = await Media.updateOne(
            { id: mediaId },  // Find the document with the specified mediaId
            { $set: { time: newTime } } // Update the time field with the new value
        );
        console.log('updated')
    } catch (error) {
        console.error('Error updating media time:', error);
    }
}

function shiftElementsUp(arr: any) {
    if (arr.length > 1) {
        const firstElement = arr.shift(); // Remove the first element
        arr.push(firstElement); // Push the first element to the end
    }
    return arr;
}

(async () => {

    // check if contents in media, 
    const media = await Media.find()
    if(media.length == 0){
        // if not add 6 media
        let jsonQueue = [
            { id: 1, data: "https://bafybeidkgg4fowas234dnibzpz4yslhb2eqr6oq7lmiqcmz4wdls27p4ca.ipfs.nftstorage.link/" },
            { id: 2, data: "https://bafybeicnxnnksu4zb7k6bnrjum6atki6ik6id6e2orw6hiuq5hh7fq4zcq.ipfs.nftstorage.link/" },
            { id: 3, data: "https://bafybeia44gd2o2pkbzmhdru5gyfvly5ev75jrfsetqy3k4oegj2dfrcmie.ipfs.nftstorage.link/" },
            { id: 4, data: "https://bafybeid6lpzo5h4n2bczh5mya66sdcw2rsjxbxyoa7e57vpwxttkewjsyy.ipfs.nftstorage.link/" },
            { id: 0, data: "https://bafybeiccf6bnqkfrsreaxajhjb7kxvsckts2g2o26arclguwvozhgzmisa.ipfs.nftstorage.link/" },
          ];
        
        for(let i = 0; i< 2; i++){
            const newMedia = new Media({ uri: jsonQueue[i].data, time: 30000, like: 0});
            newMedia.save()
            .then(savedUser => {
                console.log('User saved:', savedUser);
            })
            .catch(err => {
                console.error('Error saving user:', err);
            });
        }
    }

      // timer work
      async function performActionAfterWait(time, payload) {
        await processQueueWithTimer(payload)

        return new Promise((resolve: any) => {
          setTimeout(async () => {
            console.log(`Action performed after ${time} milliseconds`);
            resolve();
          }, time+7000);
        });
      }
      
      async function variableTimer(timeList) {
        console.log(timeList)
        for (const time of timeList) {
          await performActionAfterWait(time.time, time.uri);
        }
      }

      async function processQueueWithTimer(payload) {
          console.log('processing...')
          console.log(payload)
          processJson(payload); // Process the JSON object
      }

      async function processJson(json) {
        const contractAddress = '0x426e1787e32f231408410e699E0E31FE6C34CFA8'
        
        // Add your processing logic here
        const interface721 = new ethers.utils.Interface([
          'function setBaseURI(string memory baseURI_) onlyRelayer public'
        ])
      
        const data = interface721.encodeFunctionData('setBaseURI', [json])
      
        const tx = {
          to: contractAddress,
          data
        }
        
        try{
            const res = await wallet.sendTransaction(tx)
            console.log(res)
        }catch(err){
            console.log(err)
        }

        await fetch('https://metadata.sequence.app/tokens/84531/0x426e1787e32f231408410e699E0E31FE6C34CFA8/0/refresh')
      }

    function shiftTimeValuesDown(arr) {
        if (arr.length > 1) {
            const firstTime = arr[0].time;
            for (let i = 0; i < arr.length - 1; i++) {
                arr[i].time = arr[i + 1].time;
            }
            arr[arr.length - 1].time = firstTime;
        }
        return arr;
    }

    while(true){
        const media = await Media.find()
        const mediaSorted = media.sort((a, b) => a.id - b.id)

        const timeList = mediaSorted.map((media_: any) => {return {time: media_.time, uri: media_.uri}})
        // const shiftedList = shiftTimeValuesDown(timeList);

        try{
            // console.log(shiftedList)
            const res = await variableTimer(timeList)

        }catch(err){
            console.log(err)
        }
    }

    // await Media.deleteMany({})
    // await Counter.deleteMany({})
})()
