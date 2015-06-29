App.prototype.formatMoney = function (num) {
    num = parseFloat(num);
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