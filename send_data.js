const contextPopupW = ~~(screen.width / 3);
const contextPopupH = ~~(screen.height / 4);
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

///////////////////////////////////////////////////////////////////////////////
// Sends message to default device
///////////////////////////////////////////////////////////////////////////////

async function sendMessageFromNotification(selection) {
  if (defaultDevice == null || defaultDevice.length === 0) await getDefaultDevice();
  sendMessage(selection, defaultDevice).then(function (result) {
    if (!result) message = '';
    resultNotification(result);
  });
}

///////////////////////////////////////////////////////////////////////////////
// Uses Firebase Function to send a message to the selected device
// Only return error
// Adds sent message to history
///////////////////////////////////////////////////////////////////////////////

function sendMessage(selection, selectedDevice) {
  var functions = firebase.functions();
  var sendDataToFirebase = firebase.functions().httpsCallable('sendData');
  return sendDataToFirebase({ message: selection, selectedDevice: selectedDevice[0] })
    .then(function (res) {
      var error = '';
      if (!res.data.successCount) {
        if (result.data.results[0].error.code === 'messaging/registration-token-not-registered'
          || result.data.results[0].error.code === 'messaging/invalid-registration-token') {
          error = device_register_message;
        }
        else {
          error = unknown_error_message;
        }
      }
      addToHistory(selection, selectedDevice, error);
      return error;
    });
}

///////////////////////////////////////////////////////////////////////////////
// Stores a history entry object to Chrome storage
// Uses local Chrome storage because of size limitations
///////////////////////////////////////////////////////////////////////////////

function addToHistory(message, selectedDevice, error) {
  var entry = {
    'message': message,
    'selectedDevice': selectedDevice,
    'error': error,
  };

  chrome.storage.local.get('sentMessageHistory',
    function (items) {
      var messageHistory = items.sentMessageHistory ? items.sentMessageHistory : [];
      messageHistory.unshift(entry);
      chrome.storage.local.set({ 'sentMessageHistory': messageHistory });
    });
}

function displaySendWindow() {
  chrome.windows.create({
    'url': 'sendWindow.html',
    'type': 'popup',
    'width': contextPopupW,
    'height': contextPopupH,
    'left': contextPopupLeft,
    'top': contextPopupTop
  });
}

function displayAppWindow() {
  chrome.windows.create({
    'url': 'appWindow.html',
    'type': 'popup',
    'width': contextPopupW,
    'height': contextPopupH,
    'left': contextPopupLeft,
    'top': contextPopupTop
  });
}

function resultNotification(error) {
  var iconUrl = '/img/send_notification.png';
  var message = send_success_message;
  var notificationID = null;

  if (error) {
    message = error;
  }

  var notificationData = {
    'type': 'basic',
    'iconUrl': iconUrl,
    'title': 'Send to Device',
    'message': message
  };

  chrome.notifications.create(notificationData, function (notificationId) {
    notificationID = notificationId;
  });
}

function sendNotification() {
  var notificationID = null;
  var notificationMessage = message.substring(0, 159);
  var iconUrl = '/img/send_notification.png';
  var notificationData = {
    'type': 'basic',
    'iconUrl': iconUrl,
    'title': 'Send to Device',
    'message': notificationMessage,
    buttons: [
      { title: 'Send' },
      { title: 'Edit' }
    ]
  };

  chrome.notifications.create(notificationData, function (notificationId) {
    notificationID = notificationId;
  });

  chrome.notifications.onButtonClicked.addListener(function (nId, bId) {
    if (nId === notificationID) {
      if (bId === 0) {
        sendMessageFromNotification(message);
      } else if (bId === 1) {
        displaySendWindow();
      }
    }
  });
}

function displayPrompt() {
  chrome.notifications.getPermissionLevel(function (permissionLevel) {
    if (permissionLevel === 'granted') {
      sendNotification();
    }
    else {
      displaySendWindow();
    }
  });
}