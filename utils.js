// Utility function for building queries from an Object.
function encodeQueryParams(uri, params) {
    const query_to_build = [];
    for (let parameter in params)
    query_to_build.push(encodeURIComponent(parameter) + '=' + encodeURIComponent(params[parameter]));
    return uri + '?' + query_to_build.join('&');
}

function buildURI(uri, path){
    return uri + '/' + path
}

function buildHeader(header_value){
    return {"headers" : {"Authorization": "Bearer "+ String(header_value)}};
}

function buildQueryString(text){
    let res = "";
    let splitted = text.split(" ");
    splitted.forEach(word => res += "+" + word);
    return res;
}


module.exports = {
    encodeQueryParams,
    buildHeader,
    buildURI,
    buildQueryString
}
