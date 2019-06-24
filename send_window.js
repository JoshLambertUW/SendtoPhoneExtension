  var empty_message_error = "This field is required";
  var backgroundPage;
  var deviceList;

  var config = {  
    apiKey: "AIzaSyCTo-abXllUjzoL2ZkIUMJ7kFZlvsFBBmI",
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

  function dataFromWindow(){
    var message = document.getElementById("input").value;

    if (message == ""){
      document.getElementById("input").value = empty_message_error;
    }
    else {
      backgroundPage.send_data(message, 0);
    }
  }

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace == "sync" && "deviceList" in changes) {
        deviceList = changes.deviceList.newValue;
        var select = document.getElementById('selectDevice').innerHTML = "";
        deviceList.forEach(function(item) {
          var el = document.createElement("option");
          el.textContent = item[1];
          select.appendChild(el);
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
        refreshDeviceList();
        console.log(user.uid);
        var uid = user.uid;
        var currentUser = user;
        document.getElementById('submitButton').textContent = 'Send to device';
        document.getElementById('submitButton').addEventListener('click', dataFromWindow);
        var select = document.getElementById('selectDevice');
        
        chrome.storage.sync.get('deviceList', function(items) {
          deviceList = items.deviceList;
          console.log(deviceList.length);
          deviceList.forEach(function(item) {
            var el = document.createElement("option");
            el.textContent = item[1];
            select.appendChild(el);
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