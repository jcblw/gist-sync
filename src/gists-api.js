
import got from 'got'
const BASE_API = 'https://api.github.com'
const gistDefaults = {
  public: false,
  description: 'Added via gist sync'
}

function request (
  endpoint,
  { method, body, token, userAgent = 'Gist Sync' }
) {
  return got[method](`${BASE_API}${endpoint}`, {
    json: true,
    body: body
      ? JSON.stringify(
        Object.assign({}, gistDefaults, body)
      )
      : undefined,
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': userAgent
    }
  })
}

class GistsApi {
  constructor (token, ua) {
    this.token = token
    this.userAgent = ua
  }

  request (endpoint, method, body) {
    const {token, userAgent} = this
    return request(
      endpoint,
      {body, token, userAgent, method}
    )
  }

  getAllGists ({login}) {
    return this.request(
      `/users/${login}/gists`,
      'get'
    )
  }

  updateGist (content) {
    return this.request(
      `/gists/${content.id}`,
      'patch',
      content
    )
  }

  createGist (content) {
    return this.request(
      '/gists',
      'post',
      content
    )
  }

  getUser () {
    return this.request(
      '/user',
      'get'
    )
  }
}

module.exports = GistsApi
