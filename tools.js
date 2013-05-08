/**
 * Utility functions.
 */
var tools = {};

// Parse the incoming call object for caller id information
// Credit: Sample CallerID Digium Phone App (https://github.com/sruffell/digium-phone-apps/blob/master/callerId/startup.js#L242-L251)
tools.getCallerId = function(params) {
  var remoteInfo = params.remoteInfo;
  var obj = {};
  var parts = remoteInfo.split('"');
  obj.name = parts[1];
  // Extract the number from the sip url that is listed in remoteInfo 
  // and remove any special charachters, only leave numbers:
  obj.number = parts[2].split(':')[1].split('@')[0].replace(/[^0-9]/ig,'');
  return obj;
};

// Convert a Javascript object into an URL encoded string.
// serialize({'apple': 'red delicious', 'banana': 'yellow'}) returns: apple=red%20delicious&banana=yellow
tools.serialize = function(obj, prefix) {
    var str = [];
    for(var p in obj) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v == "object" ? 
            serialize(v, k) :
            encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }
    return str.join("&");
};

// Set exports as required in the "require()" core method:
// See http://phones.digium.com/phone-api/reference/javascript-modules/exports
exports.getCallerId = tools.getCallerId.bind(tools);
exports.serialize   = tools.serialize.bind(tools);