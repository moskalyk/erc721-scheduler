import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { sequence } from '0xsequence'
import img0 from './0.png'
import img1 from './1.png'
import img2 from './2.png'
import img3 from './3.png'

import { ethers } from 'ethers'

import { SequenceIndexerClient } from '@0xsequence/indexer'

let index = 0;
const wait = (ms: any) => {
  return new Promise((res) => setTimeout(res, ms))
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  // const [index, setIndex] = useState(0)
  const [init, setInit] = useState(false)
  const [accountAddress, setAccountAddress] = useState<any>(null)

  sequence.initWallet({defaultNetwork: 'base-goerli'})

  const images = [
    null,
    img0,
    null,
    img1,
    null,
    img2,
    null, 
    img3,
  ]

  React.useEffect(() => {
    if(!init && isLoggedIn){
      setInit(true)
      setInterval(async () => {
        const comps = document.getElementsByClassName('c-glitch__img');
        console.log(comps)
        const indexer = new SequenceIndexerClient('https://base-goerli-indexer.sequence.app')
        const contractAddress = '0x426e1787e32f231408410e699E0E31FE6C34CFA8'
        const nftBalances = await indexer.getTokenBalances({
            contractAddress: contractAddress,
            accountAddress: accountAddress,
            includeMetadata: true
        })
        console.log(nftBalances.balances[0].tokenMetadata?.image)
          for (var i = 0; i < comps.length; i++) {
            var element = comps[i] as HTMLElement;
            element.style.background = `url(${nftBalances.balances[0].tokenMetadata?.image})`
            console.log(images[index])
        }
        // setIndex(index+1)
        console.log(index)
        index++
        if(index == images.length) index = 0
      }, 2000)
    }
    return () => {
      // This cleanup function will run when the component is unmounted
      console.log('Component unmounted');
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
        console.log('collection of items:', nftBalances)
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

        // try{
          const wallet = await sequence.getWallet()
          const signer = await wallet.getSigner(84531)
          console.log(signer)
          // const res = await signer.sendTransaction(tx)
          // console.log(res)
        // }catch(e){
          // console.log('ERROR')
          // console.log(e)
        // }
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
