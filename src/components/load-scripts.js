/*
  Load <script> libraries
*/

import useScript from '../hooks/use-script'

function LoadScripts () {
  // useScript('https://unpkg.com/minimal-ecash-wallet?module')
  // useScript('https://unpkg.com/xec-dex-lib')

  // Load the libraries from the local directory.
  useScript(`${process.env.PUBLIC_URL}/minimal-ecash-wallet.min.js`)
  // useScript(`${process.env.PUBLIC_URL}/xec-token-sweep.min.js`)
  // useScript(`${process.env.PUBLIC_URL}/xec-dex-lib.min.js`)
  // useScript(`${process.env.PUBLIC_URL}/p2wdb.min.js`)

  return true
}

export default LoadScripts
