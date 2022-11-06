/*
  This card displays the users balance in  BCH.
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Col, Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCoins } from '@fortawesome/free-solid-svg-icons'

class BalanceCard extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appData: props.appData
    }

    // _this = this
  }

  render () {
    // console.log('this.state.appData: ', this.state.appData)

    const bchjs = this.state.appData.bchWallet.bchjs
    const sats = this.state.appData.bchWalletState.bchBalance
    const eCashBalance = sats / 100
    const bchBalance = bchjs.BitcoinCash.toBitcoinCash(sats)
    const usdBalance = bchjs.Util.floor2(eCashBalance * this.state.appData.bchWalletState.bchUsdPrice)
    console.log('this.state.appData.bchWalletState.bchUsdPrice: ', this.state.appData.bchWalletState.bchUsdPrice)
    console.log('usdBalance: ', usdBalance)

    return (
      <>
        <Card>
          <Card.Body>
            <Card.Title style={{ textAlign: 'center' }}>
              <h2><FontAwesomeIcon icon={faCoins} size='lg' /> Balance</h2>
            </Card.Title>
            <br />

            <Container>
              <Row>
                <Col>
                  <b>USD</b>: ${usdBalance}
                </Col>
              </Row>

              <Row>
                <Col>
                  <b>eCash</b>: {eCashBalance}
                </Col>
              </Row>

              <Row>
                <Col>
                  <b>Satoshis</b>: {sats}
                </Col>
              </Row>

              <Row>
                <Col>
                  <b>Bitcoin</b>: {bchBalance}
                </Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
      </>
    )
  }
}

export default BalanceCard
