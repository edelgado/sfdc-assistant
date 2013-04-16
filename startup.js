// Include the app library (doesn't look to be necessary)
// var app = require('app');
// app.init();
// Include the utility library.
var util = require('util');
util.debug('App started on a phone model ' + digium.phoneModel);

// Sample outbound call (works)
// digium.phone.dial({
//     'number': 100,
//     'handler': function(obj) {
//         util.debug(obj.state);  //prints the 'state' of the call
//     }
// });

// Sample HTTP Request (works)
// var request = new NetRequest();
// request.open("GET", "http://www.google.com");
// request.oncomplete = function() {
//   util.debug(this.responseText);
// };
// request.send();

// Listen for incoming calls
digium.event.observe({
  'eventName': 'digium.phone.incoming_call',
  'callback': handleIncomingCall
});

/* Erroneous observe construction (it requires a named array):
digium.event.observe('digium.phone.incoming_call', handleIncomingCall);
*/

function handleIncomingCall(callData) {
  
  util.debug('Incoming call! Call details:');
  util.debug('callHandle: ' + callData.callHandle);
  util.debug('method: ' + callData.method);
  util.debug('eventName: ' + callData.eventName);
  util.debug('messageId: ' + callData.messageId);
  util.debug('Call status object (eventData):');
  util.debug('state: '         + callData.eventData.state);
  util.debug('accountSlot: '   + callData.eventData.accountSlot);
  util.debug('callHandle: '    + callData.eventData.callHandle);
  util.debug('remoteInfo: '    + callData.eventData.remoteInfo);
  util.debug('remoteContact: ' + callData.eventData.remoteContact);
  util.debug('lastStatus: '    + callData.eventData.lastStatus);
  util.debug('lastStatusText: '    + callData.eventData.lastStatusText);
  util.debug('mediaStatus: '    + callData.eventData.mediaStatus);
  util.debug('headers: '    + callData.eventData.headers);
}