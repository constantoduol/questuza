App.prototype.keyPadField = "";

App.prototype.formatMoney = function (num) {
    num = parseFloat(num.toString().replace(",", ""));
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

App.prototype.setupKeyPadField = function(field){
    $("#"+field).focus(function(){
        app.keyPadField = field;
    });
};

App.prototype.keyPad = function (id) {
    //initialize a keypad on a specific element
    //load the keypad here
    //display is an id of an input text
    app.loadPage({
        load_url: app.pages.keypad,
        load_area: id,
        onload: function () {
            //initialize the keypad events
            var keys = $(".key");
            $.each(keys, function (x) {
                var key = $(keys[x]);
                var keyVal = key.html();
                key.click(function () {
                    if (keyVal.indexOf("back.png") > -1) {
                        //implement a backspace
                        var currVal = $("#" + app.keyPadField).val(); //09932
                        var newVal = currVal.substring(0, currVal.length - 1);
                        $("#" + app.keyPadField).val(newVal);
                    }
                    else if (keyVal.indexOf("cancel.png") > -1) {
                        //clear everything
                        $("#" + app.keyPadField).val("");
                    }
                    else {
                        app.keyPadType(keyVal, app.keyPadField);
                    }

                });
            });
        }
    });
};

App.prototype.keyPadType = function (keyVal, display) {
    //this is called when the keypad is touched
    var preVal = $("#" + display).val();
    $("#" + display).val(preVal + keyVal);

};

App.prototype.getDim = function () {
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

App.prototype.getDate = function(offset){
    offset = !offset ? 0 : offset;
    var offsetMillis = offset * 24 * 60 * 60 * 1000;
    var time = Date.now() + offsetMillis;
    var d = new Date(time);
    var m = d.getMonth() + 1;
    var day = d.getDate();
    m = m < 10 ? "0" + m : m;
    day = day < 10 ? "0" + day : day;
    var y = d.getFullYear();
    return y + "-" + m + "-" + day;
    
};




App.prototype.fetchItemById = function (options) {
    var request = {
        database: options.database,
        table: options.table,
        column: options.column,
        where: options.where()
    };
    app.xhr(request, app.dominant_privilege, "fetch_item_by_id", {
        load: false,
        success: function (data) {
            options.success(data);
        }
    });
};


App.prototype.newGrid = function (options) {
    //data is loaded row by row
    //however we can convert to column by column
    //e.g. [[0,1,2,3],[0,3,4,5]] is treated as row one then row two
    var rows;
    if(options.load_column_by_column){
        //transform col data to row data here
        rows = [];
        for(var x = 0; x < options.init_data[0].length; x++){
            rows.push([]);
            for(var y = 0; y < options.col_names.length; y++){
                rows[x].push(options.init_data[y][x]);
            }
        }
    }
    //if rows is undefined use init_data
    var initData = !rows ? options.init_data : rows;
    var container = $("#" + options.id);
    container.handsontable({
        data: initData,
        rowHeaders: true,
        colHeaders: options.col_names,
        contextMenu: false,
        columns: options.col_types(),
        width: app.getDim()[0]+"px",
        manualColumnResize: true,
        allowInvalid: false,
        afterChange: function (changes, source) {
            if (!changes) return;

            if (source === "edit" || source === "autofill") {
                //track edits only
                $.each(changes,function(x){
                    var row = changes[x][0];
                    var col = changes[x][1];
                    var oldValue = changes[x][2];
                    var newValue = changes[x][3];
                    options.onEdit(row, col, oldValue, newValue); 
                });
            }

        },
        cells: function (row, col, prop) {
            var cellProperties = {};
            if(options.disabled && options.disabled.indexOf(col) > -1){
                cellProperties.readOnly = true; 
                cellProperties.renderer = function(instance, td, row, col, prop, value, cellProperties){
                    Handsontable.TextCell.renderer.apply(this, arguments);
                    td.style.fontWeight = 'bold';
                    td.style.color = 'black';
                    td.style.fontStyle = 'normal';
                    td.innerHTML = value;
                    return cellProperties;
                };
            }
            return cellProperties;
        }
    });

};

App.prototype.formatDate = function(date,noTime,longDate,timeOnly){
    var format = app.getSetting('date_format');
    if(noTime) date = date + " 00:00:00";
    if(longDate) format = format + " HH:mm:ss";
    if(timeOnly) format = "HH:mm:ss";
    return DateFormat.format.date(date,format);
};

App.prototype.fetchSettings = function () {
    app.xhr({}, "open_data_service", "fetch_settings", {
        load: false,
        success: function (resp) {
            var r = resp.response.data;
            localStorage.setItem("settings", JSON.stringify(r));
        }
    });
};
