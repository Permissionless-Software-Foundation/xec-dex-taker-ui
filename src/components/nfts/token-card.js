/*
  This Card component summarizes an SLP token.
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import BuyNftButton from './buy-button'
import InfoButton from './info-button'

// Local libraries
// import InfoButton from './info-button'
// import SendTokenButton from './send-token-button'
// import SellButton from './sell-button'

function TokenCard (props) {
  let imageLink = ''
  if (props.token.mutableData) {
    imageLink = props.token.mutableData.tokenIcon

    if (props.token.mutableData.fullSizedUrl && props.token.mutableData.fullSizedUrl.includes('http')) {
      imageLink = props.token.mutableData.fullSizedUrl
    }
  }

  return (
    <>
      <Col xs={12} sm={6} lg={4} style={{ padding: '25px' }}>
        <Card>
          <Card.Body style={{ textAlign: 'center' }}>
            <a href={imageLink} target='_blank' rel='noreferrer'>
              {props.token.icon}
            </a>
            <Card.Title style={{ textAlign: 'center' }}>
              <h4>{props.token.ticker}</h4>
            </Card.Title>

            <Container>
              <Row>
                <Col>
                  {props.token.tokenData ? props.token.tokenData.genesisData.name : null}
                </Col>
              </Row>
              <br />

              <Row>
                <Col>Price:</Col>
                <Col>{props.token.usdPrice}</Col>
              </Row>
              <br />

              <Row>
                <Col>
                  <InfoButton token={props.token} />
                </Col>

                <Col>
                  <Button onClick={(e) => flagOffer(props)} variant='danger'>Flag</Button>
                </Col>

                <Col>
                  <BuyNftButton appData={props.appData} offer={props.token} />
                </Col>
              </Row>

            </Container>
          </Card.Body>
        </Card>
      </Col>
    </>
  )
}

async function flagOffer (props) {
  console.log('Flag button pressed.')

  const token = props.token
  console.log('token: ', token)
  const cid = token.p2wdbHash

  // console.log('appData: ', appData)

  // Generate a Counter Offer.
  const bchDexLib = props.appData.dex
  const p2wdbOut = await bchDexLib.flag.flagOffer(cid)
  console.log('p2wdbOut: ', p2wdbOut)

  const hash = p2wdbOut.hash
  console.log(`Token flagged with P2WDB record ${hash}`)
}

export default TokenCard
