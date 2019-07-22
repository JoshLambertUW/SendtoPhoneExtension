  var pageContextTitle = 'Send current page to phone';
  var selectionContextTitle = 'Send text to phone';
  var linkContextTitle = 'Send link to phone';

  var message;
  var defaultDevice;
  var deviceList;

  function setUpContextMenu(){
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

  chrome.runtime.onInstalled.addListener(function() {
    setUpContextMenu();
    firebase.initializeApp(config);
  });

  chrome.contextMenus.onClicked.addListener(function(itemData, tab) {
    var selection = itemData.selectionText;

    if (selection != null && selection != ''){
      message = selection;
    }
    else if (itemData.linkUrl){
      message = itemData.linkUrl;
    }
    else if (itemData.pageUrl){
      message = itemData.pageUrl;
    }
    
    displayPrompt();
  });

  function getDefaultDevice(){
    return new Promise(function(resolve, reject){
      chrome.storage.sync.get({'defaultDevice' : []},
      function(items) {
        if (deviceList == null || deviceList.length === 0){
          getDeviceList().then(function(){
            defaultDevice = deviceList[0];
            resolve();
          });
        }
        defaultDevice = (items.defaultDevice.length === 0) ? deviceList[0] : items.defaultDevice;
        resolve();
      });
    })
  }

  function getDeviceList(){
    return new Promise(function(resolve, reject){
      chrome.storage.sync.get({'deviceList' : []}, 
      function(items) {
        if (items.deviceList.length === 0){
          displayAppWindow();
          reject();
        }
        deviceList = items.deviceList;
        resolve();
      });
    })
  }

  function refreshDeviceList(){
    var db = firebase.firestore();
    var user = firebase.auth().currentUser; 
    var deviceFound = false;
    var updatedDeviceList = [];

    return db.collection('users').doc(user.uid).collection('devices').get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          var device = [doc.id, doc.get('deviceName')];
          updatedDeviceList.push(device);
        });

        if (defaultDevice.length > 0){
          for (var device of updatedDeviceList){
            if (device[0] === defaultDevice[0]){
              deviceFound = true;
              break;
            }
          }
        }
        chrome.storage.sync.set({'deviceList': updatedDeviceList});
        if (!deviceFound) chrome.storage.sync.set({'defaultDevice': updatedDeviceList[0]});
    });
  }
  
  function deleteDevice(selectedDevice) {
    var functions = firebase.functions();
    var deleteDeviceFromFirebase = firebase.functions().httpsCallable('deleteDevice');
    chrome.storage.sync.set({'defaultDevice': []});
    getDefaultDevice();
    return deleteDeviceFromFirebase({selectedDevice: selectedDevice[0]});
  }



