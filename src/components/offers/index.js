/*
  This React components downloads the active Offers from the REST API and
  displays them in a data table.
*/

// Global npm libraries
import React from 'react'
import { Button, Image } from 'react-bootstrap'
import axios from 'axios'
import RetryQueue from '@chris.troutner/retry-queue'

// Local libraries
import config from '../../config'
import WaitingModal from '../waiting-modal'
import VerifiedTokens from './verified'
import LargeOfferTable from './large-offer-table.js'
import SmallOfferTable from './small-offer-table.js'

// Global variables and constants
const SERVER = `${config.server}/`
// let _this

class Offers extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      balance: '',
      textInput: '',
      // wallet: props.wallet,
      appData: props.appData,
      offers: [],

      // Modal state
      showModal: false,
      modalBody: [],
      hideSpinner: false,
      denyClose: false,

      // Pass state from App.js parent to this child component.
      fungibleOfferCache: props.appData.fungibleOfferCache,
      setFungibleOfferCache: props.appData.setFungibleOfferCache,
      getFungibleOfferCache: props.appData.getFungibleOfferCache
    }

    // Encapsulate dependencies
    this.retryQueue = new RetryQueue({
      concurrency: 5,
      attempts: 2,
      retryPeriod: 2000
    })

    // Bind 'this' object to functions below.
    this.handleBuy = this.handleBuy.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
    this.lazyLoadTokenIcons = this.lazyLoadTokenIcons.bind(this)
    this.getTokenDataWrapper = this.getTokenDataWrapper.bind(this)
    this.tokenDownloadedCB = this.tokenDownloadedCB.bind(this)

    // Encapsulate dependencies
    this.verify = new VerifiedTokens()

    // _this = this
  }

  render () {
    // console.log('Rendering Fungible Offers View')
    // console.log(`Rendering with this offer data: ${JSON.stringify(this.state.offers, null, 2)}`)

    const heading = 'Generating Counter Offer...'

    return (
      <>
        {
          this.state.showModal
            ? <WaitingModal
                heading={heading}
                body={this.state.modalBody}
                hideSpinner={this.state.hideSpinner}
                denyClose={this.state.denyClose}
                closeFunc={this.onModalClose}
              />
            : null
        }

        <SmallOfferTable offers={this.state.offers} />
        <LargeOfferTable offers={this.state.offers} />
      </>
    )
  }

  // Executes when the component mounts.
  async componentDidMount () {
    // Retrieve initial offer data
    this.handleOffers()

    // Get data and update the table periodically.
    setInterval(() => {
      this.handleOffers()
    }, 30000)
  }

  // Get Offer data from bch-dex and manipulate it for the sake of presentation.
  async handleOffers () {
    // Get raw offer data.
    let offerRawData = await this.getOffers()

    const { hydratedOffers, cachedOfferFound } = this.hydrateOffersFromCache(offerRawData)

    if (cachedOfferFound) {
      offerRawData = hydratedOffers
    } else {
      console.log('cached offer not found')
    }

    // Clone the offerRawData array
    const offers = []

    for (let i = 0; i < offerRawData.length; i++) {
      const thisOffer = offerRawData[i]
      // console.log(`thisOffer: ${JSON.stringify(thisOffer, null, 2)}`)

      // Skip if this offer has already been initialize hydated.
      if (thisOffer.initHydrated) {
        offers.push(thisOffer)
        continue
      }

      // Skip scam tokens that try to impersonate verified tokens.
      const isScam = this.verify.checkTicker(thisOffer.ticker, thisOffer.tokenId)
      if (isScam) continue

      // Get and format the token ID
      const tokenId = thisOffer.tokenId
      const smallTokenId = this.cutString(tokenId)
      thisOffer.tokenIdLink = (<a href={`https://token.fullstack.cash/?tokenid=${tokenId}`} target='_blank' rel='noreferrer'>{smallTokenId}</a>)

      // Get and format the P2WDB ID
      const p2wdbHash = thisOffer.p2wdbHash
      const smallP2wdbHash = this.cutString(p2wdbHash)

      thisOffer.button = (<Button text='Buy' variant='success' size='sm' id={p2wdbHash} onClick={this.handleBuy}>Buy</Button>)

      thisOffer.p2wdbHashLink = (<a href={`https://xec-p2wdb.fullstack.cash/entry/hash/${p2wdbHash}`} target='_blank' rel='noreferrer'>{smallP2wdbHash}</a>)

      // console.log('this.state.appData: ', this.state.appData)

      // console.log(`thisOffer: ${JSON.stringify(thisOffer, null, 2)}`)

      // Convert sats to BCH, and then calculate cost in USD.
      const bchjs = this.state.appData.bchWallet.bchjs
      const rateInSats = parseInt(thisOffer.rateInBaseUnit)
      // console.log('rateInSats: ', rateInSats)
      const bchCost = bchjs.BitcoinCash.toBitcoinCash(rateInSats)
      // console.log('bchCost: ', bchCost)
      // console.log('bchUsdPrice: ', this.state.appData.bchWalletState.bchUsdPrice)
      const usdPrice = bchCost * this.state.appData.bchWalletState.bchUsdPrice * thisOffer.numTokens
      // console.log('usdPrice: ', usdPrice)
      const priceStr = `$${usdPrice.toFixed(3)}`
      thisOffer.usdPrice = priceStr

      // console.log(`thisOffer: ${JSON.stringify(thisOffer, null, 2)}`)

      // Signal that this offer has been hydrated with initial data.
      thisOffer.initHydrated = true

      thisOffer.iconDownloaded = false

      offers.push(thisOffer)
    }

    this.setState({
      offers
    })
    // console.log('offers: ', offers)

    // Kick off a lazy load of the token icons.
    this.lazyLoadTokenIcons()
  }

  lazyLoadTokenIcons () {
    const offers = this.state.offers

    for (let i = 0; i < offers.length; i++) {
      const thisOffer = offers[i]
      // console.log('lazyLoadTokenIcons() thisOffer: ', thisOffer)

      // Get token data if it hasn't already been downloaded.
      const tokenData = thisOffer.tokenData
      if (!tokenData) {
        // Prepare the object to pass to the queue.
        const inObj = {
          offer: thisOffer,
          callback: this.tokenDownloadedCB
        }

        // Kick off async token icon download. This function is not 'awaited'
        // as it should not block execution.
        this.retryQueue.addToQueue(this.getTokenDataWrapper, inObj)
      }
    }
  }

  // This function wraps the xec-dex-lib getTokenData() function in a promise-based
  // function with an object input, so that it can be called by the retry-queue.
  async getTokenDataWrapper (inObj) {
    const { offer, callback } = inObj

    await this.state.appData.dex.tokenData.getTokenData(offer, callback)
  }

  // This function is called once the token data has finished downloading.
  // It updates the state of the app, to render the token icon.
  tokenDownloadedCB (offer) {
    // console.log('tokenDownloadedCB() offer: ', offer)

    if (!offer.iconDownloaded) {
      // console.log(`Updating token icon for token ID ${offer.tokenId}`)

      // Test if token icon is compatible with one of the specs.
      const specCompat = offer.tokenData.iconRepoCompatible || offer.tokenData.ps002Compatible

      if (offer.tokenData.optimizedTokenIcon && specCompat) {
        // Use the optimized token icon URL if it is available.

        const currentTicker = offer.ticker

        const newIcon = (
          <div>
            <Image thumbnail src={offer.tokenData.optimizedTokenIcon} style={{ maxWidth: '75px' }} />
            <p>{currentTicker}</p>
          </div>
        )

        // Add the JSX for the icon to the token object.
        offer.ticker = newIcon
        // thisOffer.mutableData = mutableData
      } else if (offer.tokenData.tokenIcon && specCompat) {
        // If the optimized token icon URL is not available, try to use the
        // original token icon URL.

        const currentTicker = offer.ticker

        const newIcon = (
          <div>
            <Image src={offer.tokenData.tokenIcon} style={{ maxWidth: '75px' }} />
            <p>{currentTicker}</p>
          </div>
        )

        // Add the JSX for the icon to the token object.
        offer.ticker = newIcon
        // thisOffer.mutableData = mutableData
      }

      // If neither token icon URL is available, default to the JDenticon.

      offer.iconDownloaded = true

      // Replace the offer in the offers array.
      const offers = this.state.offers
      const offerIndex = offers.findIndex(x => x.p2wdbHash === offer.p2wdbHash)
      if (offerIndex) {
        offers[offerIndex] = offer
      }

      // Trigger a render with the new token icon.
      this.setState({ offers })

      // Update the offer cache stored by the parent component.
      // console.log('Adding offers to offer cache')
      this.state.setFungibleOfferCache(offers)
    }
  }

  // This function expects an array of offers as input. Each offer is uniquely
  // identified by it's p2wdbHash property. If that offer has already been
  // hydrated and exists in the cache, the input entry is replaced with the
  // hydrated entry from the cache.
  // This function edits the array in-place, and returns the array.
  hydrateOffersFromCache (offers) {
    if (!Array.isArray(offers)) { throw new Error('offers must be an array of Offer objects.') }

    let cachedOfferFound = false
    // const fungibleOfferCache = this.state.fungibleOfferCache
    const fungibleOfferCache = this.state.getFungibleOfferCache()
    // console.log('hydrateOffersFromCache() fungibleOfferCache: ', fungibleOfferCache)

    for (let i = 0; i < offers.length; i++) {
      const thisOffer = offers[i]
      // console.log('hydrateOffersFromCache() thisOffer.p2wdbHash: ', thisOffer.p2wdbHash)

      // Test if the offer already exists in the cache.
      const cacheIndex = fungibleOfferCache.findIndex(x => x.p2wdbHash === thisOffer.p2wdbHash)
      // console.log('hydrateOffersFromCache() cacheIndex: ', cacheIndex)

      // Replace the offer with the hydrated one from the cache, if it exists
      // in the cache.
      if (cacheIndex > -1) {
        offers[i] = fungibleOfferCache[cacheIndex]

        cachedOfferFound = true
      }
    }

    const hydratedOffers = offers

    return { hydratedOffers, cachedOfferFound }
  }

  async handleBuy (event) {
    try {
      console.log('Buy button clicked. Event: ', event)

      const targetOffer = event.target.id
      console.log('targetOffer: ', targetOffer)

      // Initialize modal
      this.setState({
        showModal: true,
        modalBody: ['Generating Counter Offer...', '(This can take a couple minutes)'],
        hideSpinner: false,
        denyClose: true
      })

      // Generate a Counter Offer.
      const bchDexLib = this.state.appData.dex
      const p2wdbOut = await bchDexLib.take.takeOffer(targetOffer)
      console.log('p2wdbOut: ', p2wdbOut)

      // Handle different output types.
      let p2wdbHash = p2wdbOut.hash
      if (p2wdbHash.hash) p2wdbHash = p2wdbHash.hash

      // Add link to output
      const modalBody = []
      modalBody.push('Success!')
      modalBody.push(<a href={`https://xec-p2wdb.fullstack.cash/entry/hash/${p2wdbHash}`} target='_blank' rel='noreferrer'>P2WDB Entry</a>)
      modalBody.push('What happens next:')
      modalBody.push('The money has not yet left your wallet! It is still under your control.')
      modalBody.push('If the sellers node is online, they will accept the Counter Offer you just generated in a few minutes.')
      modalBody.push('If the tokens never show up, you can sweep the funds back into your wallet.')

      this.setState({
        modalBody,
        hideSpinner: true,
        denyClose: false
      })
    } catch (err) {
      this.setState({
        showModal: true,
        modalBody: ['Error trying to generate Counter Offer!', err.message],
        hideSpinner: true,
        denyClose: false
      })
    }
  }

  // REST request to get data from avax-dex
  async getOffers () {
    try {
      const options = {
        method: 'GET',
        url: `${SERVER}offer/list/fungible/0`,
        data: {}
      }
      const result = await axios.request(options)
      // console.log('result.data: ', result.data)

      return result.data
    } catch (err) {
      console.warn('Error in getOffers() ', err)
    }
  }

  // Given a large string, it will return a string with the first and last
  // four characters.
  cutString (str) {
    try {
      const subTxid = str.slice(0, 4)
      const subTxid2 = str.slice(-4)
      return `${subTxid}...${subTxid2}`
    } catch (err) {
      console.warn('Error in cutString() ', err)
    }
  }

  onModalClose () {
    this.setState({ showModal: false })
  }
}

export default Offers
