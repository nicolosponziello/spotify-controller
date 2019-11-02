 class User {
    
    constructor(id, name, access_token, refresh_token, devices) {
        this.id = id
        this.name = name
        this.access_token = access_token
        this.refresh_token = refresh_token
        this.devices = devices
    }

    getId() {
        return this.id
    }

    getName() {
        return this.name
    }

    getAccessToken() {
        return this.access_token
    }

    setAccessToken(access_token) {
        this.access_token = access_token
    }

    getRefreshToken() {
        return this.refresh_token
    }

    setRefreshToken(refresh_token) {
        this.refresh_token = refresh_token
    }

    getDevices() {
        return this.devices
    }

    setDevices(devices) {
        this.devices = devices
    }

}


module.exports = User