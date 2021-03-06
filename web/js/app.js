
function App() {
    this.appData = new AppData();
    this.pages = {};
    this.platform = "web";
    this.context = null;
    this.sub_context = {};
    this.current_page = "";
    this.ui = new UI();
    this.dominant_privilege = "";
    this.savedState = "";
    this.server = "/server";
    this.platform = this.isMobile() ? "mobile" : "web";
}

App.prototype.isMobile = function(){
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
        return true;
    return false;
};



App.prototype.xhr = function (data, svc, msg, func) {
    var request = {};
    var sesId = localStorage.getItem("session_id");
    request.request_header = {};
    request.request_header.request_svc = svc;
    request.request_header.request_msg = msg;
    request.request_header.session_id = sesId;
    request.request_object = data;
    if (func.load) {
        var loadArea = $("#" + app.context.load_area);
        var loader = $("<img src='img/loader.gif'>");
        loadArea.html(loader);
    }
    return $.ajax({
        type: "POST",
        url: app.server,
        data: "json=" + encodeURIComponent(JSON.stringify(request)),
        dataFilter: function (data, type) {
            if (func.load) {
                loadArea.html("");
            }
            var data = JSON.parse(data);
            if (data.request_msg === "auth_required") {
                window.location = "index.html";
            }
            return data;
        },
        success: function(data){
            if(func.success) func.success(data,request.request_object);
        },
        error: function(err){
            if (func.load) {
                loadArea.html("");
            }
            if(func.error) func.error(err,request.request_object);
        }
    });
};



App.prototype.ignoreIrrelevantPaths = function(path){
    var len = app.skippable_pages.length;
    var arr = app.skippable_pages;
    var contains = app.skippable_pages.indexOf(path) > -1;
    if(contains){
        return; //this is an irrelevant path;
    }
    else {
        for (var x = 0; x < len; x++) {
            if(path.indexOf(arr[x]) > -1){
                return; //
            }
        }
        app.current_page = path;
    }
};


App.prototype.loadPage = function (options) {
    //options.load_url
    //options.load_area
    //options.onload
    var path = options.load_url;
    app.ignoreIrrelevantPaths(path);
    $("#" + options.load_area).load(path, function () {
        if (app.appData.formData.onload[path]) {
            app.appData.formData.onload[path]();
            app.appData.formData.onload.always();

        }
        if (options.onload) {
            options.onload();
        }
    });
};


App.prototype.currentPage = function(){
    return app.current_page;
};



App.prototype.getFormData = function (formData) {
    var data = {};
    formData = formData.fields;
    var errorSpace = $("#" + app.context.error_space);
    for (var id in formData) {
        var elem = $("#" + id);
        var value = elem.val();
        var sign = formData[id].sign;
        if ((!value || value.trim() === "") && formData[id].required) {
            elem.focus();
            errorSpace.html(formData[id].message);
            app.scrollTo(id);
            return;
        }
        if(sign === "+" && parseFloat(value) < 0){
            elem.focus();
            errorSpace.html("Field should have positive value");
            app.scrollTo(id);
            return; 
        }
        var obj = {};
        obj.value = value;
        data[id] = obj;
    }
    return data;
};



App.prototype.scrollTo = function (id) {
    // Scroll
    if (!$("#" + id)[0])
        return;
    $('html,body').animate({
        scrollTop: $("#" + id).offset().top - 55},
    'slow');
};

App.prototype.getUrlParameter = function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};



App.prototype.setUpAuto = function (field) {
    var id = field.autocomplete.id;
    $("#" + id).typeahead({
        source: function (query, process) {
            app.autocomplete(field, function (resp) {
                var data = resp.response.data;
                field.autocomplete.data = data;
                var arr = [];
                $.each(data[field.autocomplete.key],function(x){
                    var val = data[field.autocomplete.key][x];
                    if(val) arr.push(val);
                });
                return process(arr);
            });
        },
        minLength: 1,
        updater: function (item) {
            var data = field.autocomplete.data;
            var key = field.autocomplete.key;
            var index = data[key].indexOf(item);
            if (data.ID) {
                $("#" + id).attr("current-item", data.ID[index]);
            }
            else {
                $("#" + id).attr("current-item", item);
            }
            if (field.autocomplete.after)
                field.autocomplete.after(data, index);

            if (field.autocomplete_handler)
                app.defaultAutoHandler(field.autocomplete_handler, data, index);
            return item;
        }
    });
};


App.prototype.paginateSelectItem = function (options) {
    //when this is executed, go back and display the required data
    //so go back
    $("#paginate_navigate").click();
    //then populate the required data
    if (options.afterSelectItem) {
        options.afterSelectItem(options.data, options.index);
    }
    if (options.handler) {
        app.defaultAutoHandler(options.handler, options.data, options.index);
    }

};

