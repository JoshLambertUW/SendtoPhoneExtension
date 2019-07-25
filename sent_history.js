var clear_success_message = "Message history cleared!";
var messageHistory;

function generateTable() {
  var table = document.getElementById("history");

  chrome.storage.local.get('sentMessageHistory',
    function (items) {
      messageHistory = items.sentMessageHistory ? items.sentMessageHistory : [];

      messageHistory.forEach(function (item, index) {
        let row = table.insertRow();
        let deviceCell = row.insertCell();
        let deviceText = document.createTextNode(item['selectedDevice'][1]);
        deviceCell.appendChild(deviceText);
        let msgCell = row.insertCell();
        let msgText = document.createTextNode(item['message']);
        msgCell.appendChild(msgText);
        let successCell = row.insertCell();
        if (item['error'] == null || item['error'].length === 0) {
          let successText = document.createTextNode('\u2714');
          successCell.appendChild(successText);
        }
        else {
          let resendButton = document.createElement('button');
          let span = document.createElement('span');
          resendButton.setAttribute('type', 'button');
          span.innerHTML = "Resend";
          resendButton.appendChild(span);
          successCell.appendChild(resendButton);
          resendButton.addEventListener('click', () => resendMessage(index));
          let errorCell = row.insertCell();
          let errorText = document.createTextNode(item[error]);
          errorCell.appendChild(errorText);
        }
        let deleteCell = row.insertCell();
        let deleteButton = document.createElement('button');
        let span = document.createElement('span');
        deleteButton.setAttribute('type', 'button');
        span.innerHTML = "Delete";
        deleteButton.appendChild(span);
        deleteCell.appendChild(deleteButton);
        deleteButton.addEventListener('click', () => deleteMessage(index));
      });
    });
}

function resendMessage(index) {
  var status = document.getElementById('status');
  if (messageHistory.length < index) {
    var message = messageHistory[index];
  }
  deleteMessage(index);
  sendMessage(message['message'], message['selectedDevice'],
    message['selectedDeviceID'])
    .then(function (result) {
      if (result) {
        status.textContent = result;
      }
      else {
        status.textContent = send_success_message;
      }
    });
}

function clearHistory() {
  status.textContent = clear_success_message;
}

function deleteMessage(index) {
  messageHistory.splice(index, 1);
  chrome.storage.local.set({ 'sentMessageHistory': messageHistory });
  var status = document.getElementById('status');
  status.textContent = 'Message deleted from history!';
}

window.onload = function () {
  generateTable();
  document.getElementById('clear').addEventListener('click',
    clearHistory);
}
