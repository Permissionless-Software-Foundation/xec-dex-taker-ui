/*
  This library adds a very simple filtering for verified tokens.
*/

class VerifiedTokens {
  constructor () {
    this.tetherId = '9fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c11'
    this.psfId = '73fcc96ad73948a102a8cabac8fe1808f94f1a8ec5536b0f4d7c524ac63fc44a'
  }

  // Check the Ticker against verified Token IDs. This will return true if the
  // token *is* a scam token. It will return false if the token ID matches the
  // token ID in the verified list.
  checkTicker (ticker, tokenId) {
    // Tether
    if (ticker.includes('USDt') || ticker.includes('USDT') || ticker.includes('usdt')) {
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
