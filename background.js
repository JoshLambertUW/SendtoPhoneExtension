  var pageContextTitle = 'Send current page to phone';
  var selectionContextTitle = 'Send text to phone';
  var linkContextTitle = 'Send link to phone';

  var message;

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
    
    display_prompt();
  });