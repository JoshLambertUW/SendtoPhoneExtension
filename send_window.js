  var empty_message_error = "Please enter something to send";
  var empty_device_error = "Please choose a device";
  var backgroundPage;
  var deviceList = [];
  var defaultDevice;

  function startAuth(interactive) {
    if (firebase.auth().currentUser) {
      firebase.auth().signOut();
    }
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

  function sendDataFromWindow() {
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
      var result = await sendMessage(message, selectedDevice);
      if (result.results[0].error == null){
        status.textContent = send_success_message;
      }
      else {
        if (result.results[0].error.code === 'messaging/registration-token-not-registered' ||
        result.results[0].error.code === 'messaging/invalid-registration-token'){
          status.textContent = device_register_message;
        }
        else {
          status.textContent = unknown_error_message;
        }
      }
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
        document.getElementById('submitButton').addEventListener('click', sendDataFromWindow);
        document.getElementById('refreshDeviceButton').addEventListener('click', refreshDeviceList);
        var select = document.getElementById('selectDevice');

        chrome.storage.sync.get({'deviceList': deviceList, 'defaultDevice': 0},
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
          document.getElementById('submitButton').addEventListener('click', startAuth);
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
    firebase.initializeApp(config);
    initApp();
  }