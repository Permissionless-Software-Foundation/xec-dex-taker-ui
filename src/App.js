/*
  This is an SPA that creates a template for future BCH web3 apps.
*/

// Global npm libraries
import React from 'react'
import { useQueryParam, StringParam } from 'use-query-params'
import P2WDB from 'p2wdb'
import BchDexLib from 'xec-dex-lib'
import SweepLib from 'xec-token-sweep'

// Local libraries
import './App.css'
import LoadScripts from './components/load-scripts'
import WaitingModal from './components/waiting-modal'
import AsyncLoad from './services/async-load'
import SelectServerButton from './components/servers/select-server-button'
import Footer from './components/footer'
import NavMenu from './components/nav-menu'
import AppBody from './components/app-body'
import LoadLocalStorage from './components/load-localstorage'

// Default restURL for a back-end server.
// let serverUrl = 'https://free-bch.fullstack.cash'
let serverUrl = 'https://xec-consumer-or1-usa.fullstackcash.nl'

// Default alternative servers.
const defaultServerOptions = [
  { value: 'https://xec-consumer-or1-usa.fullstackcash.nl', label: 'https://xec-consumer-or1-usa.fullstackcash.nl' },
  { value: 'https://wa-usa-xec-consumer.fullstackcash.nl', label: 'https://wa-usa-xec-consumer.fullstackcash.nl' }
]

let _this

class App extends React.Component {
  constructor (props) {
    super(props)

    // Encasulate dependencies
    this.asyncLoad = new AsyncLoad()

    this.state = {
      // State specific to this top-level component.
      walletInitialized: false,
      bchWallet: false, // BCH wallet instance
      menuState: 0, // The current View being displayed in the app
      queryParamExists: false, // Becomes true if query parameters are detected in the URL.
      serverUrl, // Stores the URL for the currently selected server.
      servers: defaultServerOptions, // A list of back end servers.

      // Startup Modal
      showStartModal: true, // Should the startup modal be visible?
      asyncInitFinished: false, // Did startup finish?
      asyncInitSucceeded: null, // Did startup finish successfully?
      modalBody: [], // Strings displayed in the modal
      hideSpinner: false, // Spinner gif in modal
      denyClose: false,
      showModal: true,

      // The wallet state make this a true progressive web app (PWA). As
      // balances, UTXOs, and tokens are retrieved, this state is updated.
      // properties are enumerated here for the purpose of documentation.
      bchWalletState: {
        mnemonic: undefined,
        address: undefined,
        cashAddress: undefined,
        slpAddress: undefined,
        privateKey: undefined,
        publicKey: undefined,
        legacyAddress: undefined,
        hdPath: undefined,
        bchBalance: 0,
        slpTokens: [],
        bchUsdPrice: 150
      },

      // Used to cache Offer data, so that token metadata does not need to be
      // downloaded so often. This state needs to reside in this parent component.
      nftOfferCache: [],
      fungibleOfferCache: [],

      // Will be replaced by library class once the library loads.
      Sweep: SweepLib,
      dex: null,
      p2wcb: null
    }

    this.cnt = 0

    // These values are set by load-localstorage.js when it reads Local Storage.
    this.mnemonic = undefined
    this.lsState = undefined // local storage state
    this.setLSState = undefined
    this.delLSState = undefined

    // Bind the 'this' object to event handlers
    this.passMnemonic = this.passMnemonic.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
    this.setNftOfferCache = this.setNftOfferCache.bind(this)
    this.getNftOfferCache = this.getNftOfferCache.bind(this)
    this.setFungibleOfferCache = this.setFungibleOfferCache.bind(this)
    this.getFungibleOfferCache = this.getFungibleOfferCache.bind(this)

    _this = this
  }

