// App required libraries.
var app = require('app');
app.init();
var util  = require('util');
var tools = require('tools');

// Keep everything scoped in it's own "namespace".
sfdcAssistant = {};

// Event listeners
sfdcAssistant.setupEventListeners = function() {
  // Listen for incoming calls
  digium.event.observe({
    'eventName': 'digium.phone.incoming_call',
    'callback': this.handleIncomingCall.bind(this)
  });
  /* Erroneous observe construction (it requires a named array):
  digium.event.observe('digium.phone.incoming_call', handleIncomingCall);
  */
  
};

// Handle incoming phone calls.
sfdcAssistant.handleIncomingCall = function(callData) {
  // util.debug('=================');
  util.debug('Incoming call! Call details:');
/*
  util.debug('callHandle: ' + callData.callHandle);
  util.debug('callerId: ' + tools.getCallerId(callData.eventData).number);
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
*/
};

// Main app flow.
sfdcAssistant.start = function() {
  util.debug('App started on a phone model ' + digium.phoneModel);
  this.setupEventListeners();
};

// Start the Rube Goldberg machine:
sfdcAssistant.start();

/**
 * Reference code
 */
 
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