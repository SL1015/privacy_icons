/* This file mainly supports functions and operations behind the interface ‘option.html’, which provides preference selection and save actions. 
*/

/*Save the choices

Key variables
	ary: list of state of choices: checked or no. Default setting is all not checked.
 */
chrome.storage.sync.get('setting',function(pre){
	var ary = pre.setting;
	console.log(ary);
	var label;
    label = document.getElementsByName('data');
	//Initialize the choice storage
    if(ary==null) 
    {
        ary = "y,y,y,y,y,y,y,y,y,y,y,y,y,y,y,y,y,y,y,y"
    }
    ary = ary.split(",");//or it will consider the array as a string
    for (var i = 0; i < label.length; i++){
        
        for (var j = 0; j < ary.length; j++)
		{
			if (label[i].getAttribute("value") == ary[j])
			{
                label[i].setAttribute("checked", "checked");
				break;
            }
        }
    }
    

})
/*Button onclick function, execute the data transmission from the inteface to the storage as users click the save button

Key variables
	arr/arrType: list of state of choices get from the html interface.
 */
$("#Save").click(function() {
	
	var arr = new Array();
	$("input:checkbox[name='data']:checked").each(function() {
		arr.push($(this).val()); //add element
	}); //get all checked value
	
	arrType = arr.join(','); //store the value in an array
	//alert(arrType);
	
	$.ajax({
		url: "options.html",
		data: {
			//deviceId : [1,2,3,4]
			deviceId: arrType
		},
		type: "GET",
		success: function(data) {console.log(data);},//
		error: function(err) {
			console.log(err);
		}
	})
	
	//Save the choices list to the chrome storage with chrome.storage.sync.set
	if(arrType){
		chrome.storage.sync.set({'setting': arrType}, function(){
			var status = document.getElementById('status');
	  		status.textContent = 'Options saved.';
	  		setTimeout(function() {
			status.textContent = '';
	  		}, 750);
	  		alert('Options saved.');
			close();})
	}
})
