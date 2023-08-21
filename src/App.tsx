import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { sequence } from '0xsequence'

import { ethers } from 'ethers'

import { SequenceIndexerClient } from '@0xsequence/indexer'

import {abi} from './abi'

let index = 0;
const wait = (ms: any) => {
  return new Promise((res) => setTimeout(res, ms))
}

const calculateThreshold = (percentages: any) => {
  const total = percentages.reduce((sum: any, percentage: any) => sum + percentage, 0);
  return total === 1 ? 1 : total;
};

const HorizontalBar = ({ percentages }: any) => {
  const threshold = calculateThreshold(percentages);

  return (
    <div className="horizontal-bar">
      {percentages.map((percentage: any, index: any) => (
        <div
          key={index}
          className="segment"
          style={{
            width: `calc(${(percentage / threshold) * 100}% - 2px)`,
            backgroundColor: ['red', 'green', 'blue', 'yellow', 'hotpink', 'brown'][index], // Colors based on index
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  // const [index, setIndex] = useState(0)
  const [init, setInit] = useState(false)
  const [accountAddress, setAccountAddress] = useState<any>(null)
  const [percentages, setPercentages] = useState<any>([0.2, 0.3, 0.25, 0.10, 0.15])
  const [screen, setScreen] = useState<any>(null)
  sequence.initWallet({defaultNetwork: 'base-goerli'})

  React.useEffect(() => {
    getSchedule()
    if(!init && isLoggedIn){
      watcher()
      setInit(true)
    }
    return () => {
    };
  }, [isLoggedIn])

  const connect = async () => {
    const filterImage = document.getElementById('filter-image');
    const applyFilterButton = document.getElementById('apply-filter');

    if(!isLoggedIn){
      console.log(isLoggedIn)
      const wallet = await sequence.getWallet()
      const details = await wallet.connect({
        app: 'sequence.tv'
      })
      if(details.connected){
        if (!isLoggedIn) {
          filterImage!.classList.add('filtered');
          applyFilterButton!.textContent = 'Turn off';
        } else {
          filterImage!.classList.remove('filtered');
          applyFilterButton!.textContent = 'Mint to turn on';
        }

        // todo get balance, and void transaction to mint
        const indexer = new SequenceIndexerClient('https://base-goerli-indexer.sequence.app')
        const contractAddress = '0x426e1787e32f231408410e699E0E31FE6C34CFA8'

        // try any contract and account address you'd like :)
        const accountAddress = details.session?.accountAddress

        // query Sequence Indexer for all nft balances of the account on Polygon
        const nftBalances = await indexer.getTokenBalances({
            contractAddress: contractAddress,
            accountAddress: accountAddress,
            includeMetadata: true
        })

        let has = false
        nftBalances.balances.map((balance: any) => {
          if(balance.contractAddress=="0x426e1787e32f231408410e699e0e31fe6c34cfa8" && Number(balance.balance) > 0){
            has = true
          }
        })

        if(!has){
          const interface721 = new ethers.utils.Interface([
            'function collect() external'
          ])

          const data = interface721.encodeFunctionData('collect', [])

          const tx = {
            to: contractAddress,
            data
          }
          console.log(tx)

          await wait(1000)
          const wallet = await sequence.getWallet()
          const signer = await wallet.getSigner(84531)
          console.log(signer)
          const res = await signer.sendTransaction(tx)
          console.log(res)
      }
      setIsLoggedIn(!isLoggedIn)

      } 
    } else {
      if (!isLoggedIn) {
        filterImage!.classList.add('filtered');
        applyFilterButton!.textContent = 'Turn off';
      } else {
        filterImage!.classList.remove('filtered');
        applyFilterButton!.textContent = 'Turn on';
      }
      setIsLoggedIn(!isLoggedIn)
    }
  }
  const jsonQueue = [
    { id: 1, data: "https://bafybeidkgg4fowas234dnibzpz4yslhb2eqr6oq7lmiqcmz4wdls27p4ca.ipfs.nftstorage.link/" },
    { id: 2, data: "https://bafybeicnxnnksu4zb7k6bnrjum6atki6ik6id6e2orw6hiuq5hh7fq4zcq.ipfs.nftstorage.link/" },
    { id: 3, data: "https://bafybeia44gd2o2pkbzmhdru5gyfvly5ev75jrfsetqy3k4oegj2dfrcmie.ipfs.nftstorage.link/" },
    { id: 4, data: "https://bafybeid6lpzo5h4n2bczh5mya66sdcw2rsjxbxyoa7e57vpwxttkewjsyy.ipfs.nftstorage.link/" },
    { id: 0, data: "https://bafybeiccf6bnqkfrsreaxajhjb7kxvsckts2g2o26arclguwvozhgzmisa.ipfs.nftstorage.link/" },
  ];

  const simulate = async () => {
    for(let uri of jsonQueue){
      const likeRandomzz = Math.floor(Math.random()*100)
      for(let j = 0; j < likeRandomzz; j++){
        const res1 = await fetch("http://localhost:4000/like", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ 
            uri: uri.data
          }),
        })
      }
    }
    const res = await fetch('http://localhost:4000/times')
    const json = await res.json()
    console.log(json)
    setPercentages(json.times)
  }

  const getSchedule = async () => {
    try{
      const res = await fetch('http://localhost:4000/times')
      const json = await res.json()
      console.log(json)
      setPercentages(json.times)
    }catch(err){
      console.log(err)
    }
  }

  const watcher = () => {
    setInterval(async () => {
      const provider = new ethers.providers.JsonRpcProvider('https://nodes.sequence.app/base-goerli');

      // ERC-721/ERC-1155 Token Contract ABI
      const contractAddress = '0x426e1787e32f231408410e699E0E31FE6C34CFA8'

      // Get an instance of the token contract
      const tokenContract = new ethers.Contract(contractAddress, abi, provider);

      // Call the tokenURI function
      const tokenURI = await tokenContract.tokenURI(0);
      console.log(tokenURI)
      const res = await fetch(tokenURI)
      const json = await res.json()
      setScreen(json.image)

      const comps = document.getElementsByClassName('c-glitch__img');
      for (var i = 0; i < comps.length; i++) {
        var element = comps[i] as HTMLElement;
        element.style.background = `url(${json.image})`
      }
    }, 1000)
  }

  return (
    <div className="App">
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <p style={{fontFamily: 'Orbitron'}}>schedule</p>
      <HorizontalBar percentages={percentages} />
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <button id="simulate" onClick={() => {simulate()}} style={{cursor: 'pointer', marginTop: '-80px'}}>Simulate</button>
      <br/>
      <br/>
      <div className="container">
        <div id="filter-image">
          <div className="c-glitch">
              <div className="c-glitch__img"></div>
              <div className="c-glitch__img"></div>
              <div className="c-glitch__img"></div>
              <div className="c-glitch__img"></div>
              <div className="c-glitch__img"></div>
          </div>
        </div>
        <div className="tv-set">
        </div>
        <button onClick={() => {connect()}} id="apply-filter" style={{cursor: 'pointer', marginTop: '-80px'}}>Mint to turn on</button>
        <br/>
        <br/>
      </div>
    </div>
  );
}

export default App;
