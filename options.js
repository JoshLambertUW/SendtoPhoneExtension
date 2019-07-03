  // Saves options to chrome.storage
function save_options() {
  var selection = document.getElementById("selectDevice");
  var defaultDevice = selection.options[selection.selectedIndex].value;
  console.log(defaultDevice);
  chrome.storage.sync.set({
      'defaultDevice': defaultDevice
    }, function() {
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  function restore_options() {
    var deviceList = [];
    var defaultDevice;
    chrome.storage.sync.get({'deviceList': deviceList, 'defaultDevice': 0},
     function(items) {
      deviceList = items.deviceList;
      defaultDevice = items.defaultDevice;
      var select = document.getElementById("selectDevice");

      deviceList.forEach(function(item, index) {
        var s = document.createElement("option");
        s.textContent = item[1];
        s.value = item[0];
        if (item[0] === defaultDevice) select.selectedIndex = index;
        select.add(s);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);