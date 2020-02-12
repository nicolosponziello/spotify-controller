

import User from "./user";

class UserList {

    private users: Array<User>;

    constructor() {
        this.users = new Array();
    }


    public isUserPresent(id:string): boolean {
        var user_found = this.users.filter((x) => x.getId() == id);
        if(user_found.length > 0) return true;
        else return false;
    }

    public updateUser (id: string, access_token:string, refresh_token:string, devices:Array<string>): void {
        this.users.forEach(user => {
            if(user.getId() == id){
                user.setAccessToken(access_token);
                user.setRefreshToken(refresh_token);
                user.setDevices(devices);
            }
        });
    }

    public createUser( id:string, name:string, access_token:string, refresh_token:string, devices:Array<string>): void {
        this.users.push(new User(id, name, access_token, refresh_token, devices));      
    }

    public getUser(id:string):User {
        return this.users.filter((user: User) => user.getId() == id)[0];
    }

    public getUserAccessToken(id:string): string{
        return  this.getUser(id).getAccessToken();
    }

    public getUserRefreshToken(id:string): string{
        return this.getUser(id).getRefreshToken();
    }

    public setUserAccessToken(id:string, access_token:string): void{
        var user = this.getUser(id);
        if(user != undefined) this.updateUser(id, access_token, user.getRefreshToken(), user.getDevices());
    }

    public isDevicePresent(id:string, device_id:string): boolean{
        var user = this.getUser(id);
        var devices_found = user.getDevices().filter((device:any) => device.id == device_id);
        return (devices_found.length > 0) ?  true : false;

    }
}
export default UserList;