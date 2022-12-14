/*
  This component renders as a button. When clicked, it opens up a modal
  for sending a quantity of tokens.
  This component requires state, because it's a complex form that is being manipulated
  by the user.
*/

// Global npm libraries
import React from 'react'
import { Button, Modal, Container, Row, Col, Form, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faPaste } from '@fortawesome/free-solid-svg-icons'
import { Clipboard } from '@capacitor/clipboard'

// let _this

class SentTokenButton extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      token: props.token,
      appData: props.appData,
      showAddrWarning: false,

      // Function from parent View component. Called after sending tokens,
      // to trigger a refresh of the wallet token balances.
      refreshTokens: props.refreshTokens,

      // Modal control
      showModal: false,
      statusMsg: '',
      hideSpinner: true,
      shouldRefreshOnModalClose: false,

      // Modal inputs
      sendToAddress: '',
      sendQtyStr: '',
      sendQtyNum: 0,
      dialogFinished: true
    }

    // Bind 'this' object to subfunctions.
    this.handleUpdateSendToAddr = this.handleUpdateSendToAddr.bind(this)
  }

  render () {
    // Generate the JSX for the modal.
    const modal = this.getModal()

    return (
      <>
        <Button variant='info' onClick={(e) => this.handleShowModal()}>Send</Button>
        {
          this.state.showModal
            ? modal
            : null
        }
      </>
    )
  }

  // Toggle the Info modal.
  handleShowModal () {
    this.setState({
      showModal: true
    })
  }

  // This handler function is called when the modal is closed.
  async handleCloseModal (instance) {
    // console.log(`Refreshing tokens: ${instance.state.shouldRefreshOnModalClose}`)

    // Prevent closing of the modal during a token send.
    if (!this.state.dialogFinished) return

    if (instance.state.shouldRefreshOnModalClose) {
      // Refresh the token balance on modal close.

      instance.setState({
        showModal: false,
        shouldRefreshOnModalClose: false,
        statusMsg: ''
      })

      // Wait a few seconds to let psf-slp-indexer index the token transfer.
      // await this.state.appData.bchWallet.bchjs.Util.sleep(2000)

      await instance.state.refreshTokens()
    } else {
      // Default behavior

      instance.setState({
        showModal: false,
        statusMsg: '',
        sendToAddress: '',
        sendQtyStr: ''
      })
    }
  }

  // Generate the info modal that is displayed when the button is clicked.
  getModal () {
    const token = this.state.token
    // console.log(`token: ${JSON.stringify(token, null, 2)}`)

    return (
      <Modal show={this.state.showModal} size='lg' onHide={(e) => this.handleCloseModal(this)}>
        <Modal.Header closeButton>
          <Modal.Title><FontAwesomeIcon icon={faPaperPlane} size='lg' /> Send Tokens: <span style={{ color: 'red' }}>{token.ticker}</span></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col style={{ textAlign: 'center' }}>
                <b>SLP Address:</b>
              </Col>
            </Row>

            <Row>
              <Col xs={10}>
                <Form>
                  <Form.Group controlId='formBasicEmail' style={{ textAlign: 'center' }}>
                    <Form.Control
                      type='text'
                      placeholder='etoken:qz8zzt9pp95pzsgqtstq0dsvmnssdydjy5mvzyjjln'
                      onChange={this.handleUpdateSendToAddr}
                      value={this.state.sendToAddress}
                    />
                  </Form.Group>
                </Form>
              </Col>

              <Col xs={2}>
                <FontAwesomeIcon
                  icon={faPaste}
                  size='lg'
                  onClick={(e) => this.pasteFromClipboard(e)}
                />
              </Col>
            </Row>
            <br />

            <Row>
              <Col style={{ textAlign: 'center' }}>
                <b>Amount:</b>
              </Col>
            </Row>

            <Row>
              <Col xs={10}>
                <Form style={{ paddingBottom: '10px' }}>
                  <Form.Group controlId='formBasicEmail' style={{ textAlign: 'center' }}>
                    <Form.Control
                      type='text'
                      onChange={e => this.setState({ sendQtyStr: e.target.value })}
                      value={this.state.sendQtyStr}
                    />
                  </Form.Group>
                </Form>
              </Col>

              <Col xs={2}>
                <Button onClick={(e) => this.handleGetMax()}>Max</Button>
              </Col>
            </Row>
            <br />

            <Row>
              <Col style={{ textAlign: 'center' }}>
                <Button onClick={(e) => this.handleSendTokens(this)}>Send</Button>
              </Col>
            </Row>
            <br />

            {
              this.state.showAddrWarning
                ? (
                  <>
                    <Row>
                      <Col style={{ textAlign: 'center' }}>
                        <p style={{ color: 'orange' }}>
                          <b>Warning</b>: Careful! Not all eCash wallets are token-aware.
                          If you send this token to a wallet that is not
                          token-aware, it could be burned. It's best practice to
                          only send tokens to 'etoken:' addresses and not
                          'ecash:' addresses.
                        </p>
                      </Col>
                    </Row>
                    <br />
                  </>
                  )
                : null
            }

            <Row>
              <Col xs={10}>
                {this.state.statusMsg}
              </Col>

              <Col xs={2}>
                {this.state.hideSpinner ? null : <Spinner animation='border' />}
              </Col>
            </Row>

          </Container>
        </Modal.Body>
        <Modal.Footer />
      </Modal>
    )
  }

  handleUpdateSendToAddr (event) {
    // onChange={e => this.setState({ sendToAddress: e.target.value })}
    const value = event.target.value

    this.setState({ sendToAddress: value })

    if (value.includes('ecash')) {
      this.setState({ showAddrWarning: true })
    } else {
      this.setState({ showAddrWarning: false })
    }
  }

  // This handler is called when the user clicks on the paste-icon favicon,
  // in order to paste an address from the clipboard. This is only functional
  // on Android devices. In the web browser, reading the clipboard requires
  // special permissions, so nothing happens in that context.
  async pasteFromClipboard (event) {
    try {
      // Capacitor Android app takes this code path.

      // Get the value from the clipboard.
      const { value } = await Clipboard.read()
      // console.log('value: ', value)

      // Set the value of the form.
      this.setState({ sendToAddress: value })
    } catch (err) {
      // Browser implementation. Exit quietly.
    }
  }

  // Click handler that fires when the user clicks the Max button.
  handleGetMax () {
    // console.log('get max button clicked.')

    // const token = instance.state.token
    // console.log('token: ', token)

    this.setState({
      sendQtyStr: this.state.token.qty
    })
  }

  // Click handler that fires when the user clicks the 'Send' button.
  async handleSendTokens (instance) {
    // console.log('Send button clicked.')

    try {
      instance.setState({
        statusMsg: 'Preparing to send tokens...',
        hideSpinner: false,
        dialogFinished: false,
        showAddrWarning: false
      })

      // Validate the quantity
      let qty = instance.state.sendQtyStr
      qty = parseFloat(qty)
      if (isNaN(qty)) throw new Error('Invalid send quantity')

      const wallet = instance.state.appData.bchWallet
      const bchjs = wallet.bchjs

      // Validate the address
      let addr = instance.state.sendToAddress
      if (addr.includes('simpleledger')) {
        // Convert the address to a cash address.
        addr = bchjs.SLP.Address.toCashAddress(addr)

        addr = bchjs.Address.toEcashAddress(addr)
      } else if (addr.includes('bitcoincash') || addr.includes('etoken')) {
        addr = bchjs.Address.toEcashAddress(addr)
      }
      if (!addr.includes('ecash')) throw new Error('Invalid address')

      // Update the wallets UTXOs
      let infoStr = 'Updating UTXOs...'
      console.log(infoStr)
      instance.setState({ statusMsg: infoStr })
      await wallet.getUtxos()

      const receiver = [{
        address: addr,
        tokenId: instance.state.token.tokenId,
        qty
      }]
      console.log(`receiver: ${JSON.stringify(receiver, null, 2)}`)

      // Send the tokens
      infoStr = 'Generating and broadcasting transaction...'
      console.log(infoStr)
      instance.setState({ statusMsg: infoStr })

      const txid = await wallet.sendTokens(receiver, 3)
      console.log(`Token sent. TXID: ${txid}`)

      instance.setState({
        statusMsg: (<p>Success! <a href={`https://explorer.be.cash/tx/${txid}`} target='_blank' rel='noreferrer'>See on Block Explorer</a></p>),
        hideSpinner: true,
        sendQtyStr: '',
        sendToAddress: '',
        shouldRefreshOnModalClose: true,
        dialogFinished: true
      })
    } catch (err) {
      console.error('Error in handleSendTokens(): ', err)

      instance.setState({
        statusMsg: `Error sending tokens: ${err.message}`,
        hideSpinner: true,
        dialogFinished: true
      })
    }
  }
}

export default SentTokenButton
