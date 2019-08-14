var pageContextTitle = 'Send current page to phone';
var selectionContextTitle = 'Send text to phone';
var linkContextTitle = 'Send link to phone';

var message;
var defaultDevice;
var deviceList;

function setUpContextMenu() {
  chrome.contextMenus.create({
    title: pageContextTitle,
    type: 'normal',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    title: selectionContextTitle,
    type: 'normal',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    title: linkContextTitle,
    type: 'normal',
    contexts: ['link'],
  });
}

chrome.runtime.onInstalled.addListener(function () {
  setUpContextMenu();
  firebase.initializeApp(config);
});

chrome.contextMenus.onClicked.addListener(function (itemData, tab) {
  var selection = itemData.selectionText;

  if (selection != null && selection != '') {
    message = selection;
  }
  else if (itemData.linkUrl) {
    message = itemData.linkUrl;
  }
  else if (itemData.pageUrl) {
    message = itemData.pageUrl;
  }
  displayPrompt();
});

///////////////////////////////////////////////////////////////////////////////
// Return a promise when default device is retrieved from Chrome storage.
// If we don't have a list of devices already, then default device ID
// may not be valid and we will retrieve device list.
// If default device is missing or invalid, default to first device on list.
///////////////////////////////////////////////////////////////////////////////

function getDefaultDevice() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get({ 'defaultDevice': [] },
      function (items) {
        if (deviceList == null || deviceList.length === 0) {
          getDeviceList().then(function () {
            defaultDevice = deviceList[0];
            resolve();
          });
        }
        defaultDevice = (items.defaultDevice.length === 0) ? deviceList[0] : items.defaultDevice;
        resolve();
      });
  })
}

///////////////////////////////////////////////////////////////////////////////
// Return a promise when device list is retrieved from Chrome storage.
// If we don't have any devices, then promise is rejected and
// window with troubleshooting and link to Android application is launched.
///////////////////////////////////////////////////////////////////////////////

function getDeviceList() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get({ 'deviceList': [] },
      function (items) {
        if (items.deviceList.length === 0) {
          displayAppWindow();
          reject();
        }
        deviceList = items.deviceList;
        resolve();
      });
  })
}

///////////////////////////////////////////////////////////////////////////////
// Retrieves fresh array of devices from Firebase Firestore.
// Saves device objects as [Device ID, Device name].
// Also checks if default device is still valid. 
// If not will default to first device.
///////////////////////////////////////////////////////////////////////////////

function refreshDeviceList() {
  var db = firebase.firestore();
  var user = firebase.auth().currentUser;
  var deviceFound = false;
  var updatedDeviceList = [];

  return db.collection('users').doc(user.uid).collection('devices').get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        var device = [doc.id, doc.get('deviceName')];
        updatedDeviceList.push(device);
      });
      if (updatedDeviceList.length == 0) return;
      
      if (defaultDevice.length > 0) {
        for (var device of updatedDeviceList) {
          if (device[0] === defaultDevice[0]) {
            deviceFound = true;
            break;
          }
        }
      }
      chrome.storage.sync.set({ 'deviceList': updatedDeviceList });
      if (!deviceFound) chrome.storage.sync.set({ 'defaultDevice': updatedDeviceList[0] });
    });
}

///////////////////////////////////////////////////////////////////////////////
// Runs Firebase Function to delete device from Firestore database
// Deletes device information, FCM token, and pending messages
// Device will be added again upon login on Android app
// Refreshes device list when done
///////////////////////////////////////////////////////////////////////////////

function deleteDevice(selectedDevice) {
  var functions = firebase.functions();
  var deleteDeviceFromFirebase = firebase.functions().httpsCallable('deleteDevice');
  refreshDeviceList();
  return deleteDeviceFromFirebase({ selectedDevice: selectedDevice[0] });
}



