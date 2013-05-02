// App required libraries.
var app = require('app');
app.init();
var util  = require('util');
var tools = require('tools');
var screen = require('screen');

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
  
  // util.debug('=================');
  // util.debug('Incoming call! Call details:');
  // util.debug('Token is: ' + this.sfdcToken);
  // util.debug('callHandle: ' + callData.callHandle);
  // util.debug('callerId: ' + tools.getCallerId(callData.eventData).number);
  // util.debug('method: ' + callData.method);
  // util.debug('eventName: ' + callData.eventName);
  // util.debug('messageId: ' + callData.messageId);
  // util.debug('Call status object (eventData):');
  // util.debug('state: '         + callData.eventData.state);
  // util.debug('accountSlot: '   + callData.eventData.accountSlot);
  // util.debug('callHandle: '    + callData.eventData.callHandle);
  // util.debug('remoteInfo: '    + callData.eventData.remoteInfo);
  // util.debug('remoteContact: ' + callData.eventData.remoteContact);
  // util.debug('lastStatus: '    + callData.eventData.lastStatus);
  // util.debug('lastStatusText: '    + callData.eventData.lastStatusText);
  // util.debug('mediaStatus: '    + callData.eventData.mediaStatus);
  // util.debug('headers: '    + callData.eventData.headers);
  
  this.currentCall = callData.eventData;
  
  // Listen for changes in the current call's state
  // this function will show the 'on call' screen when the user picks up
  // and hide the incoming/on call screen when the current call ends
  // Credit: https://github.com/sruffell/digium-phone-apps/blob/master/callerId/startup.js
  digium.phone.observeCallEvents({
      'callHandle'  : callData.eventData.callHandle,
      'handler'    : function(obj) {
        util.debug('Call state is now: ' + obj.state);
        if ("EARLY" == obj.state) {
          this.setIncomingCallSoftkeys();
        } else if ("CONFIRMED" == obj.state) {
          this.setOnCallSoftkeys();
        } else if ("DISCONNCTD" == obj.state) {
          digium.background();
        }
      }.bind(this)
    });
  
  // Fetch the calling phone number:
  var callerNumber = tools.getCallerId(callData.eventData).number;
  // Do a SFDC API call:
  var query = 'SELECT Id, FirstName, LastName, Salutation, Title, Account.name, Account.Rating, Account.Type ' + 
    'FROM Contact WHERE ' + 
    'Phone LIKE \'' + callerNumber + '\' ' + 
    'OR AssistantPhone LIKE \'' + callerNumber + '\' ' + 
    'OR HomePhone LIKE \'' + callerNumber + '\' ' +
    'OR MobilePhone LIKE \'' + callerNumber + '\' ' +
    'OR OtherPhone LIKE \'' + callerNumber + '\' ' +
    'LIMIT 1';

  // Query Salesforce.com:
  sfdcAssistant.sfdcGETRequest('/services/data/v20.0/query/?q=' + encodeURIComponent(query), sfdcAssistant.displayData);
};

