var user = require('./user')

async function isUserPresent(users, id) {
    var isPresent = false
    await users.forEach(user => {
        user.getId() == id ? isPresent = true : isPresent = isPresent
    });
    return isPresent
}


async function updateUser(users, id, access_token, refresh_token, devices){
    await users.forEach(user => {
        if(user.getId() == id){
            user.setAccessToken(access_token)
            user.setRefreshToken(refresh_token)
        }
    });
}

async function createUser(users, id, name, access_token, refresh_token){
    users.push(new User(id, name, access_token, refresh_token))
}

async function getUser(users, name) {
    return await users.filter(user => user.getName() == name)
}

async function getUserJson(users, name) {
    var user = this.getUser(users, name)
    return {
        "user_id" : user.getId(),
        "user_name" : user.getName(),
        "devices" : user.getDevices()
    }
}




module.exports = {
    isUserPresent,
    updateUser,
    createUser,
    getUserJson,
    getUser
}