App.prototype.paginate = function (options) {
    if (options.save_state) {
        var state = $("#" + options.save_state_area).html();
        app.savedState = state;
    }
    //options.load_url
    //options.load_area
    //options.onload
    app.loadPage({
        load_url: app.pages.paginate,
        load_area: "content_area",
        onload: function () {
            
            $("#paginate_title").html(options.title);
            
            $("#paginate_print").click(function () {
                app.print({
                    area: "content_area",
                    title: options.title,
                    beforePrint: function () {
                        //do something cool
                        //remove the headers
                        $("#paginate_button_area").css("display", "none");
                        $("#content_area").css("margin-top", "0px");
                        $("#paginate_card").css("width", "100%");
                        $("#paginate_card").css("border", "0px");
                        var currTitle = $("#paginate_title").html();
                        var newTitle = app.getSetting("business_name") + "<br/><br/>" + currTitle;
                        $("#paginate_title").html(newTitle);
                        if (options.beforePrint) {
                            options.beforePrint();
                        }
                        app.runLater(2000, function () {
                            $("#paginate_button_area").css("display", "block");
                            $("#content_area").css("margin-top", "60px");
                            $("#paginate_card").css("width", "98%");
                            $("#paginate_card").css("border", "1px solid rgb(173, 216, 230)");
                            $("#paginate_title").html(currTitle);
                        });
                    }
                });
            });
            //set up paginate_download
            $("#paginate_download").click(function(){
                //set up the first table we find as exportable to excel
                var tableId = $($("table")[0]).attr("id");
                var href = $("#paginate_download");
                return ExcellentExport.excel(href, tableId, options.title);
                
            });
            
            if (options.save_state) {
                $("#paginate_navigate").click(function () {
                    $("#" + options.save_state_area).html(app.savedState);
                    app.savedState = "";
                    var onload = app.appData.formData.onload[options.onload_handler];
                    var always = app.appData.formData.onload.always;
                    if (onload) { //invoke the onload handlers e.g app.pages.sale
                        always();
                        onload();
                    }
                });
            }
            else {
                $("#paginate_navigate").click(function () {
                    app.loadPage({
                        load_url: options.previous,
                        load_area: "content_area"
                    }); // state is not saved in this case so reload the previous page
                });
            }
            if (options.onload) {
                options.onload(); //handle any onload function once we paginate
            }
        }
    });

};



App.prototype.setUpDate = function (id, minDate) {
    $("#" + id).removeClass("hasDatepicker");
    if (minDate) {
        $('#' + id).datepicker({
            dateFormat: "yy-mm-dd",
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true,
            minDate: 0
        });
    }
    else {
        $('#' + id).datepicker({
            dateFormat: "yy-mm-dd",
            showButtonPanel: true,
            changeMonth: true,
            changeYear: true
        });
    }
};

App.prototype.autocomplete = function (field, func) {
    var auto = field.autocomplete;
    var requestData = {
        database: auto.database,
        table: auto.table,
        column: auto.column,
        where: auto.where(),
        orderby: auto.orderby,
        limit: auto.limit
    };
    app.xhr(requestData, app.dominant_privilege, "auto_complete", {
        load: false,
        success: function (data) {
            if (data.response.data === "FAIL") {
                app.showMessage(data.response.reason);
            }
            else {
                func(data);
            }

        }
    });
};



App.prototype.showMessage = function (msg) {
    var errorSpace = $("#" + app.context.error_space);
    errorSpace.html(msg);
    app.scrollTo(errorSpace.attr('id'));
    app.runLater(5000, function () {
        $("#" + app.context.error_space).html("");
    });
};


App.prototype.runLater = function (time, func) {
    return setTimeout(func, time);
};



App.prototype.print = function (options) {
    options.beforePrint();
    $("#" + options.area).printThis({
        debug: false,
        importCSS: true,
        printContainer: true,
        loadCSS: "/css/pos.css",
        pageTitle: options.title,
        removeInline: false
    });
};

App.prototype.defaultAutoHandler = function (autoHandler, data, index) {
    //{id : key, id : key}
    $.each(autoHandler.fields, function (id) {
        var key = autoHandler.fields[id];
        $("#" + id).val(data[key][index]);
        $("#" + id).html(data[key][index]);
    });
    if(autoHandler.after){
        autoHandler.after(data, index);
    }
    
};

App.prototype.getSetting = function(name){
    var settings = localStorage.getItem("settings");
    if(settings && settings !== "undefined") {
        settings = JSON.parse(settings);
        if(settings.CONF_VALUE){
            return settings.CONF_VALUE[settings.CONF_KEY.indexOf(name)];   
        }
        return "0";
    }
    else {
        return "0";
    }
};

App.prototype.rand = function (len) {
    var buffer = "";
    var count = 0;
    function getRandomDigit() {
        return Math.floor(10 * Math.random());
    }
    function getRandomLetter() {
        var random = Math.floor(25 * Math.random()) + 97;
        return String.fromCharCode(random);
    }
    while (count < len) {
        var decision = getRandomDigit();
        if (decision > 5) {
            buffer += getRandomDigit();
            count++;
        }
        else {
            buffer += getRandomLetter();
            count++;
        }
    }
    return buffer.toString();
};


App.prototype.renderDom = function(obj,toAppend){
    var elem;
    if(!obj.type) return;
    var inputs = ["text","date","number","time","button"];
    var label = $("<label>");
    label.append(obj.label);
    !obj.label ? null : toAppend.append(label);
    if(obj.type === "select"){
       elem = $("<select>"); 
       $.each(obj.option_names,function(x){
          var option = $("<option>");
          option.attr("value",obj.option_values[x]);
          option.html(obj.option_names[x]);
          elem.append(option);
       });
    }
    else if(inputs.indexOf(obj.type.trim()) > -1){
        elem = $("<input type='"+obj.type+"'>");
        elem.val(obj.value);
    }
    else {
        elem = $(obj.type);
    }
    !obj["class"] ? null : elem.addClass(obj["class"]);
    !obj.style ? null : elem.attr("style",obj.style);
    !obj.id ? null : elem.attr("id",obj.id);
    //bind events
    if(obj.events){
        //do something
        $.each(obj.events,function(event){
            elem.bind(event,obj.events[event]);
        });
    }
    toAppend.append(elem);
};

App.prototype.briefShow = function(options){
    var m = app.ui.modal(options.content,options.title,{
        
    });
    var delay = !options.delay ? 3000 : options.delay;
    app.runLater(delay,function(){
       m.modal('hide'); 
    });
};


window.app = new App();