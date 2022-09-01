/*
  This library adds a very simple filtering for verified tokens.
*/

class VerifiedTokens {
  constructor () {
    this.tetherId = '9fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c11'
    this.psfId = '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
  }

  // Check the Ticker against verified Token IDs. This will return true if the
  // token *is* a scam token. It will return false if the token ID matches the
  // token ID in the verified list.
  checkTicker (ticker, tokenId) {
    // Tether
    if (ticker.includes('USDt')) {
      if (tokenId === this.tetherId) {
        return false
      } else {
        return true
      }
    }

    // PSF
    if (ticker.includes('PSF')) {
      if (tokenId === this.psfId) {
        return false
      } else {
        return true
      }
    }
  }
}

export default VerifiedTokens
