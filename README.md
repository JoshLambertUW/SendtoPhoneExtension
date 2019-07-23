# Send to Phone | Chrome Extension

A lightweight Google Chrome extension that can quickly send text data between devices. Useful for sending links, text excerpts from web pages, and notes to Android devices.

* Notifications and most data are sent using Firebase Cloud Messaging
* Back end is hosted using Firebase functions
* If data exceeds FCM limit, it is temporarily saved to a Firebase Firestore document
* Unused accounts are cleared using a scheduled function
* Uses Google Authentication

Used with the Send to Phone Android app.

## Getting Started

### Prerequisites

* Google Chrome
* An Android device with the Send to Phone application installed
* A Google account

### Installing

This repo can be cloned and installed as a Chrome extension in developer mode.

```
To install, go to the Chrome menu -> More tools -> Extensions. Enable developer mode and use "load unpacked".
```

If you haven't logged in on Android, you will be prompted to download the app

## Deployment

If you would like to host the extension yourself, you will need:

1. Create a new Chrome extension in the Chrome Web Store Developer Dashboard
2. Replace the key in manifest.json with your new public key
3. Add a new project in the Firebase console
4. Click Add app and add your extension
5. Replace the the config values found in send_data.js with your values
6. Go to Authentication -> Sign-in method -> Google
7. Replace the client_id in manifest.json with your Web client ID
