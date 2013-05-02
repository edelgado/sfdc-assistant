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
        label: 'Title',
        // icon: 'glyphicons_353_nameplate_alt.png',
        // icon_width: 24,
        // icon_height: 22,
        icon: 'title_icon.gif',
        icon_width: 52,
        icon_height: 17,
        value: obj.records[0].Title
      },
      {
        label: 'Company',
        icon: 'glyphicons_089_building.png',
        icon_width: 24,
        icon_height: 26,
        value: obj.records[0].Account.Name
      },
      {
        label: 'Type',
        icon: 'glyphicons_332_certificate.png',
        icon_width: 17,
        icon_height: 25,
        value: obj.records[0].Account.Type
      },
      {
        label: 'Rating',
        icon: 'glyphicons_331_dashboard.png',
        icon_width: 24,
        icon_height: 24,
        value: obj.records[0].Account.Rating
      }
    ];
    var contents = new Scroll(0,Text.LINE_HEIGHT, window.w, window.h - Text.LINE_HEIGHT);
    var fieldLabel = {};
    var fieldValue = {};
    var icon = {};
    var rowCount = 1;
    var linePadding = 2;
    var nextLineY = 0;
    var fieldHeight = 20;
    
    // The name of the contact, position at x=0, y=LINE_HEIGHT, w=320, h=0 (calculated later)
    contactNameUIElement = new Text(0,Text.LINE_HEIGHT,320,0);
    contactNameUIElement.label = obj.records[0].FirstName + ' ' + obj.records[0].LastName;
    contactNameUIElement.align(Widget.LEFT);
    util.debug('Current W x H: ' + contactNameUIElement.w + 'x' + contactNameUIElement.h);
    util.debug('Current Label Size: ' + contactNameUIElement.labelSize);
    contactNameUIElement.labelSize = parseInt((contactNameUIElement.labelSize * 2), 10);
    contactNameUIElement.h = contactNameUIElement.labelSize;
    util.debug('New Label Size: ' + contactNameUIElement.labelSize);
    util.debug('New W x H: ' + contactNameUIElement.w + 'x' + contactNameUIElement.h);
    contents.add(contactNameUIElement);
    nextLineY = Text.LINE_HEIGHT + contactNameUIElement.h + linePadding;

    fieldsToDisplay.forEach(function(field){
      // Icon image widget:
      icon = new Image("app", field.icon, 0, nextLineY, field.icon_width, field.icon_height);
      util.debug('Adding icon filename=' + field.icon + ', y-pos=' + nextLineY);
      // Limit to a certain height:
      if (field.icon_height > fieldHeight - 6) {
        icon.resize(0,fieldHeight - 6);
      }
      
      // TODO: Right-align icons based on their current width and an imaginary right margin of about 20.
      
      // Text value widget:
      fieldValue = new Text(25,nextLineY,250,Text.LINE_HEIGHT, field.value);
      fieldValue.labelSize = parseInt((fieldValue.labelSize * 1.1), 10);
      fieldValue.color = 'black';
      fieldValue.boxType = Widget.FLAT_BOX;
      fieldValue.labelColor = 'white';
      contents.add(icon);
      contents.add(fieldValue);
      nextLineY += fieldHeight;
    });

    digium.foreground();
    window.clear();
    window.add(windowTitle, contents);
  } else {
    util.debug('No SFDC match :-(');
  }
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