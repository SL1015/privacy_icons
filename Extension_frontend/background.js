//The script receives and stores the annotations in website local storage sent from content.js, facilitating popup.js to get them directly.


var anno_to_pop;
var info_domain;
/*
The function reives the domain and annotations sent from content.js, and stores then in variable info_domain and anno_to_pop respectively.
popup.js can call these variable directly.
Input: website information, type: JSON
Output: domain and annotations, type: string, array
*/
chrome.runtime.onMessage.addListener(function(info, sender, sendResponse){
    console.log(info);
    if (info != null){
        var new_info = JSON.parse(info);
        console.log(new_info);
        info_domain = new_info.domain;
        anno_to_pop = new_info.annotations;
        console.log(anno_to_pop[0]);
        
    }else{
        anno_to_pop = null;
    };
    console.log(anno_to_pop);
    sendResponse('received');

});

