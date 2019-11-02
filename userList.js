

var user = require('./user')

class UserList {

    constructor() {
        this.userList = new Array()
    }


    async updateUser(users, id, access_token, refresh_token, devices){
        await users.forEach(user => {
            if(user.getId() == id){
                user.setAccessToken(access_token)
                user.setRefreshToken(refresh_token)
            }
        });
    }

    async createUser(users, id, name, access_token, refresh_token){
        users.push(new User(id, name, access_token, refresh_token))
    }

    async getUser(users, name) {
        return await users.filter(user => user.getName() == name)
    }

    async getUserInfoJsonFormat(users, name) {
        var user = this.getUser(users, name)
        return {
            "user_id" : user.getId(),
            "user_name" : user.getName(),
            "devices" : user.getDevices()
        }
    }

    
    
}







module.exports = UserList