/*
  Load <script> libraries
*/

import useScript from '../hooks/use-script'

function LoadScripts () {
  // useScript('https://unpkg.com/minimal-slp-wallet')
  // useScript('https://unpkg.com/bch-dex-lib')

  // Load the libraries from the local directory.
  useScript(`${process.env.PUBLIC_URL}/minimal-slp-wallet.min.js`)
  useScript(`${process.env.PUBLIC_URL}/bch-token-sweep.min.js`)
  useScript(`${process.env.PUBLIC_URL}/bch-dex-lib.min.js`)
  useScript(`${process.env.PUBLIC_URL}/p2wdb.min.js`)

  return true
}

export default LoadScripts
