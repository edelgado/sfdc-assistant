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
  
};

// Handle incoming phone calls.
sfdcAssistant.handleIncomingCall = function(callData) {
  util.debug('=================');
  util.debug('Incoming call! Call details:');
  util.debug('Token is: ' + this.sfdcToken);
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
};

// Gets a Salesforce.com REST API token.
sfdcAssistant.getSFDCToken = function(){
  var request = new NetRequest();
  var URL = 'https://' + this.config.sfdc_instance + '.salesforce.com/services/oauth2/token';
  request.open('POST', URL);
  // Salesforce expects a URL-encoded POST data payload 
  // http://www.salesforce.com/us/developer/docs/api_rest/Content/intro_understanding_username_password_oauth_flow.htm
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.oncomplete = function() {
    var response = JSON.parse(this.responseText);
    // util.debug(JSON.stringify(response));
    // util.debug(response.access_token);
    // Set the token and instance URL in the larger app scope:
    sfdcAssistant.setSFDCToken(response);
  };
  var body = {
    'grant_type':    'password',
    'client_id':     this.config.sfdc_consumer_key,
    'client_secret': this.config.sfdc_consumer_secret,
    'username':      this.config.sfdc_username,
    'password':      this.config.sfdc_password
  };
  // The POST data should be sent in an URL-Encoded string:
  request.send(tools.serialize(body));
};

// Sets the SFDC token and SFDC instance URL in a place where other app methods can get to it:
sfdcAssistant.setSFDCToken = function(obj) {
  this.sfdcToken = obj.access_token;
  this.sfdcInstanceURL = obj.instance_url;
  // Test it out by printing the token to the console.
  this.printSFDCToken();
};

sfdcAssistant.printSFDCToken = function() {
  util.debug('Got SFDC Token! Token is: ' + this.sfdcToken);
};

// Setup steps:
sfdcAssistant.start = function() {
  util.debug('App started on a phone model ' + digium.phoneModel);
  // Get the config settings and cache it locally:
  var config = app.getConfig().settings;
  var sfdcToken = null;
  this.config = util.defaults(config, {
    'sfdc_consumer_key':    '',
    'sfdc_consumer_secret': '',
    'sfdc_username':        '',
    'sfdc_password':        '',
    'sfdc_instance':        'test' // test, na1, cs3, etc.
  });
  // Salesforce.com REST API token:
  this.getSFDCToken();
  // Setup event listeners:
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