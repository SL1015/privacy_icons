/*
This file stores the annotations in the website local storage, and send them to the background.js.
*/

/*
This function gets the message from popup.js, and write it to the local storage.
Input: website domain and annotations, type:dict
Output: website domain and annotations,type: JSON
*/
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
    console.log(msg);
    console.log(JSON.stringify(msg));
    window.localStorage.setItem('new_info', JSON.stringify(msg));
    sendResponse('write to local storage successfully');
});

//Sends the website information in local storage to the background.js.
var get_new_info = window.localStorage.getItem('new_info');
chrome.runtime.sendMessage(get_new_info, function(response) {
    console.log(response);
  });

if(window.localStorage){
	console.log(window.localStorage.getItem('new_info'));
}else{
	console.log('no');
}
