App.prototype.formatMoney = function (num) {
    num = parseFloat(num.toString().replace(",",""));
    var p = num.toFixed(2).split(".");
    var chars = p[0].split("").reverse();
    var newstr = '';
    var count = 0;
    for (var x in chars) {
        count++;
        if (count % 3 === 1 && count !== 1 && chars[x] !== "-") {
            newstr = chars[x] + ',' + newstr;
        } else {
            newstr = chars[x] + newstr;
        }
    }
    return newstr + "." + p[1];
};

App.prototype.keyPad = function(id,display){
    //initialize a keypad on a specific element
    //load the keypad here
    //display is an id of an input text
    app.loadPage({
        load_url: app.pages.keypad,
        load_area: id,
        onload: function () {
          //initialize the keypad events
          var keys = $(".key");
          $.each(keys,function(x){
              var key = $(keys[x]);
              var keyVal = key.html();
              key.click(function(){
                  if(keyVal.indexOf("back.png") > -1){
                      //implement a backspace
                      var currVal = $("#"+display).val(); //09932
                      var newVal = currVal.substring(0, currVal.length - 1);
                      $("#"+display).val(newVal);
                  }
                  else if(keyVal.indexOf("cancel.png") > -1){
                      //clear everything
                      $("#"+display).val("");
                  }
                  else {
                     app.keyPadType(keyVal,display);  
                  }
                 
              });
          });
        }
    });
};

App.prototype.keyPadType = function(keyVal,display){
  //this is called when the keypad is touched
  var preVal = $("#"+display).val();
  $("#"+display).val(preVal+keyVal);
  
};

App.prototype.getDim = function(){
    var body = window.document.body;
    var screenHeight;
    var screenWidth;
    if (window.innerHeight) {
        screenHeight = window.innerHeight;
        screenWidth = window.innerWidth;
    }
    else if (body.parentElement.clientHeight) {
        screenHeight = body.parentElement.clientHeight;
        screenWidth = body.parentElement.clientWidth;
    }
    else if (body && body.clientHeight) {
        screenHeight = body.clientHeight;
        screenWidth = body.clientWidth;
    }
    return [screenWidth, screenHeight];   
};

App.prototype.getDate = function(){
	var d = new Date();
	var m = d.getMonth() + 1;
	var day = d.getDate();
	m = m < 10 ? "0"+m : m;
	day = day < 10 ? "0"+day : day;
	var y = d.getFullYear();
	return y+"-"+m+"-"+day;
};