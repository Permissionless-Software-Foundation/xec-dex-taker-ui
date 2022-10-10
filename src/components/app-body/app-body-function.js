/*
  This Body component is a container for all the different Views of the app.
  Views are equivalent to 'pages' in a multi-page app. Views are hidden or
  displayed to simulate the use of pages in an SPA.
  The Body app contains all the Views and chooses which to show, based on
  the state of the Menu component.
*/

// Global npm libraries
import React from 'react'

// Local libraries
import BchWallet from '../bch-wallet'
import BchSend from '../bch-send'
import SlpTokens from '../slp-tokens'
import ServerSelectView from '../servers/select-server-view'
import Sweep from '../sweep'
import Offers from '../offers'
import NFTs from '../nfts'

// let _this

function AppBody (props) {
  // const menuState = props.menuState
  // const appData = props.appData
  // const activeView = 0

  // this.state = {
  //   activeView: 0,
  //   menuState: props.menuState,
  //   appData: props.appData
  // }

  // This function is passed from the parent component. It's used to update
  // the BCH wallet state.
  // this.updateBchWalletState = props.appData.updateBchWalletState

  // _this = this

  // console.log(`AppBody menu state: ${this.props.menuState}`)

  return (
    <>
      {chooseView(props.menuState, props.appData)}
    </>
  )
}

function chooseView (menuState, appData) {
  // console.log(`chooseView() menuState: ${menuState}`)

  switch (menuState) {
    case 0:
      return (<NFTs appData={appData} />)
    case 1:
      return (<Offers appData={appData} />)
    case 2:
      return (<BchSend appData={appData} />)
    case 3:
      return (<SlpTokens appData={appData} />)
    case 4:
      return (<Sweep appData={appData} />)
    case 5:
      return (
        <BchWallet appData={appData} />
      )

    // Special Views
    case 100:
      return (<ServerSelectView appData={appData} />)
    default:
      return (<NFTs appData={appData} />)
  }
}

export default AppBody
