/*
  This library downloads a dynamic list of back-end servers from a GitHub Gist.
*/

const axios = require('axios')

class GistServers {
  constructor () {
    this.axios = axios
  }

  // Retrieve a JSON file from a GitHub Gist
  async getServerList () {
    try {
      // https://gist.github.com/christroutner/e818ecdaed6c35075bfc0751bf222258
      const gistUrl =
        'https://api.github.com/gists/621bb9d64e2642b9f0d30e67c33a9d6c'

      // Retrieve the gist from github.com.
      const result = await this.axios.get(gistUrl)
      // console.log('result.data: ', result.data)

      // Get the current content of the gist.
      const content = result.data.files['ecash-consumer-apis.json'].content
      // console.log('content: ', content)

      // Parse the JSON string into an Object.
      const object = JSON.parse(content)
      // console.log('object: ', object)

      return object.consumerApis
    } catch (err) {
      console.error('Error in getCRList()')
      throw err
    }
  }
}

export default GistServers
