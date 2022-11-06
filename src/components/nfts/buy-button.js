/*
  Buy button for purchasing NFTs.
*/

// Global npm libraries
import React from 'react'
import { Button } from 'react-bootstrap'
// import axios from 'axios'

// Local libraries
// import config from '../../config'
import WaitingModal from '../waiting-modal'

// Global variables and constants
// const SERVER = `${config.server}/`

class BuyNftButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appData: props.appData,
      offer: props.offer,

      // Modal
      showModal: false,
      modalBody: [],
      hideSpinner: false,
      denyClose: false
    }

    // Bind this object to event handlers
    this.handleBuy = this.handleBuy.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
  }

  render () {
    return (
      <>
        <Button variant='success' onClick={(e) => this.handleBuy(e)}>Buy</Button>
        {
          this.state.showModal
            ? <WaitingModal
                heading='Buying Token'
                body={this.state.modalBody}
                hideSpinner={this.state.hideSpinner}
                denyClose={this.state.denyClose}
                closeFunc={this.onModalClose}
              />
            : null
        }
      </>
    )
  }

  async handleBuy () {
    try {
      console.log('Buy button clicked.')

      const targetOffer = this.state.offer.p2wdbHash
      console.log('targetOffer: ', targetOffer)

      // Initialize modal
      this.setState({
        showModal: true,
        modalBody: ['Generating Counter Offer...', '(This can take a couple minutes)'],
        hideSpinner: false,
        denyClose: true
      })

      // const options = {
      //   method: 'post',
      //   url: `${SERVER}offer/take`,
      //   data: {
      //     offerCid: targetOffer
      //   }
      // }
      //
      // const result = await axios.request(options)
      // // console.log('result.data: ', result.data)
      // const p2wdbHash = result.data.hash

      // Generate a Counter Offer.
      const bchDexLib = this.state.appData.dex
      const p2wdbOut = await bchDexLib.take.takeOffer(targetOffer)
      console.log('p2wdbOut: ', p2wdbOut)

      const p2wdbHash = p2wdbOut.hash

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
        modalBody: ['Error!', `${err.message}`],
        hideSpinner: true,
        denyClose: false
      })
    }
  }

  onModalClose () {
    this.setState({ showModal: false })
  }
}

export default BuyNftButton
