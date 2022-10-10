/*
  This component displays a large data table for tablets and desktops
*/

// Global npm libraries
import React from 'react'
import { Container, Row, Col, Table } from 'react-bootstrap'
import { DatatableWrapper, TableBody, TableHeader } from 'react-bs-datatable'

const TABLE_HEADERS = [
  {
    prop: 'ticker',
    title: 'Ticker',
    isFilterable: true
  },
  {
    prop: 'tokenIdLink',
    title: 'Token ID'
  },
  {
    prop: 'buyOrSell',
    title: 'Type'
  },
  {
    prop: 'p2wdbHashLink',
    title: 'P2WDB ID'
  },
  {
    prop: 'numTokens',
    title: 'Quantity'
  },
  {
    prop: 'usdPrice',
    title: 'Price (USD)'
  },
  {
    prop: 'button',
    title: 'Action'
  }
]

function LargeOfferTable (props) {
  return (
    <Container className='d-none d-md-block'>
      <Row>
        <Col className='text-break' style={{ textAlign: 'center' }}>
          <DatatableWrapper body={props.offers} headers={TABLE_HEADERS}>
            <Table>
              <TableHeader />
              <TableBody />
            </Table>
          </DatatableWrapper>
        </Col>
      </Row>
    </Container>
  )
}

export default LargeOfferTable
