  // Saves options to chrome.storage
function save_options() {
  var defaultDevice = 0;
  var radios = document.getElementById('deviceList');
  for (var i = 0; i < length.radios; i++){
    if (radios[i].checked){
      defaultDevice = radios[i].value;
      break;
    }
  }

  chrome.storage.sync.set({
      'defaultDevice': defaultDevice
    }, function() {
      var status = document.getElementById('status');
      console.log(defaultDevice);
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restore_options() {
    var deviceList;
    var defaultDevice = 0;

    chrome.storage.sync.get(['deviceList', 'defaultDevice'],
     function(items) {
      deviceList = items.deviceList;
      defaultDevice = items.defaultDevice;
      deviceList.forEach(function(item) {
        var choiceSelection = document.createElement('input');
        var choiceLabel = document.createElement('label');
        choiceSelection.setAttribute('type', 'radio');
        choiceSelection.setAttribute('name', item[0]);

        if (item[0] === defaultDevice) choiceSelection.checked = true;

        choiceLabel.innerHTML = item[1];
        choiceLabel.setAttribute('for', item[0]);

        document.getElementById('deviceList').appendChild(choiceSelection);
        document.getElementById('deviceList').appendChild(choiceLabel);
      });
    });

  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);