// Utility function for building queries from an Object.
export const encodeQueryParams = (uri:string, params:any):string => {
    const query_to_build = [];
    for (let parameter in params)
    query_to_build.push(encodeURIComponent(parameter) + '=' + encodeURIComponent(params[parameter]));
    return uri + '?' + query_to_build.join('&');
}

export const buildURI = (uri:string, path:string): string => {
    return uri + '/' + path
}

export const buildHeader = (header_value:string):any => {
    return {"headers" : {"Authorization": "Bearer "+ header_value}};
}

export const buildQueryString = (text:string):string =>{
    let res = "";
    let splitted = text.split(" ");
    splitted.forEach(word => res += "+" + word);
    return res;
}

