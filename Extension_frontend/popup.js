/*
This file includes functions and operations behind the interface defined by ‘popup.html’. The function ‘website_setting’ detects whether the current website is in our lists and takes respective operations. 
The function ‘user_setting’ obtains users’ preferences saved in ‘options.html’ and displays them in the icon form.
*/

/*
This function directs users to the options interface once they click the 'Change my preference' button.
*/
document.querySelector('#setting').addEventListener('click', function (event) {
	if (chrome.runtime.openOptionsPage) {
		chrome.runtime.openOptionsPage();
	} else {
		window.open(chrome.runtime.getURL('options.html'));
	}
});

/*
Once the popup interface is loaded, automatically executes functions of each panel
Input: current website page
Output: Corresponding operations and interfaces based on current page
*/
var flag = 0; // The check result of local browser storage
var hostname_0;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	var tab = tabs[0];
	var url = new URL(tab.url);
	var hostname_test = url.hostname;

	host_s = hostname_test.split('.', 1)
	if (host_s == "www") { //Address the issue of url beginning with 'www'
		hostname = hostname_test.replace("www.", "");
		hostname_0 = hostname_test;
	}
	else {
		hostname = hostname_test;
		hostname_0 = hostname_test;
	}
	console.log(hostname);// `hostname` now has a value like 'example.com'
	//Execute functions that control each panel
	user_setting();
	exist_local(hostname_0);
	website_setting();
	
});

/*
First step: search if the annotation of the webiste is in the local storage. Annotation is returned only when the domain of the current web page matches the domain of localstorage.
Input: hostname: url of the website
Output: annotation (flag = 1) or None (flag = 0)
*/
function exist_local(hostname_0) {
	var bg = chrome.extension.getBackgroundPage();
	console.log(bg)
	var anno_local = bg.anno_to_pop;
	var domain_local = bg.info_domain;
	console.log(anno_local);
	if (anno_local == null){
		
	}
	else{
		console.log(anno_local);
		console.log(domain_local);
		console.log(hostname_0);
		if (anno_local != null && domain_local == hostname_0) {
			console.log(hostname_0);
			var wpanel = document.getElementById('webpanel');
			var frag_w = document.createDocumentFragment();

			for (i = 0; i < anno_local.length; i++) {
				var li = document.createElement("li");
				var Img = document.createElement("img");
				lab = anno_local[i];
				li.innerHTML = lab;
				Img.src = "/icons/" + lab + ".svg";
				Img.style.width = 120 + "px";
				Img.style.height = 80 + "px";
				frag_w.appendChild(Img);
				frag_w.appendChild(li);
			}
			wpanel.appendChild(frag_w);
			flag = 1;
			console.log(flag);
		}

	}
	
}

/*
Second step: search if the website is in the primary table
Input: 
	wpanel: the website panel element
	frag_w: the icon container element
	arr_dom: list of website domain urls in the 900_annotations file
	arr_lab: annotation list
	hostname: the website domain url
Output: annotation or None 
*/
function exist_900(wpanel, frag_w, arr_dom, arr_lab, hostname) {
	var ind = arr_dom.indexOf(hostname)
	var len_label = arr_lab[ind].length
	console.log(`label ${len_label}`)
	for (j = 0; j < len_label; j++) {
		var li = document.createElement("li");
		var Img = document.createElement("img");
		lab = arr_lab[ind][j];
		Img.src = "/icons/" + lab + ".svg";
		Img.style.width = 120 + "px";
		Img.style.height = 80 + "px";
		li.innerHTML = lab;
		frag_w.appendChild(Img);
		frag_w.appendChild(li);
	}
	wpanel.appendChild(frag_w);
}

/*
Third step: send request to the back end to check if it is in the back-end data set
Input:
	hostname: the website domain url
	wpanel: the website panel element
	frag_w: the icon container element	
Output: annotation or None
*/
function query_be(hostname_0, wpanel, frag_w) {
	//query the backend file 
	query_url = 'https://ppi.ifi.uzh.ch/backend/query' + '?query=' + hostname_0;
	var x = new XMLHttpRequest();
	x.open('GET', query_url);
	//var query_data = JSON.stringify({"query": hostname_0});
	//console.log(query_url);
	x.send();
	console.log('query success')
	//x.responseType = 'json'; //do not set it as 'json'!!!
	x.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			var response = JSON.parse(x.responseText);
			if (response == 'no') {
				nonexist_be(frag_w, wpanel);
			}

			// put icons process here
			else {
				console.log(response.length);
				if (response.length == 0) {
					var li = document.createElement("li");
					li.innerHTML = "Sorry, we have some problems with analyzing this website, please check it later!";
					frag_w.appendChild(li);
				}
				else{
					for (let j = 0; j < response.length; j++) {
						var li = document.createElement("li");
						var Img = document.createElement("img");
						Img.src = "/icons/" + response[j] + ".svg";
						Img.style.width = 120 + "px";
						Img.style.height = 80 + "px";
						li.innerHTML = response[j];
						frag_w.appendChild(Img);
						frag_w.appendChild(li);
					}
					//save this repsonse from the back end to local storage
					new_info = {
						"domain": hostname_0,
						"annotations": response
					};
					//send it to the background.js
					chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
						var tab = tabs[0];
						chrome.tabs.sendMessage(tab.id, new_info, function (response) {
							console.log(new_info);
							console.log(response);
						});
					});
	
				}
				
				wpanel.appendChild(frag_w);

			}
		}

	}
}

