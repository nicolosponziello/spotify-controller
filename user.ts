 class User {
     private id: string;
     private name: string;
     private access_token: string;
     private refresh_token: string;
     private devices: Array<any>;
    
    constructor(id:string, name:string, access_token:string, refresh_token:string, devices:Array<any>) {
        this.id = id
        this.name = name
        this.access_token = access_token
        this.refresh_token = refresh_token
        this.devices = devices
    }

    public getId(): string {
        return this.id
    }

    public getName(): string {
        return this.name
    }

    public getAccessToken(): string {
        return this.access_token
    }

    public setAccessToken(access_token:string): void {
        this.access_token = access_token
    }

    public getRefreshToken(): string {
        return this.refresh_token
    }

    public setRefreshToken(refresh_token:string): void {
        this.refresh_token = refresh_token
    }

    public getDevices(): Array<any> {
        return this.devices
    }

    public setDevices(devices:Array<any>): void {
        this.devices = devices
    }

}
export default User;