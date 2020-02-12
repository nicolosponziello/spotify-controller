

import { buildHeader, buildQueryString, buildURI, encodeQueryParams } from "./utils";
import UserList from "./userList";
import {SPOTIFY_AUTHENTICATION,SPOTIFY_AUTHORIZE, SPOTIFY_PAUSE_TRACK, SPOTIFY_PLAY_TRACK, 
        SPOTIFY_SEARCH_TRACK, SPOTIFY_SET_PLAYER, SPOTIFY_SET_VOLUME, SPOTIFY_TRACK_INFO,
        SPOTIFY_USER_INFO, SPOTIFY_USER_DEVICES} from "./const";

import axios from "axios";
var qs = require('qs');

class SpotifyController {

    private client_id: string;
    private redirect_uri: string;
    private client_secret: string;
    private users: UserList;

    constructor(client_id:string, redirect_uri:string, client_secret:string){ 
        this.client_id = client_id;
        this.redirect_uri = redirect_uri;
        this.client_secret = client_secret;
        this.users = new UserList();
    }


    public login():string {
        console.log('LOGIN - REQUEST LOGIN');
        var query_params = {
            "client_id": this.client_id,
            "response_type": "code",
            "redirect_uri": this.redirect_uri,
            "scope": "user-modify-playback-state playlist-read-collaborative playlist-modify-private user-modify-playback-state user-read-private user-library-modify user-follow-modify user-read-recently-played user-read-currently-playing playlist-modify-public user-read-playback-state app-remote-control user-library-read user-follow-read user-read-email playlist-read-private user-top-read",
            "show_dialog": true
        }
        return encodeQueryParams(SPOTIFY_AUTHORIZE, query_params)
    }

    public async callback(req:any, res:any){
        var request_data = req.query 
        if ('error' in request_data){
            console.log('CALLBACK - FOUND ERROR: ', request_data["error"]);
            res.status(500).end();
        } else {
            console.log('CALLBACK');
            var user_authentication_data:any = await this.authentication(request_data.code);
            console.log("CALLBACK - AUTHENTICATION RESPONSE" );
            console.log(user_authentication_data);

            var user_info:any = await this.getUserInfo(user_authentication_data.data.access_token);
            if(user_authentication_data.status_code !== 200) return user_info.status_code;
            
            console.log("CALLBACK - GET USER INFO RESPONSE" );
            console.log(user_info);
            if(user_info.status_code!== 200) return user_info.status_code;
            

            
            
            if (!await this.users.isUserPresent(user_info.id)) {
                await this.users.createUser(user_info.data.id, user_info.data.display_name, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token,[] );
            } else {
                await this.users.updateUser(user_info.data.id, user_authentication_data.data.access_token, user_authentication_data.data.refresh_token, []);
            }
            let user_devices:any = await this.getUserDevices(user_info.data.id);
            if (user_devices.status_code != 200) return user_devices.status_code;
            console.log("CALLBACK - GET USER DEVICE RESPONSE");
            console.log(user_devices);
            return await this.users.getUser(user_info.data.id);
        }
    }

