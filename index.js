var spotify = require('./spotifyController')

module.exports = function(client_id, client_secret, redirect_uri) {
    return new spotify(client_id, redirect_uri, client_secret)
}