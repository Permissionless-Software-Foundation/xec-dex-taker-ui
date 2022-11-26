/*
  Shows NFTs for sale on the DEX.
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Card, Col, Button, Spinner } from 'react-bootstrap'
import axios from 'axios'
import Jdenticon from '@chris.troutner/react-jdenticon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo } from '@fortawesome/free-solid-svg-icons'
import RetryQueue from '@chris.troutner/retry-queue'

// Local libraries
import config from '../../config'
import TokenCard from './token-card'

// Global variables and constants
const SERVER = `${config.server}/`

class NFTs extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appData: props.appData,
      offers: [],
      iconsAreLoaded: false,
      reloadInterval: null,
      page: 1,

      // Pass state from App.js parent to this child component.
      nftOfferCache: props.appData.nftOfferCache,
      setNftOfferCache: props.appData.setNftOfferCache,
      getNftOfferCache: props.appData.getNftOfferCache
    }

    // Encapsulate dependencies
    this.retryQueue = new RetryQueue({
      concurrency: 5,
      attempts: 2,
      retryPeriod: 2000
    })

    // Bind this object to event handlers
    this.handleOffers = this.handleOffers.bind(this)
    this.handleNextPage = this.handleNextPage.bind(this)
    this.getTokenDataWrapper = this.getTokenDataWrapper.bind(this)
    this.tokenDownloadedCB = this.tokenDownloadedCB.bind(this)
    this.checkIfIconsAreDownloaded = this.checkIfIconsAreDownloaded.bind(this)
    this.handleStartProcessingTokens = this.handleStartProcessingTokens.bind(this)
  }

  // Executes when the component mounts.
  async componentDidMount () {
    await this.handleStartProcessingTokens()
  }

  async handleStartProcessingTokens () {
    await this.setState({
      iconsAreLoaded: false,
      page: 1
    })

    // Retrieve initial offer data
    await this.handleOffers()

    // This interval checks to see if all token icons have been downloaded.
    this.tokenIconDownloadInterval = setInterval(() => {
      this.checkIfIconsAreDownloaded()
    }, 2000)
  }

  // This function checks to see if all tokens icons have been downloaded. If
  // they have, it hides the animated 'Loading Token Icons' component and
  // kills the interval that calls this function.
  checkIfIconsAreDownloaded () {
    const offers = this.state.offers

    // Exit if the offers array is empty.
    if (!offers.length) return

    // Loop through each offer.
    let iconsStillDownloading = false
    for (let i = 0; i < offers.length; i++) {
      const thisOffer = offers[i]

      if (!thisOffer.iconDownloaded) {
        iconsStillDownloading = true
      }
    }

    if (!iconsStillDownloading) {
      // Hide the 'Loading Token Icons' component.
      this.setState({ iconsAreLoaded: true })

      // Kill the interval that calls this function.
      clearInterval(this.tokenIconDownloadInterval)
    }
  }

  render () {
    const tokenCards = this.generateCards()

    return (
      <>
        <Container>
          <Row>
            <Col xs={6}>
              <Button variant='success' onClick={this.handleStartProcessingTokens}>
                <FontAwesomeIcon icon={faRedo} size='lg' /> Refresh
              </Button>
            </Col>

            <Col xs={4} style={{ textAlign: 'right' }}>
              {
                this.state.iconsAreLoaded
                  ? null
                  : (<Button variant='secondary'>Loading Token Icons <Spinner animation='border' /></Button>)
              }

            </Col>

            <Col xs={2} style={{ textAlign: 'right' }} />
          </Row>
          <br />

          <Row>
            {tokenCards}
          </Row>

          <Row>
            <Col xs={6}>
              <Button variant='success' onClick={this.handleNextPage}>
                <FontAwesomeIcon icon={faRedo} size='lg' /> Load More
              </Button>
            </Col>
            <Col />
          </Row>
        </Container>
      </>
    )
  }

  // Click handler for the 'Load More' button at the bottom of the UI.
  async handleNextPage (event) {
    console.log('nextPage() called.')
    let nextPage = this.state.page

    // const existingOffers = this.state.offers
    // console.log('existingOffers: ', existingOffers)

    const newOffers = await this.getNftOffers(nextPage)
    // console.log('newOffers: ', newOffers)

    // Exit if there are no new offers.
    if (!newOffers.length) return

    // Only increment the page count if the current page returns full results.
    if (newOffers.length >= 6) {
      nextPage++
    }
    console.log(`nextPage: ${nextPage}`)

    const offers = this.combineOffers(newOffers)
    // console.log('handleNextPage combined offers: ', offers)

    await this.setState({
      offers,
      page: nextPage,
      iconsAreLoaded: false
    })

    // This interval checks to see if all token icons have been downloaded.
    this.tokenIconDownloadInterval = setInterval(() => {
      this.checkIfIconsAreDownloaded()
    }, 2000)

    this.lazyLoadTokenIcons3()
  }

  // This function gets a page of Offer objects. It kicks off a lazy-load
  // non-blocking event stream for downloading token icons. Caches are used to
  // reduce the number of API calls.
  async handleOffers () {
    try {
      let offers = await this.getNftOffers()
      console.log('offers: ', offers)

      const { hydratedOffers, cachedOfferFound } = this.hydrateOffersFromCache(offers)
      console.log('cachedOfferFound: ', cachedOfferFound)
      console.log('hydratedOffers.length: ', hydratedOffers.length)

      if (cachedOfferFound) {
        offers = hydratedOffers
      }

      this.setState({
        offers
      })

      await this.lazyLoadTokenIcons3()
    } catch (err) {
      console.error('Error in handleOffers: ', err)
      // Do NOT throw errors
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
    const nftOfferCache = this.state.getNftOfferCache()
    console.log('hydrateOffersFromCache() nftOfferCache: ', nftOfferCache)

    for (let i = 0; i < offers.length; i++) {
      const thisOffer = offers[i]
      // console.log('hydrateOffersFromCache() thisOffer.p2wdbHash: ', thisOffer.p2wdbHash)

      // Test if the offer already exists in the cache.
      const cacheIndex = nftOfferCache.findIndex(x => x.p2wdbHash === thisOffer.p2wdbHash)
      // console.log('hydrateOffersFromCache() cacheIndex: ', cacheIndex)

      // Replace the offer with the hydrated one from the cache, if it exists
      // in the cache.
      if (cacheIndex > -1) {
        offers[i] = nftOfferCache[cacheIndex]

        cachedOfferFound = true
      }
    }

    const hydratedOffers = offers

    return { hydratedOffers, cachedOfferFound }
  }

  // REST request to get Offer data from bch-dex
  async getNftOffers (page = 0) {
    try {
      const options = {
        method: 'GET',
        url: `${SERVER}offer/list/nft/${page}`,
        data: {}
      }
      const result = await axios.request(options)
      // console.log('result.data: ', result.data)

      const rawOffers = result.data

      // Add a default icon.
      // rawOffers.map(x => x.icon = (<Jdenticon size='100' value={x.tokenId} />))
      for (let i = 0; i < rawOffers.length; i++) {
        const thisOffer = rawOffers[i]

        thisOffer.icon = (<Jdenticon size='100' value={thisOffer.tokenId} />)
        thisOffer.iconDownloaded = false

        // Cost of token in sats
        const rateInSats = parseInt(thisOffer.rateInBaseUnit)
        console.log('rateInSats: ', rateInSats)

        // const bchaPrice = this.state.appData.bchWalletState.bchUsdPrice * 1000000
        const bchaPrice = this.state.appData.bchWalletState.bchUsdPrice / 100
        console.log('bchaPrice: ', bchaPrice)

        // I'm not sure where the extra divide by 10 is coming from.
        // thisOffer.usdPrice = satCost * rateInSats * thisOffer.numTokens
        thisOffer.usdPrice = bchaPrice * rateInSats * thisOffer.numTokens
        console.log(`thisOffer.usdPrice: ${thisOffer.usdPrice}`)
        thisOffer.usdPrice = `$${thisOffer.usdPrice.toFixed(3)}`

        // const bchjs = this.state.appData.bchWallet.bchjs
        //
        // // Cost of token in sats
        // const rateInSats = parseInt(thisOffer.rateInBaseUnit)
        // console.log('rateInSats: ', rateInSats)
        //
        // // Cost of XEC in USD
        // const bchCost = bchjs.BitcoinCash.toBitcoinCash(rateInSats)
        // console.log('bchCost: ', bchCost)
        //
        // // Cost of XEC per sat
        // const satCost = bchCost / 100
        //
        // // I'm not sure where the extra divide by 100 is coming from.
        // thisOffer.usdPrice = satCost * rateInSats / 100
        // console.log(`thisOffer.usdPrice: ${thisOffer.usdPrice}`)
      }

      return rawOffers
    } catch (err) {
      console.error('Error in getOffers() ', err)
      return []
    }
  }

  // This function takes in an array of new Offers and combines it with the
  // array of existing offers in the app state.
  combineOffers (serverOffers) {
    const existingOffers = this.state.offers
    const unseenOffers = []

    // console.log('existingOffers: ', existingOffers)
    // console.log('serverOffers: ', serverOffers)

    // Loop through each array. Skip the ones that already exist in the
    // existingOffers array.
    for (let i = 0; i < serverOffers.length; i++) {
      const thisOffer = serverOffers[i]
      let existingFound = false

      for (let j = 0; j < existingOffers.length; j++) {
        const existingOffer = existingOffers[j]

        // Handles the case of the server giving the same offer in two different
        // page requests.
        if (thisOffer.tokenId === existingOffer.tokenId) {
          existingFound = true
          break
        }
      }
      if (existingFound) continue

      // Add an tempory icon if this is a new Offer.
      if (!thisOffer.iconDownloaded) {
        console.log(`token ${thisOffer.tokenId} needs icon download 2`)
        // thisOffer.icon = (<Jdenticon size='100' value={thisOffer.tokenId} />)
        thisOffer.icon = (<Spinner animation='border' />)
        thisOffer.iconDownloaded = false

        // Convert sats to BCH, and then calculate cost in USD.
        const bchjs = this.state.appData.bchWallet.bchjs
        const rateInSats = parseInt(thisOffer.rateInBaseUnit)
        console.log('rateInSats: ', rateInSats)
        const bchCost = bchjs.BitcoinCash.toBitcoinCash(rateInSats)
        console.log('bchCost: ', bchCost)
        console.log('bchUsdPrice: ', this.state.appData.bchWalletState.bchUsdPrice)
        let usdPrice = bchCost * this.state.appData.bchWalletState.bchUsdPrice
        usdPrice = bchjs.Util.floor8(usdPrice)
        const priceStr = `$${usdPrice.toFixed(3)}`
        thisOffer.usdPrice = priceStr
      }

      unseenOffers.push(thisOffer)
    }

    console.log('unseenOffers: ', unseenOffers)

    const combinedOffers = existingOffers.concat(unseenOffers)

    return combinedOffers
  }

  // This function generates a Token Card for each token in the wallet.
  generateCards () {
    // console.log('generateCards() offerData: ', offerData)

    const tokens = this.state.offers

    const tokenCards = []

    for (let i = 0; i < tokens.length; i++) {
      const thisToken = tokens[i]
      // console.log(`thisToken: ${JSON.stringify(thisToken, null, 2)}`)

      const thisTokenCard = (
        <TokenCard
          appData={this.state.appData}
          token={thisToken}
          key={`${thisToken.tokenId}`}
        />
      )
      tokenCards.push(thisTokenCard)
    }

    return tokenCards
  }

  // Lazy load the token icons using the auto-retry queue.
  async lazyLoadTokenIcons3 () {
    const offers = this.state.offers
    // console.log(`lazy loading these tokens: ${JSON.stringify(tokens, null, 2)}`)

    // const wallet = this.state.appData.bchWallet

    for (let i = 0; i < offers.length; i++) {
      const thisOffer = offers[i]

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

  // This function is called once the token data has finished downloading.
  // It updates the state of the app, to render the token icon.
  tokenDownloadedCB (offer) {
    if (!offer.iconDownloaded) {
      console.log(`Updating token icon for token ID ${offer.tokenId}`)

      // Test if token icon is compatible with one of the specs.
      const specCompat = offer.tokenData.iconRepoCompatible || offer.tokenData.ps002Compatible

      if (offer.tokenData.optimizedTokenIcon && specCompat) {
        // Use the optimized token icon URL if it is available.

        const newIcon = (
          <Card.Img src={offer.tokenData.optimizedTokenIcon} />
        )

        // Add the JSX for the icon to the token object.
        offer.icon = newIcon
        // thisOffer.mutableData = mutableData
      } else if (offer.tokenData.tokenIcon && specCompat) {
        // If the optimized token icon URL is not available, try to use the
        // original token icon URL.

        const newIcon = (
          <Card.Img src={offer.tokenData.tokenIcon} />
        )

        // Add the JSX for the icon to the token object.
        offer.icon = newIcon
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

      // Update the offer cache stored by the parent component.
      this.state.setNftOfferCache(offers)

      // Trigger a render with the new token icon.
      this.setState({ offers })
    }
  }

  // This function wraps the xec-dex-lib getTokenData() function in a promise-based
  // function with an object input, so that it can be called by the retry-queue.
  async getTokenDataWrapper (inObj) {
    const { offer, callback } = inObj

    await this.state.appData.dex.tokenData.getTokenData(offer, callback)
  }
}

export default NFTs
