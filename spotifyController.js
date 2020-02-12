

var utils =  require('./utils')
var userList = require('./userList')
var spotify_uri = require('./const')
var axios = require('axios').default;
var qs = require('qs');

class SpotifyController {

    constructor(client_id, redirect_uri, client_secret){ 
        this.client_id = client_id
        this.redirect_uri = redirect_uri
        this.client_secret = client_secret
        this.users = new userList()
    }


    async login() {
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
            if(user_authentication_data.status_code !== 200) return user_info.status_code
            
            var user_info = await this.getUserInfo(user_authentication_data.data.access_token)
            console.log("CALLBACK - GET USER INFO RESPONSE" )
            console.log(user_info)
            if(user_info.status_code!== 200) return user_info.status_code
            

            
            
            if (!await this.users.isUserPresent(user_info.id)) {
                await this.users.createUser(user_info.data.id, user_info.data.display_name, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token,[] )
            } else {
                await this.users.updateUser(user_info.data.id, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token, [])   
            }
            var user_devices = await this.getUserDevices(user_info.data.id)
            if (user_devices.status_code != 200) return user_devices.status_code
            console.log("CALLBACK - GET USER DEVICE RESPONSE")
            console.log(user_devices)
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
            
            if(authentication_response.status == 200) {
                console.log("AUTHENTICATION - COMPLETED SUCCESSFULLY")
                return {"status_code" : authentication_response.status, "data" :authentication_response.data};
            }
        } catch (error) {
            console.log('AUTHENTICATION - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
    } 
    
    
    async getUserInfo(access_token) {
        var header = utils.buildHeader(access_token)
        var spotify_response = ''
        try {
            spotify_response = await axios.get(spotify_uri.SPOTIFY_USER_INFO, header)
            if (spotify_response.status == 200) {
                console.log("GET USER INFO - COMPLETED SUCCESSFULLY")
                return {"status_code" : spotify_response.status, "data" : spotify_response.data}
            } 
        } catch (error) {
            console.log('GET USER INFO - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
    }

    async getUserDevices(id) {

        var header = await utils.buildHeader(await this.users.getUserAccessToken(id))
        try {
            var spotify_response = await axios.get(spotify_uri.SPOTIFY_USER_DEVICES, header)
            if (spotify_response.status == 200) {
                console.log('GET USER DEVICE - COMPLETED SUCCESSFULLY')
                return {"status_code" : spotify_response.status, "data" : spotify_response.data}
            }
        } catch (error) {
            console.log('GET USER DEVICE - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
    }

    async refreshToken(id){
        var user_refresh_token = await this.users.getUserRefreshToken(id)
        var post_body = {
            "grant_type": "refresh_token",
            "refresh_token": user_refresh_token,
            "client_id": this.client_id,
            "client_secret": this.client_secret
        }   
        try {
            var spotify_response = await axios.post(spotify_uri.SPOTIFY_AUTHENTICATION, qs.stringify(post_body));
            if(spotify_response.status === 200){
                console.log("REFRESH TOKEN - TOKEN REFRESHED SUCCESSFULLY: ", spotify_response.data.access_token)
                this.users.setUserAccessToken(id, spotify_response.data.access_token)
                return {"status_code" : spotify_response.status}
            }
        } catch (error) {
            console.log('REFRESH TOKEN - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
        
    }

    async checkDeviceActive(id, device_id){
        var isPlayerActive = false
        while(!isPlayerActive){
            var user_devices = await this.getUserDevices(id)
            if(user_devices.status_code !== 200) return user_devices.status_code
            for(var i = 0 ; i < user_devices.data.devices.length ; i++){
                if(user_devices.data.devices[i].id == device_id && user_devices.data.devices[i].is_active) {
                    console.log("CHECK ACTIVE DEVICE - DEVICE IS ACTIVE: ", device_id)
                    isPlayerActive = true
                }
            }
        } 
    }

    async setPlayerDevice(id, device_id){
            var user_access_token = await this.users.getUserAccessToken(id)
            var header = await utils.buildHeader(user_access_token)

            var device_ids = Array()
            await device_ids.push(device_id)

            var active_player_body = {
                 "device_ids": device_ids
            }
            active_player_body = JSON.stringify(active_player_body)
            try {
                var spotify_response = await axios.put(spotify_uri.SPOTIFY_SET_PLAYER, active_player_body, header)
                if (spotify_response.status == 204)  {
                    console.log("SET DEVICE - DEVICE SET UP CORRECTLY: ", device_id)
                    return {"status_code" : spotify_response.status}
                }
            } catch (error) {
                console.log('SET DEVICE PLAYER - ERROR', error)
                return {"status_code" : error.status, "data" : 'error'}
            }
    }

    async setVolumePercent(id, device_id, volume_percent){
        var get_user_devices_response = await this.getUserDevices(id)
        var header = await utils.buildHeader(await this.users.getUserAccessToken(id))
        if(get_user_devices_response.status_code != 200) return get_user_devices_response.status_code        
        this.users.updateUser(id, await this.users.getUserAccessToken(id), await this.users.getUserRefreshToken(id), get_user_devices_response.data)

        if(!this.users.isDevicePresent(id, device_id)) return {"status_code" : 404, "data" : "device not found"}
        var query_params = {
            "volume_percent": volume_percent,
            "device_id":device_id
        }
        var url = utils.encodeQueryParams(spotify_uri.SPOTIFY_SET_VOLUME, query_params)
        try {
            var spotify_response = await axios.put(url, {}, header)
            if(spotify_response.status == 204) {
                console.log("SET VOLUME PERCENT - VOLUME SET UP CORRECTLY, device id: ", device_id, " volume: ", volume_percent, " %")
                return {"status_code" : spotify_response.status, "data" : spotify_response.data }
            }
        } catch (error) {
            console.log('SET VOLUME PLAYER - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }


    }
    async getTrackInfo(id, spotify_uri_track){
        var header = await utils.buildHeader(await this.users.getUserAccessToken(id))
        var track = await spotify_uri_track.split(':')[2]
        var url = await utils.buildURI(spotify_uri.SPOTIFY_TRACK_INFO, track)
        try {
            var spotify_response = await axios.get(url, header)
            if(spotify_response.status == 200) {
                console.log("GET TRACK INFO - Track name: ", spotify_response.data.name, "Artist: ", spotify_response.data.artists[0].name)
                return {"status_code" : spotify_response.status, "data" : spotify_response.data.name + spotify_response.data.artists[0].name }
            }
        } catch (error) {
            console.log('GET TRACK INFO - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
        
    }

    async playTrack(id, spotify_uri_track, device_id, volume_percent){
        var user_id = id;
        var spotify_uri_track = spotify_uri_track;
        var device_id = device_id;
        var volume_percent = volume_percent;

        if ( (user_id === null) || (spotify_uri === null) || (user_id === undefined) || (spotify_uri === undefined)) {
            console.log('PLAY - MISSING PARAMETERS!');
            res.status(400).end()
        } else {   
            var refresh_token_response = await this.refreshToken(user_id)
            if(refresh_token_response.status_code !== 200) return {"status_code" : refresh_token_response.status_code}
            var header = await utils.buildHeader(await this.users.getUserAccessToken(user_id))
            if(device_id != null || device_id != undefined){
                var set_player_device_response = await this.setPlayerDevice(user_id, device_id)
                if(set_player_device_response.status_code !== 204) return set_player_device_response.status_code

            } 
            if(volume_percent != null || volume_percent != undefined){
                var set_volume_response = await this.setVolumePercent(user_id, device_id, volume_percent)
                if(set_volume_response.status_code !== 204) return set_volume_response.status_code
            }
            var track_info_response = await this.getTrackInfo(user_id, spotify_uri_track)
            if(track_info_response.status_code !== 200) return track_info_response.status_code
            try {
                await this.checkDeviceActive(user_id, device_id)
                var play_body = { "uris":[spotify_uri_track] }
                var spotify_response = await axios.put(spotify_uri.SPOTIFY_PLAY_TRACK, play_body, header)

                if(spotify_response.status === 204) {
                    console.log("PLAY TRACK - SUCCESSFULLY REPRODUCED")
                    return {"status_code" : spotify_response.status, "data" : track_info_response.data }
                }
            } catch (error) {
                console.log('PLAY TRACK - ERROR', error)
                return {"status_code" : error.status, "data" : 'error'}
                
            }
        }
    }  

    async pauseTrack(id){
        var user_id = id
        if ( (user_id === null) || (user_id === '') ) {
            console.log('PAUSE - MISSING PARAMETERS!');
            res.status(400).end()
        } else {
            var refresh_token_response = await this.refreshToken(user_id)
            if(refresh_token_response.status_code !== 200) return {"status_code" : refresh_token_response.status_code}
            var header = await utils.buildHeader(await this.users.getUserAccessToken(user_id))
            try {
                var spotify_response = await axios.put(spotify_uri.SPOTIFY_PAUSE_TRACK, {}, header)
                if(spotify_response.status == 204) {
                    console.log("PAUSE TRACK - SUCCESSFULLY PAUSED")
                    return {"status_code" : spotify_response.status}  
                } 
            } catch (error) {
                console.log('PAUSE TRACK - ERROR', error)
                return {"status_code" : error.status, "data" : 'error'}
            }
        }
    }

    async searchTrack(user_id, text){
        var refresh_token_response = await this.refreshToken(user_id);
        if(refresh_token_response.status_code != 200){
            return {"status_code" : refresh_token_response.status_code};
        }
        var header = await utils.buildHeader(await this.users.getUserAccessToken(user_id));
        try {
            let queryUrl = spotify_uri.SPOTIFY_SEARCH_TRACK + utils.buildQueryString(text);
            var spotify_response = await axios.get(queryUrl, header);
            if(spotify_response.status == 200){
                //OK
                let data = JSON.parse(spotify_response.data);
                return data.items.map(song => ({
                        "name": song.name,
                        "artist": song.artists.name,
                        "album": song.album.name,
                        "duration_ms": song.duration_ms,
                        "uri": song.uri
                }));
            }else{
                return {"error": spotify_response.status};
            }
        }catch(e){
            return {"exception": e};
        }
    }

}


module.exports = SpotifyController