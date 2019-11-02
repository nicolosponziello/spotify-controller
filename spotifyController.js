

var utils =  require('./utils')
var userList = require('./userList')
var spotify_uri = require('./const')
var axios = require('axios').default;
var qs = require('qs');
var fs = require('fs');


class SpotifyController {

    constructor(client_id, redirect_uri, client_secret){ 
        this.client_id = client_id
        this.redirect_uri = redirect_uri
        this.client_secret = client_secret
        this.users = new userList()
    }


    async login(req, res) {
        console.log('LOGIN REQUEST');
        var query_params = {
            "client_id": this.client_id,
            "response_type": "code",
            "redirect_uri": this.redirect_uri,
            "scope": "user-modify-playback-state playlist-read-collaborative playlist-modify-private user-modify-playback-state user-read-private user-library-modify user-follow-modify user-read-recently-played user-read-currently-playing playlist-modify-public user-read-playback-state app-remote-control user-library-read user-follow-read user-read-email playlist-read-private user-top-read",
            "show_dialog": true
        }

        console.log(utils.encodeQueryParams(spotify_uri.SPOTIFY_AUTHORIZE, query_params))
        return utils.encodeQueryParams(spotify_uri.SPOTIFY_AUTHORIZE, query_params)
        r//es.redirect(301, utils.encodeQueryParams(con.SPOTIFY_AUTHORIZE, query_params))
    }

    async callback(req, res){
        var request_data = req.query 
        if ('error' in request_data){
            console.log('CALLBACK - FOUND ERROR: ', request_data["error"]);
            res.status(500).end();
        } else {
            console.log('CALLBACK - RECEIVED DATA');
            console.log(request_data)

            var status_code, user_authentication_data = await this.authentication(request_data.code)
            if(status_code !== 200) res.sendStatus(status_code)
            
            var status_code, user_info = await this.getUserInfo(user_authentication_data.access_token)
            if(status_code !== 200) res.sendStatus(status_code)
            
            var status_code, user_devices = await this.getUserDevices(user_authentication_data.access_token)
            if (status_code != 200) res.sendStatus(status_code)

            var user_found = users.isUserPresen(this.users, user_info.id)

            if (!user_found) {
                this.users.createUser(this.users, user_info.id, user_info.name, user_authentication_data.access_token, user_authentication_data.refesh_token, user_devices.data.devices)
            } else {
                this.users.updateUser(this.users, user.info.id, user_authentication_data.access_token, user_authentication_data.refesh_token, user_devices.data.devices)   
            }

            console.log(users.getUserInfoJsonFormat(this.users, user_info.name))
            return users.getUserInfoJsonFormat(this.users, user_info.name)
            //res.status(200).send(userList.getUserJson(this.users, user_info.name))

            

        }
    }

    async authentication(code) {
        var authentication_response = ''
        var post_body = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": this.redirect_uri,
            "client_id": this.client_id,
            "client_secret": this.client_secret
        };
        try {
            authentication_response = await axios.post(spotify_uri.SPOTIFY_AUTHENTICATION, qs.stringify(post_body),)
            return 200, authentication_response.data
        } catch (error) {
            console.log('AUTHENTICATION - ERROR', error)
            return error.status, 'error'
        }
    } 
    
    
    async getUserInfo(access_token) {
        var header = utils.buildHeader(access_token)
        var spotify_response = ''
        try {
            spotify_response = await axios.get(spotify_uri.SPOTIFY_USER_INFO, header)
            return 200, spotify_response.data
        } catch (error) {
            console.log('GET USER INFO - ERROR', error)
            return error.status, 'error'
        }
    }

    async getUserDevices(access_token) {
        var header = utils.buildHeader(access_token)
        var spotify_response = ''
        try {
            spotify_response = await axios.get(spotify_uri.SPOTIFY_USER_DEVICES, header)
            return 200, spotify_response.data
        } catch (error) {
            console.log('GET USER INFO - ERROR', error)
            return error.status, 'error'
        }
    }

    async generateDeviceList(devices_json){
        var devices = Array()
        for(var i = 0 ; i < devices_json.length; i++ ){
            devices.push({"name": devices_json[i].name, "id": devices_json[i].id, "active": devices_json[i].is_active})
        }
        return devices
    }



}


module.exports = SpotifyController