/*
  This View displays the SLP tokens in the wallet.
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faRedo } from '@fortawesome/free-solid-svg-icons'

// Local libraries
import TokenCard from './token-card'
import RefreshTokenBalance from './refresh-tokens'

class SlpTokens extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appData: props.appData
    }
  }

  render () {
    const tokenCards = this.generateCards()

    return (
      <>
        <Container>
          <Row>
            <Col xs={6}>
              <RefreshTokenBalance appData={this.state.appData} />
            </Col>
            <Col xs={6} />
          </Row>
          <br />

          <Row>
            {tokenCards}
          </Row>

        </Container>
      </>
    )
  }

  // This function generates a Token Card for each token in the wallet.
  generateCards () {
    const tokens = this.state.appData.bchWalletState.slpTokens

    const tokenCards = []

    for (let i = 0; i < tokens.length; i++) {
      const thisToken = tokens[i]
      // console.log(`thisToken: ${JSON.stringify(thisToken, null, 2)}`)

      const thisTokenCard = <TokenCard appData={this.state.appData} token={thisToken} key={`${thisToken.tokenId}`} />
      tokenCards.push(thisTokenCard)
    }

    return tokenCards
  }
}

export default SlpTokens
