import * as dotenv from "dotenv";
import { v2 } from '@0xsequence/core'
import { RpcRelayer } from '@0xsequence/relayer'
import { Orchestrator } from '@0xsequence/signhub'
import { ethers, utils } from 'ethers'
import { Wallet } from '@0xsequence/wallet'
import { Web3Storage, File } from 'web3.storage'

dotenv.config();

import mongoose from 'mongoose';

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fetch from 'cross-fetch'
import { json } from "stream/consumers";

// music
import { parseBuffer } from 'music-metadata';
import axios from 'axios';
import { Media } from './models/Media.ts'

var username = 'mm';
var password = 'Asswordk';
var hosts = 'lon5-c14-0.mongo.objectrocket.com:43793,lon5-c14-1.mongo.objectrocket.com:43793,lon5-c14-2.mongo.objectrocket.com:43793';
var database = 'erc721';
var options = '?replicaSet=faf5ae88bece406282f758108bb2641e';
var connectionString = 'mongodb://' + username + ':' + password + '@' + hosts + '/' + database + options;
// Connect to the remote MongoDB database
mongoose.connect(connectionString)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('Error connecting to MongoDB:', err);
});

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

function getAccessToken () {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGMzNUMyQWVBQ2MwNTUxOUE3QTEwQTMwOTU4NzgxNWRGRDYzQTQyNGYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzgxMTM5MjQ4NzQsIm5hbWUiOiJkcm9wIn0.dVQgHZI22FSKzpkreIrDHA2nkq_2wHFD6-dUOprq9ng"
}

function makeStorageClient () {
  return new Web3Storage({ token: getAccessToken() })
}

async function storeFiles (files: any) {
  const client = makeStorageClient()
  const cid = await client.put(files)
  console.log('stored files with cid:', cid)
  return cid
}
  
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

const totalTime = 10000

// Start the timer
let index = 0;
let scheduleLength = 10000

function divideIntoEqualParts(scheduleLength, parts) {
  const equalPartsList = [];
  const partSize = scheduleLength / (parts);

  for (let i = 0; i < parts; i++) {
    equalPartsList.push(partSize);
  }

  return equalPartsList;
}

function calculateRelativeSizes(likes) {
  const totalLikes: any = Object.values(likes).reduce((sum: any, value: any) => sum + value, 0);
  const relativeSizes = [];
  console.log(totalLikes)

  for (const uri in likes) {
    const relativeSize = (likes[uri] / totalLikes) * scheduleLength;
    relativeSizes.push(relativeSize);
  }

  return relativeSizes;
}

const onlyAuthor = (req: any, res: any, next: any) => {
  if(req.body.author == process.env.AUTHOR) {
    next()
  } else {
    res.sendStatus(404)
  }
}

// server
app.post('/append', async (req: any, res: any) => {

  const files = []
    const audioUrl = req.body.uri
    const obj = { 
      name: 'Dial up ...',
      description: "A few track setlist",
      animation_url: audioUrl
    }
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })

    files.push(new File([blob], '0.json'))

    const cid = await storeFiles(files)
    const baseURI = `https://${cid}.ipfs.nftstorage.link/`;

    // Use axios to download the audio file
    axios({
        method: 'get',
        url: audioUrl,
        responseType: 'arraybuffer'
    })
    .then(response => {
      const contentType = response.headers['content-type'];

      // Determine the media file type based on the Content-Type header
      if (contentType.startsWith('image/')) {
          console.log('Media file is an image.');
          const newMedia = new Media({ uri: baseURI, time: 30000, like: 0});
          newMedia.save()
          // You can save the image buffer to a file or process it further as needed.
      } else if (contentType.startsWith('audio/')) {
          console.log('Media file is an audio.');
          console.log(response.data)
          const audioStream = response.data;
          const audioData = Buffer.from(audioStream);
          // Analyze the audio using fluent-ffmpeg
          parseBuffer(audioData)
          .then(metadata => {
              const durationInSeconds = metadata.format.duration;
              console.log('Audio duration (seconds):', durationInSeconds);
              const newMedia = new Media({ uri: baseURI, time: durationInSeconds*1000, like: 0});
              newMedia.save()
          })
          .catch(err => {
              console.error('Error analyzing audio:', err.message);
          });
          // You can save the audio buffer to a file or process it further as needed.
      } 
      else {
          console.log('Media file type not recognized:', contentType);
      }
    })
    .catch(error => {
        console.error('Error downloading audio:', error);
    });

  res.sendStatus(200)
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

app.post('/like', async (req: any, res: any) => {

  // likes[req.body.uri] = likes[req.body.uri]+1
  const media = await Media.findOne(
      { uri: req.body.uri },  // Find the document with the specified mediaId
  );
    console.log(media)
  const updatedMedia = await Media.updateOne(
            { uri: req.body.uri },  // Find the document with the specified mediaId
            { $set: { like: media.like + 1 } } // Update the time field with the new value
        );

  const all = await Media.find(
    {},
  );
  const tempLike: any = {}
  const likes = all.map((_) => { tempLike[_.uri] = _.like })

  const timeList = calculateRelativeSizes(tempLike)
  all.map(async (_, i) => {
    console.log(timeList[i])

    const updatedMedia = await Media.updateOne(
      { uri: _.uri },  // Find the document with the specified mediaId
      { $set: { time: timeList[i] } } // Update the time field with the new value
    );
  })

  res.sendStatus(200)
})

app.get('/times', async (req: any, res: any) => {
  const media = await Media.find({})
  const timeList = media.map((_: any) => _.time)
  res.send({times: timeList, status: 200})
})

// listening, important
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})
  