// Display the data on the phone screen.
sfdcAssistant.displayData = function(obj){
  var windowTitle = screen.setTitleText({'title' : 'Caller Salesforce Information'});
  if (typeof obj != 'undefined' && obj.totalSize == 1) {
    util.debug('Found SFDC match :-)');
    var fieldsToDisplay = [
      {
        label: 'TITLE',
        value: obj.records[0].Title
      },
      {
        label: 'COMPANY',
        value: obj.records[0].Account.Name
      },
      {
        label: 'TYPE',
        value: obj.records[0].Account.Type
      },
      {
        label: 'RATING',
        value: obj.records[0].Account.Rating
      }
    ];
    var contents = new Scroll(0,Text.LINE_HEIGHT, window.w, window.h - Text.LINE_HEIGHT);
    var fieldLabel = {};
    var fieldValue = {};
    var linePadding = 2;
    var nextLineY = 0;
    
    // The name of the contact, position at x=0, y=LINE_HEIGHT, w=320, h=0 (calculated later)
    contactNameUIElement = new Text(0,Text.LINE_HEIGHT,320,0);
    contactNameUIElement.label = obj.records[0].FirstName + ' ' + obj.records[0].LastName;
    contactNameUIElement.align(Widget.LEFT);
    util.debug('Current W x H: ' + contactNameUIElement.w + 'x' + contactNameUIElement.h);
    util.debug('Current Label Size: ' + contactNameUIElement.labelSize);
    contactNameUIElement.labelSize = parseInt((contactNameUIElement.labelSize * 1.5), 10);
    contactNameUIElement.h = contactNameUIElement.labelSize;
    util.debug('New Label Size: ' + contactNameUIElement.labelSize);
    util.debug('New W x H: ' + contactNameUIElement.w + 'x' + contactNameUIElement.h);
    contents.add(contactNameUIElement);
    nextLineY = Text.LINE_HEIGHT + contactNameUIElement.h + linePadding;

    fieldsToDisplay.forEach(function(field){
      // Label black boxes:
      fieldLabel = new Text(0,nextLineY,50,Text.LINE_HEIGHT, field.label);
      fieldLabel.boxType = Widget.FLAT_BOX; // Filled box
      fieldLabel.color = 'black';           // Black background
      fieldLabel.labelColor = 'white';      // Text is white
      fieldLabel.align(Widget.RIGHT);       // The text should be right-aligned

      // Caller information:
      fieldValue = new Text(55,nextLineY,265,Text.LINE_HEIGHT, field.value);

      contents.add(fieldLabel);
      contents.add(fieldValue);
      nextLineY += Text.LINE_HEIGHT + linePadding;
    });

    digium.foreground();
    window.clear();
    window.add(windowTitle, contents);
  } else {
    util.debug('No SFDC match :-(');
  }
}.bind(this);

// Set the window's softkeys during an incoming call
// Credit: https://github.com/sruffell/digium-phone-apps/blob/master/callerId/startup.js
sfdcAssistant.setIncomingCallSoftkeys = function () {
  //clear any softkeys that are already set
  window.clearSoftkeys();

  //set the first softkey to allow the user to answer the call
  window.setSoftkey(1, 'Answer', function() {
    digium.phone.answer(this.currentCall);
  }.bind(this));

  //set the fourth softkey to allow the user to ignore the call
  window.setSoftkey(4, 'Reject', function() {
    digium.phone.reject(this.currentCall);
  }.bind(this));
};

// Set the window's softkeys for an answered call
// Credit: https://github.com/sruffell/digium-phone-apps/blob/master/callerId/startup.js
sfdcAssistant.setOnCallSoftkeys = function () {
  //clear any softkeys that are already set
  window.clearSoftkeys();
  
  //set the first softkey to allow the user to end the call
  window.setSoftkey(1, 'End', function() {
    digium.phone.hangup(this.currentCall);
  }.bind(this));
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
    if (typeof response.error != 'undefined') {
      util.debug('== Error obtaining a Salesforce.com API token. The app will stop here. Details: ' + JSON.stringify(response));
    } else {
      // Set the token where we can read it later:
      sfdcAssistant.setSFDCToken(response);
      // Setup event listeners:
      sfdcAssistant.setupEventListeners();
    }
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
  util.debug('Got SFDC Token! Token is: ' + this.sfdcToken);
};

// Generic Salesforce.com GET request handler.
sfdcAssistant.sfdcGETRequest = function(uri, callbackName) {
  var callback = callbackName || function(){};
  var request = new NetRequest();
  var URL = this.sfdcInstanceURL + uri;
  request.open('GET', URL);
  request.setRequestHeader('Authorization', 'Bearer ' + this.sfdcToken);
  request.oncomplete = function() {
    // util.debug('sfdcGETRequest: ' + this.responseText);
    callback(JSON.parse(this.responseText));
  };
  request.send();
};

// Setup steps:
sfdcAssistant.start = function() {
  util.debug('App started on a phone model ' + digium.phoneModel);
  this.currentCall = null;
  // Get the config settings and cache it locally:
  var config = app.getConfig().settings;
  this.config = util.defaults(config, {
    'sfdc_consumer_key':    '',
    'sfdc_consumer_secret': '',
    'sfdc_username':        '',
    'sfdc_password':        '',
    'sfdc_instance':        'test' // test, na1, cs3, etc.
  });
  // Salesforce.com REST API token. If successful, it will also setup the event listeners.
  this.getSFDCToken();
};

// Start the Rube Goldberg machine:
sfdcAssistant.start();