// Utility function for building queries from an Object.
function encodeQueryParams(uri, params) {
    const query_to_build = [];
    for (let parameter in params)
    query_to_build.push(encodeURIComponent(parameter) + '=' + encodeURIComponent(params[parameter]));
    return uri + '?' + query_to_build.join('&');
}

function buildHeader(header_value){
    return {"header" : {"Authorization": "Bearer "+ String(header_value)}};
}


module.exports = {
    encodeQueryParams,
    buildHeader
}