  async componentDidMount () {
    try {
      this.addToModal('Loading minimal-ecash-wallet')

      this.setState({
        denyClose: true
      })

      await this.asyncLoad.loadWalletLib()

      // Update the list of potential back end servers.
      this.addToModal('Getting alternative servers')
      const servers = await this.asyncLoad.getServers()
      this.setState({
        servers
      })

      // Initialize the BCH wallet with the currently selected server.
      this.addToModal('Initializing wallet')
      const bchWallet = await this.asyncLoad.initWallet(serverUrl, this.mnemonic, this.setLSState, this.updateBchWalletState)
      this.setState({
        bchWallet
      })

      // Get the BCH balance of the wallet.
      this.addToModal('Getting XEC balance')
      await this.asyncLoad.getWalletBchBalance(bchWallet, this.updateBchWalletState)

      // Get the SLP tokens held by the wallet.
      this.addToModal('Getting eToken balance')
      await this.asyncLoad.getSlpTokenBalances(bchWallet, this.updateBchWalletState)

      // Get the SLP tokens held by the wallet.
      this.addToModal('Getting XEC spot price in USD')
      await this.asyncLoad.getUSDExchangeRate(bchWallet, this.updateBchWalletState)

      // Instantiate the p2wdb and xec-dex-lib libraries
      this.addToModal('Instantiating P2WDB and DEX libraries')
      // const wif = bchWallet.walletInfo.privateKey

      // Instantiate p2wdb library.
      // const P2WDBLib = this.state.appData.P2WDB
      const p2wdbRead = new P2WDB.Read({
        serverURL: 'https://xec-p2wdb.fullstack.cash'
      })
      const p2wdbWrite = new P2WDB.Write({
        bchWallet,
        serverURL: 'https://xec-p2wdb.fullstack.cash'
      })

      // Instantiate dex library
      // const BchDexLib = this.state.appData.BchDexLib
      const bchDexLib = new BchDexLib({ bchWallet, p2wdbRead, p2wdbWrite })

      // Close the modal once initialization is done.
      this.setState({
        showStartModal: false,
        asyncInitFinished: true,
        asyncInitSucceeded: true,
        dex: bchDexLib,
        p2wdb: { p2wdbRead, p2wdbWrite },
        denyClose: false
      })
    } catch (err) {
      this.modalBody = [
        `Error: ${err.message}`,
        'Try selecting a different back end server using the drop-down menu at the bottom of the app.'
      ]

      this.setState({
        modalBody: this.modalBody,
        hideSpinner: true,
        showStartModal: true,
        asyncInitFinished: true,
        asyncInitSucceeded: false,
        denyClose: false
      })
    }
  }

  render () {
    // console.log('App component rendered. this.state.wallet: ', this.state.wallet)
    // console.log(`App component menuState: ${this.state.menuState}`)
    // console.log(`render() this.state.serverUrl: ${this.state.serverUrl}`)

    // This is a macro object that is passed to all child components. It gathers
    // all the data and handlers used throughout the app.
    const appData = {
      // Wallet and wallet state
      bchWallet: this.state.bchWallet,
      bchWalletState: this.state.bchWalletState,

      // Functions
      updateBchWalletState: this.updateBchWalletState,
      setLSState: this.setLSState,
      delLSState: this.delLSState,

      servers: this.state.servers, // Alternative back end servers

      Sweep: this.state.Sweep, // Sweep library
      dex: this.state.dex,
      p2wdb: this.state.p2wdb,
      wallet: this.state.bchWallet,

      // Offer caches
      nftOfferCache: this.state.nftOfferCache,
      setNftOfferCache: this.setNftOfferCache,
      getNftOfferCache: this.getNftOfferCache,
      fungibleOfferCache: this.state.fungibleOfferCache,
      setFungibleOfferCache: this.setFungibleOfferCache,
      getFungibleOfferCache: this.getFungibleOfferCache
    }

    return (
      <>
        <GetRestUrl />
        <LoadScripts />
        <LoadLocalStorage passMnemonic={this.passMnemonic} />
        <NavMenu menuHandler={this.onMenuClick} />

        {
          this.state.showStartModal
            ? <UninitializedView
                modalBody={this.state.modalBody}
                hideSpinner={this.state.hideSpinner}
                appData={appData}
                denyClose={this.state.denyClose}
                closeFunc={this.onModalClose}
              />
            : <InitializedView
                wallet={this.state.wallet}
                menuState={this.state.menuState}
                appData={appData}
              />
        }

        <SelectServerButton menuHandler={this.onMenuClick} />
        <Footer appData={appData} />
      </>
    )
  }