    async authentication(code:string) {
        var authentication_response:any = ''
        var post_body = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": this.redirect_uri,
            "client_id": this.client_id,
            "client_secret": this.client_secret
        };
        try {
            authentication_response = await axios.post(SPOTIFY_AUTHENTICATION, qs.stringify(post_body),).then(res => res.data);
            
            if(authentication_response.status == 200) {
                console.log("AUTHENTICATION - COMPLETED SUCCESSFULLY")
                return {"status_code" : authentication_response.status, "data" :authentication_response.data};
            }
        } catch (error) {
            console.log('AUTHENTICATION - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'}
        }
    } 
    
    
    async getUserInfo(access_token:string) {
        var header:any = buildHeader(access_token);
        var spotify_response:any = '';
        try {
            spotify_response = await axios.get(SPOTIFY_USER_INFO, header).then(res => res.data);
            if (spotify_response.status == 200) {
                console.log("GET USER INFO - COMPLETED SUCCESSFULLY");
                return {"status_code" : spotify_response.status, "data" : spotify_response.data};
            } 
        } catch (error) {
            console.log('GET USER INFO - ERROR', error)
            return {"status_code" : error.status, "data" : 'error'};
        }
    }

    async getUserDevices(id:string) {
        var header = await buildHeader(this.users.getUserAccessToken(id));
        try {
            var spotify_response = await axios.get(SPOTIFY_USER_DEVICES, header);
            if (spotify_response.status == 200) {
                console.log('GET USER DEVICE - COMPLETED SUCCESSFULLY');
                return {"status_code" : spotify_response.status, "data" : spotify_response.data};
            }
        } catch (error) {
            console.log('GET USER DEVICE - ERROR', error);
            return {"status_code" : error.status, "data" : 'error'};
        }
    }

    async refreshToken(id: string){
        let user_refresh_token:any = await this.users.getUserRefreshToken(id);
        let post_body = {
            "grant_type": "refresh_token",
            "refresh_token": user_refresh_token,
            "client_id": this.client_id,
            "client_secret": this.client_secret
        };
        try {
            let spotify_response = await axios.post(SPOTIFY_AUTHENTICATION, qs.stringify(post_body));
            if(spotify_response.status === 200){
                console.log("REFRESH TOKEN - TOKEN REFRESHED SUCCESSFULLY: ", spotify_response.data.access_token);
                this.users.setUserAccessToken(id, spotify_response.data.access_token);
                return {"status_code" : spotify_response.status};
            }
        } catch (error) {
            console.log('REFRESH TOKEN - ERROR', error);
            return {"status_code" : error.status, "data" : 'error'};
        }
        
    }

    async checkDeviceActive(id:string, device_id:string){
        let isPlayerActive:boolean = false;
        while(!isPlayerActive){
            let user_devices:any = await this.getUserDevices(id);
            if(user_devices.status_code !== 200) return user_devices.status_code;
            for(var i = 0 ; i < user_devices.data.devices.length ; i++){
                if(user_devices.data.devices[i].id == device_id && user_devices.data.devices[i].is_active) {
                    console.log("CHECK ACTIVE DEVICE - DEVICE IS ACTIVE: ", device_id);
                    isPlayerActive = true;
                }
            }
        } 
    }

    async setPlayerDevice(id:string, device_id:string){
            let user_access_token:any = await this.users.getUserAccessToken(id);
            let header:any = await buildHeader(user_access_token);

            let device_ids:Array<string> = Array();
            device_ids.push(device_id);

            let active_player_body:any = JSON.stringify({
                 "device_ids": device_ids
            });
            try {
                let spotify_response:any = await axios.put(SPOTIFY_SET_PLAYER, active_player_body, header);
                if (spotify_response.status == 204)  {
                    console.log("SET DEVICE - DEVICE SET UP CORRECTLY: ", device_id);
                    return {"status_code" : spotify_response.status};
                }
            } catch (error) {
                console.log('SET DEVICE PLAYER - ERROR', error);
                return {"status_code" : error.status, "data" : 'error'};
            }
    }

    async setVolumePercent(id:string, device_id:string, volume_percent:string){
        let get_user_devices_response:any = await this.getUserDevices(id);
        let header:any = await buildHeader(await this.users.getUserAccessToken(id));
        if(get_user_devices_response.status_code != 200) return get_user_devices_response.status_code;       
        this.users.updateUser(id, await this.users.getUserAccessToken(id), await this.users.getUserRefreshToken(id), get_user_devices_response.data);

        if(!this.users.isDevicePresent(id, device_id)) return {"status_code" : 404, "data" : "device not found"};
        let query_params = {
            "volume_percent": volume_percent,
            "device_id":device_id
        }
        let url:string = encodeQueryParams(SPOTIFY_SET_VOLUME, query_params);
        try {
            let spotify_response:any = await axios.put(url, {}, header);
            if(spotify_response.status == 204) {
                console.log("SET VOLUME PERCENT - VOLUME SET UP CORRECTLY, device id: ", device_id, " volume: ", volume_percent, " %");
                return {"status_code" : spotify_response.status, "data" : spotify_response.data };
            }
        } catch (error) {
            console.log('SET VOLUME PLAYER - ERROR', error);
            return {"status_code" : error.status, "data" : 'error'};
        }


    }
    async getTrackInfo(id:string, spotify_uri_track:string){
        let header:any = buildHeader(this.users.getUserAccessToken(id));
        let track:string = spotify_uri_track.split(':')[2]
        let url:string = buildURI(SPOTIFY_TRACK_INFO, track);
        try {
            let spotify_response = await axios.get(url, header);
            if(spotify_response.status == 200) {
                console.log("GET TRACK INFO - Track name: ", spotify_response.data.name, "Artist: ", spotify_response.data.artists[0].name);
                return {"status_code" : spotify_response.status, "data" : spotify_response.data.name + spotify_response.data.artists[0].name };
            }
        } catch (error) {
            console.log('GET TRACK INFO - ERROR', error);
            return {"status_code" : error.status, "data" : 'error'};
        }
        
    }

    async playTrack(id:string, spotify_uri_track:string, device_id:string, volume_percent:string){
        

        if ( (id === null) || (spotify_uri_track === null)) {
            console.log('PLAY - MISSING PARAMETERS!');
            return;
        } else {   
            let refresh_token_response:any = await this.refreshToken(id);
            if(refresh_token_response.status_code !== 200) return {"status_code" : refresh_token_response.status_code};
            let header = buildHeader(this.users.getUserAccessToken(id));
            if(device_id != null || device_id != undefined){
                let set_player_device_response:any = await this.setPlayerDevice(id, device_id);
                if(set_player_device_response.status_code !== 204) return set_player_device_response.status_code;
            } 
            if(volume_percent != null || volume_percent != undefined){
                let set_volume_response:any = await this.setVolumePercent(id, device_id, volume_percent);
                if(set_volume_response.status_code !== 204) return set_volume_response.status_code;
            }
            let track_info_response:any = await this.getTrackInfo(id, spotify_uri_track);
            if(track_info_response.status_code !== 200) return track_info_response.status_code;
            try {
                await this.checkDeviceActive(id, device_id);
                let play_body:Object = { "uris":[spotify_uri_track] };
                let spotify_response:any = await axios.put(SPOTIFY_PLAY_TRACK, play_body, header);

                if(spotify_response.status === 204) {
                    console.log("PLAY TRACK - SUCCESSFULLY REPRODUCED");
                    return {"status_code" : spotify_response.status, "data" : track_info_response.data };
                }
            } catch (error) {
                console.log('PLAY TRACK - ERROR', error);
                return {"status_code" : error.status, "data" : 'error'};                
            }
        }
    }  

    async pauseTrack(id:string){
        if ( (id === null) || (id === '') ) {
            console.log('PAUSE - MISSING PARAMETERS!');
            return;
        } else {
            let refresh_token_response:any = await this.refreshToken(id);
            if(refresh_token_response.status_code !== 200) return {"status_code" : refresh_token_response.status_code};
            let header = buildHeader(this.users.getUserAccessToken(id));
            try {
                let spotify_response:any = await axios.put(SPOTIFY_PAUSE_TRACK, {}, header);
                if(spotify_response.status == 204) {
                    console.log("PAUSE TRACK - SUCCESSFULLY PAUSED");
                    return {"status_code" : spotify_response.status};
                } 
            } catch (error) {
                console.log('PAUSE TRACK - ERROR', error);
                return {"status_code" : error.status, "data" : 'error'};
            }
        }
    }

    async searchTrack(user_id:string, text:string){
        let refresh_token_response:any = await this.refreshToken(user_id);
        if(refresh_token_response.status_code != 200){
            return {"status_code" : refresh_token_response.status_code};
        }
        let header = buildHeader(this.users.getUserAccessToken(user_id));
        try {
            let queryUrl = SPOTIFY_SEARCH_TRACK + buildQueryString(text);
            let spotify_response:any = await axios.get(queryUrl, header);
            if(spotify_response.status == 200){
                //OK
                let data = JSON.parse(spotify_response.data);
                return data.items.map((song:any) => ({
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

export default SpotifyController;