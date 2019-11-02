

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
        console.log('LOGIN - REQUEST LOGIN');
        var query_params = {
            "client_id": this.client_id,
            "response_type": "code",
            "redirect_uri": this.redirect_uri,
            "scope": "user-modify-playback-state playlist-read-collaborative playlist-modify-private user-modify-playback-state user-read-private user-library-modify user-follow-modify user-read-recently-played user-read-currently-playing playlist-modify-public user-read-playback-state app-remote-control user-library-read user-follow-read user-read-email playlist-read-private user-top-read",
            "show_dialog": true
        }
        return utils.encodeQueryParams(spotify_uri.SPOTIFY_AUTHORIZE, query_params)
    }

    async callback(req, res){
        var request_data = req.query 
        if ('error' in request_data){
            console.log('CALLBACK - FOUND ERROR: ', request_data["error"]);
            res.status(500).end();
        } else {
            console.log('CALLBACK');
            var user_authentication_data = await this.authentication(request_data.code)
            console.log("CALLBACK - AUTHENTICATION RESPONSE" )
            console.log(user_authentication_data)
            if(user_authentication_data.status_code !== 200) res.sendStatus(user_info.status_code)
            
            var user_info = await this.getUserInfo(user_authentication_data.data.access_token)
            console.log("CALLBACK - GET USER INFO RESPONSE" )
            console.log(user_info)
            if(user_info.status_code!== 200) res.sendStatus(user_info.status_code)
            

            var user_devices = await this.getUserDevices(user_authentication_data.data.access_token)
            console.log("CALLBACK - GET USER DEVICE RESPONSE")
            console.log(user_devices)
            if (user_devices.status_code != 200) res.sendStatus(user_devices.status_code)

            var user_found = await this.users.isUserPresent(user_info.id)

            if (!user_found) {
                await this.users.createUser(user_info.data.id, user_info.data.display_name, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token, user_devices.data.devices)
            } else {
                await this.users.updateUser(user_info.data.id, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token, user_devices.data.devices)   
            }
            return await this.users.getUser(user_info.data.id)
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
            var status_code = authentication_response.status
            if(authentication_response.status == 200) return {"status_code" : status_code, "data" :authentication_response.data};
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
            if (spotify_response.status == 200) return {"status_code" : spotify_response.status, "data" : spotify_response.data}
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
            if (spotify_response.status == 200) return {"status_code" : spotify_response.status, "data" : spotify_response.data}
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


    async refresh_token(id){
        var user_refresh_token = this.users.getUserRefreshToken(id)

        var post_body = {
            "grant_type": "refresh_token",
            "refresh_token": user_refresh_token,
            "client_id": this.client_id,
            "client_secret": this.client_secret
        }   
        try {
            var spotify_response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify(request_body));
            if(spotify_response.status === 200){
                this.users.setUserAccessToken(id, spotify_response.data.access_token)
                return {"status_code" : spotify_response.status}
            }
        } catch (error) {
            
        }
        
    }

    async playSong(id, spotify_uri, device_id, volume_percent){
        var user_id = id;
        var spotify_uri = spotify_uri;
        var device_id = device_id;
        var volume_percent = volume_percent;

        if ( (user_id === null) || (spotify_uri === null) || (spotify_uri === '') ) {
            console.log('PLAY - MISSING PARAMETERS!');
            res.status(400).end()
        } else {
            var refresh = await this.refresh_token(id)   
            if(refresh.status_code !== 200) res.sendStatus(refresh.status_code)

        }

    }

            // REFRESH
    //         var request_body = {
    //             "grant_type": "refresh_token",
    //             "refresh_token": usersDict[user_id]["refresh_token"],
    //             "client_id": CLIENT_ID,
    //             "client_secret": CLIENT_SECRET
    //         }
    //         console.log('PLAY - UPDATING TOKEN BELONGING TO' + user_id)
    //         var authentication_response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify(request_body));

    //         var authentication_params = authentication_response.data;

    //         usersDict[user_id]["access_token"] = authentication_params["access_token"]

    //         var access_token = usersDict[user_id]["access_token"];

    //         // WRITING USERS IN JSON FILE
    //         writeJsonFile('usersDict.json', usersDict)
            
    //         var header = { "Authorization": "Bearer " + String(access_token) };

    //         var device_ids = Array()
    //         device_ids.push(device_id)

    //         // set used device
    //         var active_player_body = {
    //             "device_ids": device_ids
    //         }
    //         active_player_body = JSON.stringify(active_player_body)
            
    //         if(usersDict[user_id]["devices"])
    //         console.log('PLAY - ACTIVATING DEVICE WITH ID: ' + device_id)
    //         await axios.put('https://api.spotify.com/v1/me/player', active_player_body, {"headers": header})
    

    //         var isPlayerActive = false
    //         while(!isPlayerActive){
    //             var players_active = await axios.get('https://api.spotify.com/v1/me/player/devices', {"headers": header})
    //             for(var i = 0 ; i < players_active.data.devices.length ; i++){
    //                 if(players_active.data.devices[i].id == device_id && players_active.data.devices[i].is_active) {
    //                     isPlayerActive = true
    //                     console.log("PLAY - SELECTED DEVICE INFO ")
    //                     console.log(players_active.data.devices[i])
    //                 }
    //             }

    //         }
            

    //         // sending volume request
    //         var queryParams = {
    //             "volume_percent": volume_percent,
    //             "device_id":device_id
    //         }
        
    //         var queryString = encodeQueryData(queryParams);

    //         console.log("PLAY - SETTING VOLUME : " + volume_percent)
    //         await axios.put('https://api.spotify.com/v1/me/player/volume'+'?'+queryString, {}, {"headers": header})

    //         // sending play request

    //         playerActive = true;

    //         console.log('PLAY - SENDING PLAY REQUEST FOR ', spotify_uri)
    //         var playBody = { "uris":[spotify_uri] }
    //         await axios.put('https://api.spotify.com/v1/me/player/play', playBody, {"headers": header})
 

    //         if(playerActive) {
    //             // getting song info
    //             var songId = spotify_uri.split(':')[2];
    //             var songInfos = await axios.get('https://api.spotify.com/v1/tracks/'+songId, {"headers": header})

    //             console.log('PLAY - Retrieved song info: it is', songInfos.data.name, 'by', songInfos.data.artists[0].name, '!')

    //             await res.status(200).send(songInfos.data)
    //         };
    //     }
    // } catch (error) {
    //     //console.log('ERROR, ', error.response);
    //     if(error.response.status === 404 || error.response.status === 403) {
    //         res.status(error.response.status).end();
    //     } else {
    //         res.status(500).end();
    //     };
    // }
    


}


module.exports = SpotifyController