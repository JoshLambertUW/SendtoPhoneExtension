const contextPopupW = ~~(screen.width/3);
const contextPopupH = ~~(screen.height/4);
const contextPopupLeft = ~~(screen.width * 0.3);
const contextPopupTop = ~~(screen.height * 0.4);

const send_success_message = "Message successfully sent!";
const device_register_message = "There was an issue sending to this device. Make sure that the app is installed on the device and then try refreshing the device list from the extension.";
const unknown_error_message = "Unable to send. Please try again later.";

var config = {  
  apiKey: "AIzaSyDHNpI-fbFqUYhumIOY3zVRP_dfZCpw2LY",
  authDomain: "sendtophone.firebaseapp.com",
  databaseURL: "https://sendtophone.firebaseio.com",
  projectId: "sendtophone",
  storageBucket: "sendtophone.appspot.com",
  messagingSenderId: "926700184689",
  appId: "1:926700184689:web:096c91250c3d677a"
};

firebase.initializeApp(config);
var functions = firebase.functions();
var db = firebase.firestore();
var user = firebase.auth().currentUser;
  
  function sendDataFromNotification(selection) {
    var deviceList = [];
    var defaultDevice;
    var sendDataToFirebase = firebase.functions().httpsCallable('sendData');

    chrome.storage.sync.get([{'deviceList': deviceList}, {'defaultDevice': 0}],
      function(items) {
        if (items.defaultDevice === 0 && items.deviceList.length === 0){
          display_app_window();
          return;
        }
        defaultDevice = (items.defaultDevice === 0) ? items.deviceList[0][0]:items.defaultDevice;
        sendDataToFirebase({message: selection,
          selectedDevice: defaultDevice}).then(function(result) {
          if (result.data.success){
            result_notification(true, send_success_message);
          }
        }).catch(function(error) {
          if (error.code === 'messaging/registration-token-not-registered' 
            || error.code === 'messaging/invalid-registration-token'){
            result_notification(false, device_register_message);
          }
          else {
            result_notification(false, unknown_error_message);
          }
      });
    });
  }

  function refreshDeviceList(){
    var user = firebase.auth().currentUser; 
    console.log(user.uid);
    var deviceList = [];
    db.collection('users').doc(user.uid).collection('devices').get().then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        var device = [doc.id, doc.get('deviceName')];
        deviceList.push(device);
      });

      chrome.storage.sync.set({'deviceList': deviceList}, function() {
      });
    });
  }

  function display_send_window(){
    chrome.windows.create({'url': 'sendWindow.html', 
      'type': 'popup', 
      'width': contextPopupW, 
      'height': contextPopupH, 
      'left': contextPopupLeft, 
      'top': contextPopupTop});
  }

  function display_app_window(){
    chrome.windows.create({'url': 'appWindow.html', 
    'type': 'popup', 
    'width': contextPopupW, 
    'height': contextPopupH, 
    'left': contextPopupLeft, 
    'top': contextPopupTop});
  }

  function result_notification(success, message){
    var notificationID = null;
    if (success) var notificationIcon = 'send_notifiction.png';
    else var notificationIcon = 'error_notification.png';

    var notificationData = {'type': 'basic', 
          'iconUrl': notificationIcon,
          'title': 'Send to Device', 
          'message': message
        };

    chrome.notifications.create(notificationData, function(notificationId) {
      notificationID = notificationId;
    });
    
  }

  function send_notification(){
    var notificationID = null;
    var notificationMessage = message.substring(0,159);
    var notificationData = {'type': 'basic', 
          'iconUrl': 'send_notification.png',
          'title': 'Send to Device', 
          'message': notificationMessage,
          buttons: [
            {title: 'Send'},
            {title: 'Edit'}
          ]};

    chrome.notifications.create(notificationData, function(notificationId) {
      notificationID = notificationId;
    });
    
    chrome.notifications.onButtonClicked.addListener(function(nId, bId) {
      if (nId === notificationID) {
          if (bId === 0) {
            sendDataFromNotification(message);
          } else if (bId === 1) {
            display_send_window();
          }
      }
    });
  }

  function display_prompt(){
    chrome.notifications.getPermissionLevel(function (permissionLevel) {
      if (permissionLevel === 'granted') {
        send_notification();
      }
      else {
        display_window();
      }
    });
  }