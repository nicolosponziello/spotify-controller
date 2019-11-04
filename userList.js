

var us = require('./user')

class UserList {

    constructor() {
        this.users = new Array()
    }


    async isUserPresent(id) {
        var user_found = await this.users.filter((x) => x.getId() == id)
        if(user_found.length > 0) return true
        else false
    }

    async updateUser(id, access_token, refresh_token, devices){
        await this.users.forEach(user => {
            if(user.getId() == id){
                user.setAccessToken(access_token)
                user.setRefreshToken(refresh_token)
                user.setDevices(devices)
            }
        });
    }

    async createUser( id, name, access_token, refresh_token, devices){
        await this.users.push(new us(id, name, access_token, refresh_token, devices))        
    }

    async getUser(id) {
        var  user = await this.users.filter(user => user.getId() == id)
        return user
    }

    async getUserAccessToken(id){
        var user = await this.getUser(id)
        return user[0].getAccessToken()
    }

    async getUserRefreshToken(id){
        var user = await this.getUser(id)
        return user[0].getRefreshToken()
    }

    async setUserAccessToken(id, access_token){
        var user = await this.getUser(id)
        this.updateUser(id, access_token, user[0].getRefreshToken(), user[0].getDevices())
    }

    async isDevicePresent(id, device_id){
        var user = this.getUser(id)
        var devices_found = user.getDevices().filter(device => device.id == devices_id)
        return (devices_found.length > 0) ?  true : false

    }


    
    
}







module.exports = UserList