  var empty_message_error = "This field is required";
  var empty_device_error = "Please choose a device";
  var backgroundPage;
  var deviceList = [];
  var defaultDevice;

  var config = {  
    apiKey: "AIzaSyDHNpI-fbFqUYhumIOY3zVRP_dfZCpw2LY",
    authDomain: "sendtophone.firebaseapp.com",
    databaseURL: "https://sendtophone.firebaseio.com",
    projectId: "sendtophone",
    storageBucket: "sendtophone.appspot.com",
    messagingSenderId: "926700184689",
    appId: "1:926700184689:web:096c91250c3d677a"
  };

  function startAuth(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
      if (chrome.runtime.lastError && !interactive) {
        console.log('It was not possible to get a token programmatically.');
      } else if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (token) {
        // Authorize Firebase with the OAuth Access Token.
        var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
        firebase.auth().signInAndRetrieveDataWithCredential(credential).catch(function(error) { 
          // The OAuth token might have been invalidated. Lets' remove it from cache.
          if (error.code === 'auth/invalid-credential') {
            chrome.identity.removeCachedAuthToken({token: token}, function() {
              startAuth(interactive);
            });
          }
        });
        console.log(firebase.auth().currentUser.uid);
      } else {
        console.error('The OAuth Token was null');
      }
    });
  }

  function startSignIn() {
    if (firebase.auth().currentUser) {
      firebase.auth().signOut();
    } else {
      startAuth(true);
    }
  }

  function sendDataFromWindow() {
    var sendDataToFirebase = firebase.functions().httpsCallable('sendData');
    var status = document.getElementById('status');
    var message = document.getElementById("input").value;
    var select = document.getElementById("selectDevice");
    var selectedDevice = select.options[select.selectedIndex].value;

    if (message == ""){
      status.textContent = empty_message_error;
    }
    else if (selectedDevice == null){
      status.textContent = empty_device_error;
    }
    else {
      sendDataToFirebase({message: message,
        selectedDevice: selectedDevice}).then(function(result) {
        if (result.data.success){
          status.textContent = send_success_message;
        }
      }).catch(function(error) {
        if (error.code === 'messaging/registration-token-not-registered' 
          || error.code === 'messaging/invalid-registration-token'){
            status.textContent = device_register_message;
        }
        else {
          status.textContent = unknown_error_message;
        }
      });
    }

  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace == "sync" && "deviceList" in changes) {
        deviceList = changes.deviceList.newValue;
        var select = document.getElementById('selectDevice').innerHTML = "";
        deviceList.forEach(function(item, index) {
          var s = document.createElement("option");
          s.textContent = item[1];
          s.value = item[0];
          if (item[0] === items.defaultDevice) select.selectedIndex = index;
          select.appendChild(s);
        });
    }
  });

  function initApp(){
    var db = firebase.firestore();

    backgroundPage = chrome.extension.getBackgroundPage();
    if (backgroundPage.message != null && backgroundPage.message != ""){
      document.getElementById("input").value = backgroundPage.message;
    }

    firebase.auth().onAuthStateChanged(function(user) {
      if (user != null) {
        console.log(user.uid);
        var uid = user.uid;
        var currentUser = user;
        document.getElementById('submitButton').textContent = 'Send to device';
        document.getElementById('submitButton').addEventListener('click', dataFromWindow);
        document.getElementById('refreshDeviceButton').addEventListener('click', refreshDeviceList);
        var select = document.getElementById('selectDevice');
        
        chrome.storage.sync.get([{'deviceList': deviceList}, {'defaultDevice' : 0}],
          function(items) {
            if (items.defaultDevice === 0 && items.deviceList.length === 0){
              display_app_window();
              return;
            }
            defaultDevice = (items.defaultDevice === 0) ? items.deviceList[0][0]:items.defaultDevice;
            deviceList = items.deviceList;
            deviceList.forEach(function(item, index) {
              var s = document.createElement("option");
              s.textContent = item[1];
              s.value = item[0];
              if (item[0] === defaultDevice) select.selectedIndex = index;
              select.appendChild(s);
            });
          });
        } else {
          document.getElementById('submitButton').textContent = 'Sign-in with Google';
          document.getElementById('submitButton').addEventListener('click', startSignIn);
        }
      });

    document.getElementById('optionsButton').addEventListener('click', function() {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });

  }
  
  window.onload = function() {
    initApp();
  }