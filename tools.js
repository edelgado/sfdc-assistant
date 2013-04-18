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
  //extract the number from the sip url that is listed in remoteInfo
  obj.number = parts[2].split(':')[1].split('@')[0];
  return obj;
};
// Set exports as required in the "require()" core method:
// See http://phones.digium.com/phone-api/reference/javascript-modules/exports
exports.getCallerId = tools.getCallerId.bind(tools);