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

  function sendMessageFromNotification(selection){
    var deviceList = [];
    var defaultDevice;

    chrome.storage.sync.get({'deviceList': deviceList, 'defaultDevice': 0},
      function(items) {
        if (items.defaultDevice === 0 && items.deviceList.length === 0){
          displayAppWindow();
          return;
        }
        if (items.defaultDevice === 0){
          defaultDevice = items.deviceList[0][0];
          chrome.storage.sync.set({'defaultDevice': defaultDevice});
        }
        else { defaultDevice = items.defaultDevice; }
        sendMessage(selection, defaultDevice).then(function(result) {
            resultNotification(result);
          }).catch(function(error) {
            console.log(error.code);
          });
      });
  }

  function sendMessage(selection, selectedDevice) {
    var functions = firebase.functions();
    var sendDataToFirebase = firebase.functions().httpsCallable('sendData');
    return sendDataToFirebase({message: selection,
      selectedDevice: selectedDevice});
  }

  function deleteDevice(selectedDevice) {
    var functions = firebase.functions();
    var deleteDeviceFromFirebase = firebase.functions().httpsCallable('deleteDevice');
    return deleteDeviceFromFirebase({selectedDevice: selectedDevice});
  }

  function refreshDeviceList(){
    var db = firebase.firestore();
    var user = firebase.auth().currentUser; 
    var deviceList = [];
    var defaultDevice = 0;
    
    chrome.storage.sync.get({'deviceList': deviceList, 'defaultDevice': 0},
      function(items) {
        db.collection('users').doc(user.uid).collection('devices').get().then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            if (doc.id === items.defaultDevice) defaultDevice = items.defaultDevice;
            var device = [doc.id, doc.get('deviceName')];
            deviceList.push(device);
          });
        if (defaultDevice === 0) defaultDevice = deviceList[0][0];
        chrome.storage.sync.set({'deviceList': deviceList, 'defaultDevice': defaultDevice});
      });
    });
  }

  function displaySendWindow(){
    chrome.windows.create({'url': 'sendWindow.html', 
      'type': 'popup', 
      'width': contextPopupW, 
      'height': contextPopupH, 
      'left': contextPopupLeft, 
      'top': contextPopupTop});
  }

  function displayAppWindow(){
    chrome.windows.create({'url': 'appWindow.html', 
    'type': 'popup', 
    'width': contextPopupW, 
    'height': contextPopupH, 
    'left': contextPopupLeft, 
    'top': contextPopupTop});
  }

  function resultNotification(result){
    var iconUrl = '/img/send_notification.png';
    var message;
    var notificationID = null;

    if (!result.data.successCount){
      iconUrl = '/img/error_notification.png';
      if (result.data.results[0].error.code === 'messaging/registration-token-not-registered' 
        || result.data.results[0].error.code === 'messaging/invalid-registration-token'){
        message = device_register_message;
        }
      else {
        message = unknown_error_message;
      }
    }
    else {
      message = send_success_message;
    }
    
    var notificationData = {'type': 'basic', 
          'iconUrl': iconUrl,
          'title': 'Send to Device', 
          'message': message
        };

    chrome.notifications.create(notificationData, function(notificationId) {
      notificationID = notificationId;
    });
  }

  function sendNotification(){
    var notificationID = null;
    var notificationMessage = message.substring(0,159);
    var iconUrl = '/img/send_notification.png';
    var notificationData = {'type': 'basic', 
          'iconUrl': iconUrl,
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
            sendMessageFromNotification(message);
          } else if (bId === 1) {
            displaySendWindow();
          }
      }
    });
  }

  function displayPrompt(){
    chrome.notifications.getPermissionLevel(function (permissionLevel) {
      if (permissionLevel === 'granted') {
        sendNotification();
      }
      else {
        displaySendWindow();
      }
    });
  }