/*
The final step: ask users to provide URL of the privacy policy
Input: 
	wpanel: the website panel element
	frag_w: the icon container element	
Output: Annotation returned from the back end
*/
function nonexist_be(frag_w, wpanel) {

	//'not yet analyzed!' prcoess here
	var p = document.createElement("p");
	var form = document.createElement("form");
	form.method = "POST";
	var input_box = document.createElement("input");
	input_box.style.width = "100px";
	input_box.id = 'unknown_url';
	form.appendChild(input_box);

	var input_button = document.createElement("button");
	p.innerHTML = "The website is not in our list. Feel free to update us about the privacy policy link!";
	input_button.type = "button";
	input_button.innerHTML = "Submit";
	input_button.id = 'submit';

	input_button.onclick = function () {
		var url = document.getElementById("unknown_url").value;
		alert('Thanks for your submission! Please refresh the extension page to get icons in 3 minutes.')
		analyze_url = 'https://ppi.ifi.uzh.ch/backend/' + '?analyze=' + url;
		var xhttp = new XMLHttpRequest();
		console.log(analyze_url);
		xhttp.open('GET', analyze_url);
		xhttp.send();
		xhttp.onreadystatechange = function () {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				annotations = xhttp.response;
				console.log(annotations);
				new_info = {
					"domain": hostname_0,
					"annotations": annotations
				};


				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					var tab = tabs[0];
					chrome.tabs.sendMessage(tab.id, new_info, function (response) {
						console.log(new_info);
						console.log(response);
					});
				});

			}
		}

	}

	frag_w.appendChild(p);
	frag_w.appendChild(form);
	frag_w.appendChild(input_button);
	wpanel.appendChild(frag_w);
}

/*
The function that organize the above functions logically
Input: None
Output: the inserted website setting panel 
*/
function website_setting() {
	//let fileHandle;
	if (flag == 1) {

	} else {
		var json_url = "900_annotations.json";
		var request_j = new XMLHttpRequest();
		request_j.open("get", json_url);
		request_j.send(null);
		request_j.onload = function () {
			if (request_j.status == 200) {

				var content = request_j.responseText
				var json = JSON.parse(content);
				var wpanel = document.getElementById('webpanel');
				var frag_w = document.createDocumentFragment();
				arr_dom = [];
				arr_lab = [];
				json.websites.forEach(function (item) {
					arr_dom.push(item.domain);
					arr_lab.push(item.annotations);
				})
				switch (arr_dom.includes(hostname)) { 
					case true:
						exist_900(wpanel, frag_w, arr_dom, arr_lab, hostname);
						break;
					case false:
						query_be(hostname_0, wpanel, frag_w);
						break;
				}

			}

		}
	}

}

/*
The function that operates the user preference panel
Input: None
Output: the inserted user_setting panel
*/
function user_setting() {
	var frag = document.createDocumentFragment();
	var ary = new String();
	//Get the options from storage
	chrome.storage.sync.get('setting', function (pre) {
		ary = pre.setting;
		//arymust be in function
		var label;
		label = document.getElementsByName('data');
		//console.log(ary);
		ary = ary.split(",");

		var imgSrcs = [];
		//display the icon
		for (var i = 0; i < ary.length; i++) {

			if (ary[i] == 'y') {
				continue;
			}
			else {
				var bigImg = document.createElement("img");
				bigImg.src = "/icons/" + ary[i] + ".svg";
				bigImg.style.width = 120 + "px";
				bigImg.style.height = 80 + "px";
				imgSrcs.push(bigImg.src);
				var li = document.createElement("li");
				li.innerHTML = ary[i];
				frag.appendChild(bigImg);
				frag.appendChild(li);
			}

		}
		var myul = document.getElementById('userpanel');
		myul.appendChild(frag);
		console.log(frag);
		console.log(myul);
	})
}

