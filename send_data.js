var contextPopupW = ~~(screen.width/3);
var contextPopupH = ~~(screen.height/4);
var contextPopupLeft = ~~(screen.width * 0.3);
var contextPopupTop = ~~(screen.height * 0.4); 

var config = {  
  apiKey: "AIzaSyCTo-abXllUjzoL2ZkIUMJ7kFZlvsFBBmI",
  authDomain: "sendtophone.firebaseapp.com",
  databaseURL: "https://sendtophone.firebaseio.com",
  projectId: "sendtophone",
  storageBucket: "sendtophone.appspot.com",
  messagingSenderId: "926700184689",
  appId: "1:926700184689:web:096c91250c3d677a"
};

firebase.initializeApp(config);
var db = firebase.firestore();
var user = firebase.auth().currentUser;

  //toDo: Device selection
  //toDo: check if devices > 1
  
  function send_data(selection, device) {
    var user = firebase.auth().currentUser; 
    if (user != null) {
      console.log(user.uid);
      db.collection('users').doc(user.uid).collection('devices').get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            console.log(doc.id, " => ", doc.get('deviceName'));
        });
      });
    }
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
 
/*
      docRef.get().then(function(doc) {
        if (doc.exists) {
          docRef.update({
            messages: firebase.firestore.FieldValue.arrayUnion(selection)
          });
        } else {
          firebase.firestore().collection('users').doc(user.uid).collection('devices').doc(device).set({
            messages: [selection],
          });
        }
      }).catch(function(error) {
        console.log("Error getting document:", error);
      });
    }
    */

  function display_window(){

    chrome.windows.create({'url': 'sendWindow.html', 
      'type': 'popup', 
      'width': contextPopupW, 
      'height': contextPopupH, 
      'left': contextPopupLeft, 
      'top': contextPopupTop});
  }

  function display_notification(){
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
            send_data(message, 0);
          } else if (bId === 1) {
            display_window();
          }
      }
    });
  }

  function display_prompt(){
    chrome.notifications.getPermissionLevel(function (permissionLevel) {
      if (permissionLevel === 'granted') {
        display_notification();
      }
      else {
        display_window();
      }
    });
  }