  onModalClose () {
    console.log('closing modal')
    this.setState({ showModal: false })
  }

  // Add a new line to the waiting modal.
  addToModal (inStr) {
    const modalBody = this.state.modalBody

    modalBody.push(inStr)

    this.setState({
      modalBody
    })
  }

  // This handler is passed into the child menu component. When an item in the
  // nav menu is clicked, this handler will update the state. The state is
  // used by the AppBody component to determine which View component to display.
  onMenuClick (menuState) {
    // console.log('menuState: ', menuState)

    _this.setState({
      menuState
    })
  }

  // This function is used to retrieve the mnemonic from LocalStorage, which
  // is handled by a child component (load-localstorage.js)
  passMnemonic (lsState, setLSState, delLSState) {
    // console.log(`mnemonic loaded from local storage: ${mnemonic}`)

    // Get the mnemonic from local storage.
    this.mnemonic = lsState.mnemonic

    // Save handles to the LocalStorage State, as well as the functions to save
    // and delete items from the LocalStorage.
    this.lsState = lsState
    this.setLSState = setLSState
    this.delLSState = delLSState
  }

  // This function is passed to child components in order to update the wallet
  // state. This function is important to make this wallet a PWA.
  updateBchWalletState (walletObj) {
    // console.log('updateBchWalletState() walletObj: ', walletObj)

    const oldState = _this.state.bchWalletState

    const bchWalletState = Object.assign({}, oldState, walletObj)
    // console.log(`New wallet state: ${JSON.stringify(bchWalletState, null, 2)}`)

    _this.setState({
      bchWalletState
    })
  }

  // This function is passed to and called from a child component. It updates
  // the state managed by this parent component.
  setNftOfferCache (newCache) {
    this.setState({ nftOfferCache: newCache })

    // console.log('Setting nftOfferCache: ', this.state.nftOfferCache)
  }

  // This function is passed to and called from a child component. It updates
  // the state managed by this parent component.
  setFungibleOfferCache (newCache) {
    this.setState({ fungibleOfferCache: newCache })

    // console.log('Setting fungibleOfferCache: ', this.state.fungibleOfferCache)
  }

  getFungibleOfferCache () {
    return this.state.fungibleOfferCache
  }

  getNftOfferCache () {
    return this.state.nftOfferCache
  }
}

// This is rendered *before* the BCH wallet is initialized.
function UninitializedView (props) {
  // console.log('UninitializedView props: ', props)

  const heading = 'Loading Blockchain Data...'

  return (
    <>
      {
        _this.state.showModal
          ? (
            <WaitingModal
              heading={heading}
              body={props.modalBody}
              hideSpinner={props.hideSpinner}
              denyClose={props.denyClose}
              closeFunc={props.closeFunc}
            />
            )
          : null

      }

      {
        _this.state.asyncInitFinished
          ? <AppBody menuState={100} wallet={props.wallet} appData={props.appData} />
          : null
      }
    </>
  )
}

// This is rendered *after* the BCH wallet is initialized.
function InitializedView (props) {
  // console.log(`InitializedView props.menuState: ${props.menuState}`)
  // console.log(`InitializedView _this.state.menuState: ${_this.state.menuState}`)

  return (
    <>
      <br />
      <AppBody
        menuState={_this.state.menuState}
        appData={props.appData}
      />
    </>
  )
}

// Get the restURL query parameter.
function GetRestUrl (props) {
  const [restURL] = useQueryParam('restURL', StringParam)
  // console.log('restURL: ', restURL)

  if (restURL) {
    serverUrl = restURL
    // queryParamExists = true
  }

  return (<></>)
}

export default App
