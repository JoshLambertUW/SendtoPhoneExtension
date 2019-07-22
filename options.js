var backgroundPage;
  
  // Saves options to chrome.storage
  function save_options() {
    var selection = document.getElementById("selectDevice");
    var defaultDevice = selection.options[selection.selectedIndex].value;
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

  function delete_device(){
    var selection = document.getElementById("selectDevice");
    var selectedDevice = selection.options[selection.selectedIndex].value;
    backgroundPage.deleteDevice(selectedDevice).then(function() {
      var status = document.getElementById('status');
      status.textContent = 'Device deleted';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  
  function restore_options() {
    backgroundPage = chrome.extension.getBackgroundPage();
    var select = document.getElementById("selectDevice");

    backgroundPage.deviceList.forEach(function(item, index) {
      var s = document.createElement("option");
      s.textContent = item[1];
      s.value = item[0];
      if (item[0] === backgroundPage.defaultDevice[0]) select.selectedIndex = index;
        select.add(s);
    });
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click',
      save_options);
  document.getElementById('delete').addEventListener('click',
      delete_device);

      