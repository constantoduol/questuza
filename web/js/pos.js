/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
//
//function App() {
//    this.appData = new AppData();
//    this.pages = {};
//    this.platform = "web";
//    this.context = null;
//    this.sub_context = {};
//    this.current_page = "";
//    this.ui = new UI();
//    this.dominant_privilege = "";
//    this.savedState = "";
//    this.server = "/server";
//    this.platform = this.isMobile() ? "mobile" : "web";
//}
//
//App.prototype.isMobile = function(){
//    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
//        return true;
//    return false;
//};
//
//App.prototype.brand = function(){
//  var html = "This product is a trademark of Quest Pico at <a href='http://www.questpico.com'>www.questpico.com</a><br/>Talk to us today at <a href='mailto:info@questpico.com'>info@questpico.com</a>";
//  app.ui.modal(html,"About",{
//      cancelText : "Done"
//  });  
//};
//
//App.prototype.activateProduct = function(){
//    var html = "<label for='business_name'>Business Name</label>" +
//        "<input type='text' id='business_name' class='form-control'>" +
//        "<label for='activation_key'>Activation Key</label>" +
//        "<input type='text' id='activation_key' class='form-control'>";
//    app.ui.modal(html,"Activate Product",{
//        okText : "Activate",
//        ok : function(){
//            var name = $("#business_name").val().trim();
//            var key = $("#activation_key").val().trim();
//            if(name === "" || key === "") {
//                alert("Both business name and activation key are required");
//                return;
//            }
//            var request = {
//                business_name : name,
//                activation_key : key
//            };
//            app.xhr(request,"open_data_service","activate_product",{
//                load : true,
//                success : function(data){
//                    var resp = data.response.data;
//                    var date = new Date(parseInt(resp.expiry)).toLocaleString();
//                    var show = "Congratulations, Your product is activated!<br> \n\
//                        Restart your computer to finish activation.<br>Expires: "+date+" \n\
//                        <br>Version: "+resp.version_name+"\n\
//                        <br>Version No : "+resp.version_no+"";
//                    $("#modal_content_area").html(show);
//                    $("#modal_area_button_ok").html("Done");
//                    $("#modal_area_button_ok").unbind("click");
//                    $("#modal_area_button_ok").click(app.logout);
//                }
//
//            });
//
//        }
//    });
//};
//
//App.prototype.settings = function () {
//    app.paginate({
//        title: "Settings",
//        save_state: true,
//        save_state_area: "content_area",
//        onload_handler: app.pages.business,
//        onload: function () {
//            app.loadPage({
//                load_url: app.pages.settings,
//                load_area: "paginate_body",
//                onload: function () {
//                    $("#paginate_print").remove();
//                    app.xhr({}, app.dominant_privilege, "fetch_settings", {
//                        load: false,
//                        success: function (resp) {
//                            var r = resp.response.data;
//                            $.each(r.CONF_KEY,function(x){
//                                $("#"+r.CONF_KEY[x]).val(r.CONF_VALUE[x]);
//                            });
//                        }
//                    });
//                    
//                    $("#save_settings_btn").click(function(){
//                        var data = app.getFormData(app.context.settings);
//                        if(!data) return;
//                        var request = {
//                            enable_undo_sales : data.enable_undo_sales.value,
//                            add_tax : data.add_tax.value,
//                            add_comm : data.add_comm.value,
//                            add_purchases : data.add_purchases.value,
//                            track_stock : data.track_stock.value
//                        };
//                        app.xhr(request,app.dominant_privilege,"save_settings",{
//                            load : false,
//                            success : function(resp){
//                                var r = resp.response.data;
//                                if(r === "success"){
//                                    alert("Settings saved successfully");
//                                }
//                                else if(r === "fail"){
//                                    alert(resp.response.reason);
//                                }
//                            }
//                        });
//                    });
//
//                }
//            });
//        }
//    });
//};


//
//App.prototype.xhr = function (data, svc, msg, func) {
//    var request = {};
//    request.request_header = {};
//    request.request_header.request_svc = svc;
//    request.request_header.request_msg = msg;
//    request.request_header.session_id = localStorage.getItem("session_id");
//    data.business_id = app.appData.formData.login.current_user.business_id;
//    request.request_object = data;
//    if (func.load) {
//        var loadArea = $("#" + app.context.load_area);
//        var loader = $("<img src='img/loader.gif'>");
//        loadArea.html(loader);
//    }
//    return $.ajax({
//        type: "POST",
//        url: app.server,
//        data: "json=" + encodeURIComponent(JSON.stringify(request)),
//        dataFilter: function (data, type) {
//            if (func.load) {
//                loadArea.html("");
//            }
//            var data = JSON.parse(data);
//            if (data.request_msg === "auth_required") {
//                window.location = "index.html";
//            }
//            return data;
//        },
//        success: function(data){
//            func.success(data);
//        },
//        error: function(err){
//            if (func.load) {
//                loadArea.html("");
//            }
//            if(func.error) func.error(err);
//        }
//    });
//};
//
//App.prototype.print = function (options) {
//    options.beforePrint();
//    $("#" + options.area).printThis({
//        debug: false,
//        importCSS: true,
//        printContainer: true,
//        loadCSS: "/css/pos.css",
//        pageTitle: options.title,
//        removeInline: false
//    });
//};

//App.prototype.navigateBusiness = function (buss, url) {
//    if (buss.business_ids && buss.business_ids.length === 1) {
//        window.location = url;
//        localStorage.setItem("business_id", buss.business_ids[0]);
//        localStorage.setItem("business_type", buss.business_types[0]);
//        localStorage.setItem("business_name", buss.business_names[0]);
//    }
//    else if (buss.business_ids && buss.business_ids.length > 1) {
//        var options = "";
//        for (var x = 0; x < buss.business_names.length; x++) {
//            var option = "<option value=" + buss.business_ids[x] + ">" + buss.business_names[x] + "</option>";
//            options = options + option;
//        }
//        var html = "<select id='select_business_id'>" + options + "</select>";
//        app.ui.modal(html, "Select Business", {
//            ok: function () {
//                var businessId = $("#select_business_id").val();
//                var businessType = buss.business_types[buss.business_ids.indexOf(businessId)];
//                var businessName =  buss.business_names[buss.business_ids.indexOf(businessId)];
//                localStorage.setItem("business_type", businessType);
//                localStorage.setItem("business_id", businessId);
//                localStorage.setItem("business_name", businessName);
//                window.location = url;
//            },
//            cancel: function () {
//
//            },
//            okText: "Proceed",
//            cancelText: "Cancel"
//        });
//
//    }
//    else {
//       //you have no business at all
//       console.log("no business set");
//       window.location = url;
//       
//    }
//};
//
//App.prototype.onSignIn = function(){
//   //fetch settings 
//    app.xhr({}, app.dominant_privilege, "fetch_settings", {
//        load: false,
//        success: function (resp) {
//            var r = resp.response.data;
//            localStorage.setItem("settings",JSON.stringify(r));
//        }
//    });
//};

//App.prototype.navigate = function (privileges, buss) {
//    var adminIndex = privileges.indexOf("pos_admin_service");
//    var saleIndex = privileges.indexOf("pos_sale_service");
//    //if you have more than one business id, navigate to the correct one
//    if (adminIndex > -1 && saleIndex > -1) {
//        //you have to select because you have both privileges
//        var html = "<select id='select_role'>\n\
//                    <option value='seller'>Seller</option>\n\
//                    <option value='admin'>Admin</option></select>";
//
//        app.ui.modal(html, "Select Role", {
//            ok: function () {
//                var role = $("#select_role").val();
//                if (role === "seller") {
//                    app.navigateBusiness(buss, "sale.html");
//                }
//                else if (role === "admin") {
//                    app.navigateBusiness(buss, "admin.html");
//                }
//            },
//            cancel: function () {
//
//            },
//            okText: "Proceed",
//            cancelText: "Cancel"
//        });
//
//    }
//    else if (adminIndex > -1) {
//        //you're only an admin
//        app.navigateBusiness(buss, "admin.html");
//    }
//    else if (saleIndex > -1) {
//        //you're a salesperson 
//        app.navigateBusiness(buss, "sale.html");
//    }
//    else {
//        //you have nothing...
//        //no privileges found
//        //thats strange
//    }
//
//
//};

//
//App.prototype.ignoreIrrelevantPaths = function(path){
//    var len = app.skippable_pages.length;
//    var arr = app.skippable_pages;
//    var contains = app.skippable_pages.indexOf(path) > -1;
//    if(contains){
//        return; //this is an irrelevant path;
//    }
//    else {
//        for (var x = 0; x < len; x++) {
//            if(path.indexOf(arr[x]) > -1){
//                return; //
//            }
//        }
//        app.current_page = path;
//    }
//};
//
//
//App.prototype.loadPage = function (options) {
//    //options.load_url
//    //options.load_area
//    //options.onload
//    var path = options.load_url;
//    app.ignoreIrrelevantPaths(path);
//    $("#" + options.load_area).load(path, function () {
//        if (app.appData.formData.onload[path]) {
//            app.appData.formData.onload[path]();
//            app.appData.formData.onload.always();
//
//        }
//        if (options.onload) {
//            options.onload();
//        }
//    });
//};
//
//
//App.prototype.currentPage = function(){
//    return app.current_page;
//};


//
//App.prototype.createAccount = function () {
//    app.context = app.appData.formData.create_account;
//    var data = app.getFormData(app.context);
//    if (!data)
//        return;
//    if (data.password.value !== data.confirm_password.value) {
//        //do something cool
//        app.showMessage(app.context.passwords_not_match);
//        return;
//    }
//    var reg = /^(?=.*\d).{4,50}$/;
//    var valid = reg.test(data.confirm_password.value);
//    if (!valid) {
//        app.showMessage(app.context.password_not_valid);
//        return;
//    }
//    app.appData.formData.login.current_user.business_id = "";
//    var requestData = {
//        name: data.user_name.value,
//        password: data.password.value,
//        privs: ["pos_admin_service", "user_service","pos_sale_service"],
//        host: "localhost",
//        real_name : data.real_name.value
//    };
//    app.xhr(requestData, "open_data_service", "create_account", {
//        load: true,
//        success: function (resp) {
//            if (resp.response.data === "success") {
//                app.ui.modal(app.context.create_account_success,"User Account",{
//                    ok : function(){
//                       window.location = "index.html";
//                    },
//                    cancel : function(){
//                       window.location = "index.html";
//                    },
//                    okText : "Proceed",
//                    cancelText : "Cancel"
//                });
//            }
//            else if(resp.response.data === "fail"){
//               app.showMessage(app.context.create_account_fail); 
//            }
//        }
//    });
//    return false;
//};
//
//App.prototype.login = function () {
//    app.context = app.appData.formData.login;
//    var data = app.getFormData(app.context);
//    if (!data) return;
//    var requestData = {
//        username: data.username.value,
//        password: data.password.value
//    };
//    app.xhr(requestData, "open_data_service,open_data_service", "login,business_info", {
//        load: true,
//        success: function (resp) {
//            var binfo = resp.response.open_data_service_business_info.data;
//            var login = resp.response.open_data_service_login.data;
//            if (login.response === "loginsuccess") {
//                //get the session id
//                localStorage.setItem("session_id", login.rand);
//                localStorage.setItem("current_user", login.user);
//                localStorage.setItem("privileges", login.privileges);
//                localStorage.setItem("host", login.host);
//                app.onSignIn();
//                app.navigate(login.privileges, binfo);           
//            }
//            else if (login === "changepass") {
//                window.location = "change.html?user_name="+data.username.value;
//            }
//            else {
//                app.showMessage(app.context.messages[login]);
//            }
//        }
//    });
//    return false;
//};



//App.prototype.changePassword = function () {
//    app.context = app.appData.formData.change_pass;
//    var data = app.getFormData(app.context);
//    if (!data)
//        return;
//    if (data.new_password.value !== data.confirm_password.value) {
//        //do something cool
//        app.showMessage(app.context.passwords_not_match);
//        return;
//    }
//    var reg = /^(?=.*\d).{4,50}$/;
//    var valid = reg.test(data.confirm_password.value);
//    if (!valid) {
//        app.showMessage(app.context.password_not_valid);
//        return;
//    }
//    var requestData = {
//        user_name: data.user_name.value,
//        old_password: data.old_password.value,
//        new_password: data.new_password.value,
//        confirm_password: data.confirm_password.value
//    };
//    app.xhr(requestData, "open_data_service", "changepass", {
//        load: true,
//        success: function (data) {
//            if (data.response.data === true) {
//                //login again
//                window.location = "index.html";
//            }
//            else {
//                app.showMessage(app.context.messages["false"]);
//            }
//        }
//    });
//    return false;
//};


//
//App.prototype.getFormData = function (formData) {
//    var data = {};
//    formData = formData.fields;
//    var errorSpace = $("#" + app.context.error_space);
//    for (var id in formData) {
//        var elem = $("#" + id);
//        var value = elem.val();
//        if ((!value || value.trim() === "") && formData[id].required) {
//            elem.focus();
//            errorSpace.html(formData[id].message);
//            app.scrollTo(id);
//            return;
//        }
//        var obj = {};
//        obj.value = value;
//        data[id] = obj;
//    }
//    return data;
//};

//App.prototype.logout = function () {
//    var requestData = {
//        user_name: app.appData.formData.login.current_user
//    };
//    app.xhr(requestData, "open_data_service", "logout", {
//        load: true,
//        success: function (data) {
//            //login again
//            localStorage.removeItem("session_id");
//            localStorage.removeItem("current_user");
//            localStorage.removeItem("privileges");
//            localStorage.removeItem("host");
//            localStorage.removeItem("business_name");
//            localStorage.removeItem("business_id");
//            localStorage.removeItem("business_type");
//            window.location = "index.html";
//        },
//        error: function () {
//            //do something 
//            $("#" + app.context.error_space).html(app.context.error_message);
//        }
//    });
//};

//
//App.prototype.scrollTo = function (id) {
//    // Scroll
//    if (!$("#" + id)[0])
//        return;
//    $('html,body').animate({
//        scrollTop: $("#" + id).offset().top - 55},
//    'slow');
//};
//
//App.prototype.getUrlParameter = function (name) {
//    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
//    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
//            results = regex.exec(location.search);
//    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
//};



//
//App.prototype.updateUser = function () {
//    var data = app.getFormData(app.context.user);
//    if (!data)
//        return;
//    var role = data.user_role.value;
//    var priv = role === "admin" ? ["pos_admin_service", "user_service"] : ["pos_sale_service"];
//    var requestData = {
//        user_name: data.email_address.value,
//        host: "localhost",
//        group: role,
//        privs: priv
//    };
//    app.xhr(requestData, "user_service", "edit_user", {
//        load: true,
//        success: function (data) {
//            //say the user was created
//            if (data.response.data === "success") {
//                app.showMessage(app.context.update_user);
//            }
//            else if (data.response.data === "fail") {
//                app.showMessage(data.response.reason);
//            }
//            else if (data.response.type === "exception") {
//                app.showMessage(data.response.ex_reason);
//            }
//        },
//    });
//};
//
//App.prototype.generalUserRequest = function (msg) {
//    var data = app.getFormData(app.context.user);
//    if (!data) return;
//    var successMsg,confirmMsg;
//    if(msg === "delete_user"){
//        successMsg = app.context.delete_user;
//        confirmMsg = app.context.delete_user_confirm;
//    }
//    else if(msg === "disable_user"){
//        successMsg = app.context.disable_user;
//        confirmMsg = app.context.disable_user_confirm; 
//    }
//    else if(msg === "enable_user"){
//        successMsg = app.context.enable_user;
//        confirmMsg = app.context.enable_user_confirm; 
//    }
//    var conf = confirm(confirmMsg);
//    if(!conf) return;
//    var requestData = {
//        name: data.email_address.value
//    };
//    app.xhr(requestData, "user_service", msg, {
//        load: true,
//        success: function (data) {
//            if (data.response.data === "success") {
//                app.showMessage(successMsg);
//            }
//            else if (data.response.type === "exception") {
//                app.showMessage(data.response.ex_reason);
//            }
//            else if (data.response.data === "fail") {
//                app.showMessage(data.response.reason);
//            }
//            //save the local data
//        }
//    });
//};
//
//
//
//
//
//App.prototype.createUser = function () {
//    var data = app.getFormData(app.context.user);
//    if (!data)
//        return;
//    var role = data.user_role.value;
//    var priv = role === "admin" ? ["pos_admin_service", "user_service"] : ["pos_sale_service"];
//    var reg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
//    var emailValid = reg.test(data.email_address.value);
//    if (!emailValid) {
//        app.showMessage(app.context.email_invalid);
//        $("#email_address").focus();
//        return;
//    }
//    var requestData = {
//        name: data.email_address.value,
//        host: app.appData.formData.login.current_user.host,
//        group: role,
//        privs: priv,
//        real_name : data.real_name.value
//    };
//    app.xhr(requestData, "open_data_service", "create_account", {
//        load: true,
//        success: function (data) {
//            console.log(data);
//            if (data.response.data === "success") {
//                app.showMessage(app.context.create_user);
//            }
//            else if (data.response.type === "exception") {
//                app.showMessage(data.response.reason);
//            }
//            //save the local data
//        }
//    });
//
//
//};
//
//App.prototype.setUpAuto = function (field) {
//    var id = field.autocomplete.id;
//    $("#" + id).typeahead({
//        source: function (query, process) {
//            app.autocomplete(field, function (resp) {
//                var data = resp.response.data;
//                field.autocomplete.data = data;
//                var arr = [];
//                $.each(data[field.autocomplete.key],function(x){
//                    var val = data[field.autocomplete.key][x];
//                    if(val) arr.push(val);
//                });
//                return process(arr);
//            });
//        },
//        minLength: 1,
//        updater: function (item) {
//            var data = field.autocomplete.data;
//            var key = field.autocomplete.key;
//            var index = data[key].indexOf(item);
//            if (data.ID) {
//                $("#" + id).attr("current-item", data.ID[index]);
//            }
//            else {
//                $("#" + id).attr("current-item", item);
//            }
//            if (field.autocomplete.after)
//                field.autocomplete.after(data, index);
//
//            if (field.autocomplete_handler)
//                app.defaultAutoHandler(field.autocomplete_handler, data, index);
//            return item;
//        }
//    });
//};
//
//
//App.prototype.paginateSelectItem = function (options) {
//    //when this is executed, go back and display the required data
//    //so go back
//    $("#paginate_navigate").click();
//    //then populate the required data
//    if (options.afterSelectItem) {
//        options.afterSelectItem(options.data, options.index);
//    }
//    if (options.handler) {
//        app.defaultAutoHandler(options.handler, options.data, options.index);
//    }
//
//};
//
//App.prototype.paginate = function (options) {
//    if (options.save_state) {
//        var state = $("#" + options.save_state_area).html();
//        app.savedState = state;
//    }
//    //options.load_url
//    //options.load_area
//    //options.onload
//    app.loadPage({
//        load_url: app.pages.paginate,
//        load_area: "content_area",
//        onload: function () {
//            $("#help_icon_always").remove();
//            $("#paginate_title").html(options.title);
//            $("#paginate_print").click(function () {
//                app.print({
//                    area: "content_area",
//                    title: options.title,
//                    beforePrint: function () {
//                        //do something cool
//                        //remove the headers
//                        $("#paginate_button_area").css("display", "none");
//                        $("#content_area").css("margin-top", "0px");
//                        $("#paginate_card").css("width", "100%");
//                        $("#paginate_card").css("border", "0px");
//                        var currTitle = $("#paginate_title").html();
//                        var newTitle = localStorage.getItem("business_name") + "<br/><br/>" + currTitle;
//                        $("#paginate_title").html(newTitle);
//                        if (options.beforePrint) {
//                            options.beforePrint();
//                        }
//                        app.runLater(2000, function () {
//                            $("#paginate_button_area").css("display", "block");
//                            $("#content_area").css("margin-top", "60px");
//                            $("#paginate_card").css("width", "90%");
//                            $("#paginate_card").css("border", "1px solid rgb(173, 216, 230)");
//                            $("#paginate_title").html(currTitle);
//                        });
//                    }
//                });
//            });
//            if (options.save_state) {
//                $("#paginate_navigate").click(function () {
//                    $("#" + options.save_state_area).html(app.savedState);
//                    app.savedState = "";
//                    var onload = app.appData.formData.onload[options.onload_handler];
//                    var always = app.appData.formData.onload.always;
//                    if (onload) { //invoke the onload handlers e.g sale.html
//                        always();
//                        onload();
//                    }
//                });
//            }
//            else {
//                $("#paginate_navigate").click(function () {
//                    app.loadPage({
//                        load_url: options.previous,
//                        load_area: "content_area"
//                    }); // state is not saved in this case so reload the previous page
//                });
//            }
//            if (options.onload) {
//                options.onload(); //handle any onload function once we paginate
//            }
//        }
//    });
//
//};

//App.prototype.resetPassword = function () {
//    var data = app.getFormData(app.context.user);
//    if (!data)
//        return;
//    var requestData = {
//        name: data.email_address.value
//    };
//    app.xhr(requestData, "user_service", "reset_pass", {
//        load: true,
//        success: function (data) {
//            if (data.response.data === "success") {
//                app.showMessage(app.context.reset_password);
//            }
//            else if (data.response.data === "fail") {
//                app.showMessage(data.response.reason);
//            }
//            else if (data.response.type === "exception") {
//                app.showMessage(data.response.ex_reason);
//            }
//        }
//    });
//};
//
//App.prototype.allUsers = function () {
//    app.xhr({}, "user_service,pos_admin_service", "all_users,all_users", {
//        load: true,
//        success: function (data) {
//            console.log(data);
//            var title = "All Users";
//            var names = data.response.pos_admin_service_all_users.data.USER_NAME;
//            var userData = data.response.user_service_all_users.data;
//            var privs = [];
//            var created = [];
//            $.each(names,function(index){
//                var name = names[index];
//                var x = userData.USER_NAME.indexOf(name);
//                var priv;
//                if (userData.privileges[x].indexOf("pos_admin_service") > -1) {
//                    priv = "Admin";
//                }
//                else if (userData.privileges[x].indexOf("pos_sale_service") > -1) {
//                    priv = "Seller";
//                }
//                privs[index] = priv;
//                created[index] = new Date(userData.CREATED[x]).toLocaleDateString();
//                
//            });
//            
//
//            app.paginate({
//                title: title,
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: "user.html",
//                onload: function () {
//                     app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers :  ["Email Address", "User Role", "Date Created"],
//                        values :  [names, privs,created],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true
//                    });
//                }
//            });
//        }
//    });
//};


App.prototype.downloadExcel = function(fileName,sheetName,excelData){
  require(['js/excel-builder.js/excel-builder', 'js/download'], function (EB, downloader) {
    var workBook = EB.createWorkbook();
    var sheet = workBook.createWorksheet({name: sheetName});
    sheet.setData(excelData); //<-- Here's the important part
    workBook.addWorksheet(sheet);
    var data = EB.createFile(workBook);
    downloader(fileName, data);
});  
};

//
//App.prototype.addResource = function () {
//    var data = app.getFormData(app.context.expense);
//    if (!data) return;
//    var request = {
//        resource_type: data.resource_type.value,
//        resource_name: data.expense_name.value,
//        resource_amount: data.expense_amount.value
//    };
//    var conf = confirm("Add "+data.resource_type.value+" ?");
//    if(!conf) return;
//    app.xhr(request, app.dominant_privilege, "add_resource", {
//        load: true,
//        success: function (resp) {
//            if (resp.response.data === "success") {
//                app.showMessage(app.context.resource_success.replace("{resource_type}", data.resource_type.value));
//            }
//            else if (resp.response.data === "fail") {
//                app.showMessage(data.response.reason);
//            }
//
//        }
//    });
//
//};
//
//
//
//App.prototype.profitAndLoss = function () {
//    var data = app.getFormData(app.context.profit_and_loss);
//    if (!data)
//        return;
//    var request = {
//        start_date: data.start_date.value,
//        end_date: data.end_date.value
//    };
//    app.xhr(request, app.dominant_privilege, "profit_and_loss", {
//        load: true,
//        success: function (resp) {
//            var pandl = resp.response.data;
//            app.paginate({
//                save_state: true,
//                save_state_area: "content_area",
//                title: "Profit And Loss between " + data.start_date.value + " and " + data.end_date.value + " ",
//                onload_handler: app.pages.expenses,
//                onload: function () {
//                    var items = ["<b>Cost of Sales</b>", "<b>Opening Stock</b>", "<b>Purchases</b>",
//                        "<b>Less Closing Stock</b>", "<b>Cost of Goods sold</b>", "<b>Gross Profit</b>", "<b>Expenses</b>"];
//                    var types = [1, 0, 0, 0, 0, 1, ""];
//                    var costOfGoodsSold = pandl.opening_stock + pandl.cost_of_goods_bought_bp - pandl.closing_stock;
//                    var grossProfit = pandl.cost_of_goods_sold_sp - costOfGoodsSold;
//                    var values = [pandl.cost_of_goods_sold_sp, pandl.opening_stock, pandl.cost_of_goods_bought_bp, pandl.closing_stock, costOfGoodsSold, grossProfit, ""];
//                    var debits = [];
//                    var credits = [];
//                    var totalExpenses = 0;
//                    var totalIncomes = 0;
//                    $.each(pandl.resource_data.RESOURCE_TYPE, function (index) {
//                        var type = pandl.resource_data.RESOURCE_TYPE[index];
//                        if (type === "expense") {
//                            var rName = pandl.resource_data.RESOURCE_NAME[index];
//                            var rAmount = parseFloat(pandl.resource_data.RESOURCE_AMOUNT[index]);
//                            var index = items.indexOf(rName);
//                            if(index > -1){
//                               values[index] = values[index] + rAmount;
//                            }
//                            else {
//                                items.push(rName);
//                                values.push(rAmount);
//                                types.push(0);
//                            }
//                            totalExpenses += rAmount;
//                        }
//                    });
//
//                    items.push("<b>Incomes</b>");
//                    types.push("");
//                    values.push("");
//                    $.each(pandl.resource_data.RESOURCE_TYPE, function (index) {
//                        var type = pandl.resource_data.RESOURCE_TYPE[index];
//                        if (type === "income") {
//                            var rName = pandl.resource_data.RESOURCE_NAME[index];
//                            var rAmount = parseFloat(pandl.resource_data.RESOURCE_AMOUNT[index]);
//                            var index = items.indexOf(rName);
//                            if(index > -1){
//                               values[index] = values[index] + rAmount;
//                            }
//                            else {
//                                items.push(rName);
//                                values.push(rAmount);
//                                types.push(1);
//                            }
//                            totalIncomes += rAmount;
//                        }
//                    });
//
//                    var netProfit = grossProfit + totalIncomes - totalExpenses;
//                    items.push("<b>Net Profit</b>");
//                    types.push(1);
//                    values.push(netProfit);
//                    $.each(items, function (index) {
//                        if (types[index] === 1) {
//                            //this is a credit
//                            credits.push(app.formatMoney(values[index]));
//                            debits.push("");
//                        }
//                        else if (types[index] === 0) {
//                            debits.push(app.formatMoney(values[index]));
//                            credits.push("");
//                        }
//                        else {
//                            credits.push("");
//                            debits.push("");
//                        }
//                    });
//                   
//                      app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers :  ["Items", "Expenses", "Revenues"],
//                        values :  [items, debits, credits],
//                        include_nums : false,
//                        style : ""
//                    });
//                }
//            });
//
//            //cost of sales : 100000 
//            //opening stock : 10000
//            //purchases :    30000
//            //closing stock : 10000
//            //cost of goods sold : 30000
//            //gross profit :    70000
//            //expenses : 
//            //  rent :  3000
//            //  elect : 4000
//            //incomes : 
//            //  stuff :      2000
//            //  more stuff : 3000
//            //net profit : 52000
//            //
//        }
//    });
//
//
//
//};
//
//App.prototype.supplierSelect = function(){
//    var prodId = $("#search_products").attr("current-item");
//    var name = $("#product_name").val();
//    if(!prodId){
//        app.showMessage(app.context.no_product_selected);
//        return;
//    }
//    app.paginate({
//        title: "Select Suppliers for "+name,
//        save_state: true,
//        save_state_area: "content_area",
//        onload_handler: app.pages.products,
//        onload: function () {
//            $("#paginate_print").remove(); //remove the print button
//            app.loadPage({
//                load_url: app.pages.supplier_select,
//                load_area: "paginate_body",
//                onload: function () {
//                   //fetch the suppliers this product has
//                    //setup click handlers
//                    $("#supplier_add_btn").click(function(){
//                        app.supplierAndProduct("create",prodId);
//                    });
//                    app.supplierAndProduct("fetch_all",prodId);
//                }
//            });
//        }
//    });
//};
//
//App.prototype.supplierAndProduct = function(actionType,prodId,supId){
//    if(actionType === "create"){
//        supId = $("#search_suppliers").attr("current-item");
//        if(!supId) {
//            app.showMessage(app.context.no_supplier_selected);
//            return;
//        }
//    }
//    else if(actionType === "delete"){
//        var conf = confirm("Remove supplier ?");
//        if(!conf) return;
//    }
//
//    var request = {
//        action_type : actionType,
//        supplier_id : supId,
//        product_id : prodId
//    };
//    app.xhr(request,app.dominant_privilege,"supplier_and_product",{
//        load : true,
//        success : function(data){
//            var resp = data.response.data;
//            if(actionType === "create" && resp === "success"){
//                app.showMessage(app.context.supplier_added);
//                app.supplierAndProduct("fetch_all",prodId);
//            }
//            else if(actionType === "delete" && resp === "success"){
//                app.showMessage(app.context.supplier_deleted);
//                app.supplierAndProduct("fetch_all",prodId);
//            }
//            else if(actionType === "fetch_all"){
//                $("#supplier_area").html("<h4>Current Suppliers</h4>");
//                var ID = $.extend(true, [], resp.SUPPLIER_ID);
//                app.ui.table({
//                    id_to_append : "supplier_area",
//                    headers :  ["Name","Account","Remove"],
//                    values :  [resp.SUPPLIER_NAME,resp.SUPPLIER_ID, ID],
//                    include_nums : true,
//                    style : "",
//                    mobile_collapse : true,
//                    transform : {
//                        1 : function(supId,index){
//                            var name = encodeURIComponent(resp.SUPPLIER_NAME[index]);
//                            return "<a href='#' onclick=app.supplierAccount('transact','"+prodId+"','"+supId+"','"+name+"')>Account</a>";
//                        },
//                        2 : function(value){
//                            return "<a href='#' onclick=app.supplierAndProduct('delete','"+prodId+"','"+value+"')>Remove</a>";
//                        }
//                    }
//                });
//            }
//            else {
//                app.showMessage(data.response.reason);
//            }
//        }
//    });
//};
//
//
//App.prototype.supplierAccount = function(actionType,prodId,supId,name){
//    name = decodeURIComponent(name);
//    app.ui.modal("","Supplier Account",{
//        okText : "Proceed",
//        ok : function(){
//            var data = app.getFormData(app.context.supplier_account);
//            if(!data) return;
//            var request = {
//                entry_type : data.entry_type.value,
//                amount : data.amount.value,
//                narration : data.narration.value,
//                supplier_id : supId,
//                product_id : prodId
//            };
//            app.xhr(request,app.dominant_privilege,"supplier_account_transact",{
//                load : true,
//                success : function (data) {
//                    var resp = data.response.data;
//
//                }
//            });
//        }
//    });
//    app.loadPage({
//        load_url: app.pages.supplier_account,
//        load_area: "modal_content_area",
//        onload : function(){
//            $("#supplier_account_name").html(name);
//        }
//    });
//};
//
//
//App.prototype.allSuppliers = function(){
//    app.xhr({},app.dominant_privilege,"all_suppliers",{
//        load : true,
//        success : function(data){
//            var r = data.response.data;
//            app.paginate({
//                save_state : true,
//                save_state_area : "content_area",
//                title : "Suppliers",
//                onload_handler : app.pages.suppliers,
//                onload : function(){
//                    app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers :  ["Name","Phone","Email","Address","Website","Contact Name","Contact Phone","City","Country"],
//                        values :  [r.SUPPLIER_NAME, r.PHONE_NUMBER, r.EMAIL_ADDRESS, r.POSTAL_ADDRESS, r.WEBSITE,
//                            r.CONTACT_PERSON_NAME, r.CONTACT_PERSON_PHONE, r.CITY, r.COUNTRY],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true,
//                    });
//                }
//            });
//        }
//    });
//};
//
//App.prototype.allProducts = function (handler) {
//    app.xhr({}, app.dominant_privilege, "all_products", {
//        load: true,
//        success: function (data) {
//            var resp = data.response.data;
//            app.context.product.fields.search_products.autocomplete.data = $.extend(true, {}, resp); //we will need this for paginateSelect
//            var title = "All Products";
//            app.paginate({
//                save_state: true,
//                save_state_area: "content_area",
//                title: title,
//                onload_handler: handler,
//                onload: function () {
//                    var bType = app.appData.formData.login.current_user.business_type;
//                    var headers, values;
//                    $.each(resp.PRODUCT_NAME, function (index) {
//                        resp.CREATED[index] = new Date(resp.CREATED[index]).toLocaleDateString();
//                        resp.PRODUCT_EXPIRY_DATE[index] = new Date(resp.PRODUCT_EXPIRY_DATE[index]).toLocaleDateString();
//                    });
//                    
//                    if (bType === "goods") {
//                        headers = ["Product Name", "Type", "BP/Unit", "SP/Unit", "Available Qty", "Reminder Limit", "Date Created", "Expiry Date"];
//                        values = [resp.PRODUCT_NAME, resp.PRODUCT_TYPE, resp.BP_UNIT_COST, resp.SP_UNIT_COST, resp.PRODUCT_QTY,
//                            resp.PRODUCT_REMIND_LIMIT, resp.CREATED, resp.PRODUCT_EXPIRY_DATE];
//                    }
//                    else if (bType === "services") {
//                        if (localStorage.getItem("track_stock") === "1") {
//                            headers = ["Product Name", "Type", "SP/Unit","Available Qty", "Date Created"];
//                            values = [resp.PRODUCT_NAME, resp.PRODUCT_TYPE, resp.SP_UNIT_COST, resp.PRODUCT_QTY, resp.CREATED];
//                        }
//                        else {
//                            headers = ["Product Name", "Type", "SP/Unit", "Date Created"];
//                            values = [resp.PRODUCT_NAME, resp.PRODUCT_TYPE, resp.SP_UNIT_COST, resp.CREATED];
//                        }
//                    }
//                     app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers :  headers,
//                        values :  values,
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true,
//                        transform : {
//                            0: function(value,index){
//                                return "<a href='#' id=item_select_" + index + ">" + value + "</a>"
//                            }
//                        }
//                    });
//                    $.each(resp.PRODUCT_NAME, function (index) {
//                        //set up onclick handlers
//                        $("#item_select_" + index).click(function () {
//                            var defaultHandler = handler === "sale.html" ? undefined : app.context.product.fields.search_products.autocomplete_handler;
//                            var afterSelectItem = handler === "sale.html" ? app.sale : undefined;
//                            app.paginateSelectItem({
//                                data: app.context.product.fields.search_products.autocomplete.data,
//                                index: index,
//                                handler: defaultHandler,
//                                afterSelectItem: afterSelectItem
//                            });
//                        });
//                    });
//                }
//            });
//        }
//    });
//};
//
//
//App.prototype.goodsStockHistory = function () {
//    var data = app.getFormData(app.context.stock_history);
//    var id = $("#search_stock").attr("current-item");
//    id = !id ? "all" : id;
//    if (!data)
//        return;
//    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
//        app.showMessage(app.context.invalid_dates);
//        return;
//    }
//    var request = {
//        id: id,
//        user_name: $("#stock_select_users").val(),
//        begin_date: data.start_date.value,
//        end_date: data.end_date.value,
//        report_type : data.report_type.value
//    };
//    app.xhr(request, app.dominant_privilege, "stock_history", {
//        load: true,
//        success: function (data) {
//            //product name
//            var resp = data.response.data;
//            //name,username,narr,time,type
//            app.paginate({
//                title: "Stock History",
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: app.pages.stock_history,
//                onload: function () {
//                    var totalQty = 0;
//                    var totalSP = 0;
//                    var totalBP = 0;
//                    var profits = 0;
//                    var costOfSales = 0;
//                    var costOfGoods = 0;
//                    var undos = [];
//                    $.each(resp.TRAN_TYPE, function (index) {
//                        var type = resp.TRAN_TYPE[index];
//                        var color = type === "0" ? "red" : "green";
//
//                        var qty = type === "1" ? parseInt(resp.STOCK_QTY[index]) : -parseInt(resp.STOCK_QTY[index]);
//                        var amountSP = type === "1" ? parseFloat(resp.STOCK_COST_SP[index]) : -parseFloat(resp.STOCK_COST_SP[index]);
//                        var amountBP = type === "1" ? parseFloat(resp.STOCK_COST_BP[index]) : -parseFloat(resp.STOCK_COST_BP[index]);
//                        var profit = parseFloat(resp.PROFIT[index]);
//
//                        color = amountSP < 0 && profit === 0 ? "orange" : color;
//
//                        var span = type === "0" ? "Stock Decrease" : "Stock Increase";
//                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
//
//                        var undo = "<a href='#' onclick='app.undoSale(\"" + resp.PRODUCT_ID[index] + "\",\"" + resp.STOCK_QTY[index] + "\")' \n\
//                                    title='Undo sale'>Undo Sale</a>";
//
//                        type === "0" && profit > 0 ? undos.push(undo) : undos.push("");
//
//                        var time = new Date(resp.CREATED[index]).toLocaleString();
//                        resp.CREATED[index] = time;
//
//                        resp.STOCK_QTY[index] = "<span style='color :" + color + "'>" + resp.STOCK_QTY[index] + "</span>";
//                        resp.STOCK_COST_SP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_SP[index]) + "</span>";
//                        resp.STOCK_COST_BP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_BP[index]) + "</span>";
//
//                        totalQty = totalQty + qty;
//                        totalSP = totalSP + amountSP;
//                        totalBP = totalBP + amountBP;
//                        profits = profits + profit;
//                        profit > 0 ? costOfSales = costOfSales - amountSP : 0;
//                        profit > 0 ? costOfGoods = costOfGoods - amountBP : 0;
//                    });
//                    resp.STOCK_COST_BP.push("<b>" + app.formatMoney(totalBP) + "</b>");
//                    resp.STOCK_COST_SP.push("<b>" + app.formatMoney(totalSP) + "</b>");
//                    resp.STOCK_QTY.push("<b>" + totalQty + "</b>");
//                    resp.PROFIT.push("<b>" + app.formatMoney(profits) + "</b>");
//                    resp.PRODUCT_NAME.push("<b>Totals</b>");
//                    resp.NARRATION.push(undefined);
//                    resp.CREATED.push(undefined);
//                    app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers :  ["Product Name", "Stock Value/BP", "Stock Value/SP ", "Stock Qty", "Profit", "Entry Type", "Narration", "Entry Date", "Undo Sale"],
//                        values :  [resp.PRODUCT_NAME, resp.STOCK_COST_BP, resp.STOCK_COST_SP, resp.STOCK_QTY, resp.PROFIT, resp.TRAN_TYPE, resp.NARRATION, resp.CREATED, undos],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true,
//                        summarize : {
//                            cols : [6],
//                            lengths : [30],
//                        }
//                    });
//                    var summary = $("<table class='summary table'><tr>"+
//                                    "<tr><th>Cost Of Sales BP</th><th>Cost Of Sales SP</th><th>Profit</th></tr>"+
//                                    "<tr><td>"+app.formatMoney(costOfGoods) + "</td>"+
//                                    "<td>" + app.formatMoney(costOfSales) + "</td>"+
//                                    "<td>" + app.formatMoney(profits) + "</td></tr></table>");
//                    $("#paginate_body").append(summary);
//                }
//            });
//
//        }
//    });
//};
//
//App.prototype.servicesStockHistory = function () {
//    var data = app.getFormData(app.context.stock_history);
//    var id = $("#search_stock").attr("current-item");
//    id = !id ? "all" : id;
//    if (!data)
//        return;
//    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
//        app.showMessage(app.context.invalid_dates);
//        return;
//    }
//    var request = {
//        id: id,
//        user_name: $("#stock_select_users").val(),
//        begin_date: data.start_date.value,
//        end_date: data.end_date.value,
//        report_type : data.report_type.value
//    };
//    app.xhr(request, app.dominant_privilege, "stock_history", {
//        load: true,
//        success: function (data) {
//            //product name
//            var resp = data.response.data;
//            //name,username,narr,time,type
//            app.paginate({
//                title: "Stock History",
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: app.pages.stock_history,
//                onload: function () {
//                    var totalQty = 0;
//                    var totalSP = 0;
//                    var totalBP = 0;
//                    var costOfSales = 0;
//                    var undos = [];
//                    $.each(resp.TRAN_TYPE, function (index) {
//                        var type = resp.TRAN_TYPE[index];
//                        var color = type === "0" ? "red" : "green";
//
//                        var qty = type === "1" ? parseInt(resp.STOCK_QTY[index]) : -parseInt(resp.STOCK_QTY[index]);
//                        var amountSP = type === "1" ? parseFloat(resp.STOCK_COST_SP[index]) : -parseFloat(resp.STOCK_COST_SP[index]);
//                        var amountBP = type === "1" ? parseFloat(resp.STOCK_COST_BP[index]) : -parseFloat(resp.STOCK_COST_BP[index]);
//
//
//                        var span = type === "0" ? "Sale to Customer" : "Return of Sale";
//                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
//
//                        var undo = "<a href='#' onclick='app.undoSale(\"" + resp.PRODUCT_ID[index] + "\",\"" + resp.STOCK_QTY[index] + "\")' \n\
//                                    title='Undo sale'>Undo Sale</a>";
//
//                        undos.push(undo);
//
//                        var time = new Date(resp.CREATED[index]).toLocaleString();
//                        resp.CREATED[index] = time;
//
//                        resp.STOCK_QTY[index] = "<span style='color :" + color + "'>" + resp.STOCK_QTY[index] + "</span>";
//                        resp.STOCK_COST_SP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_SP[index]) + "</span>";
//
//                        totalQty = totalQty + qty;
//                        totalSP = totalSP + amountSP;
//                        totalBP = totalBP + amountBP;
//
//                        costOfSales = costOfSales - amountSP;
//                    });
//
//                    resp.STOCK_COST_SP.push("<b>" + app.formatMoney(totalSP) + "</b>");
//                    resp.STOCK_QTY.push("<b>" + totalQty + "</b>");
//                    resp.PRODUCT_NAME.push("<b>Totals</b>");
//                    resp.NARRATION.push(undefined);
//                    resp.CREATED.push(undefined);
//                    app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers : ["Product Name", "Cost ", "Qty", "Entry Type", "Narration", "Entry Date", "Undo Sale"],
//                        values :   [resp.PRODUCT_NAME, resp.STOCK_COST_SP, resp.STOCK_QTY, resp.TRAN_TYPE, resp.NARRATION, resp.CREATED, undos],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true,
//                        summarize : {
//                            cols : [4],
//                            lengths : [30],
//                        }
//                    });
//                    var summary = $("<div class='summary'><span>Cost Of Sales: " + app.formatMoney(costOfSales) + "</span></div>");
//                    $("#paginate_body").append(summary);
//                }
//            });
//
//        }
//    });
//};
//
//
//App.prototype.stockHistory = function () {
//    var type = $("#report_type").val();
//    if(type === "stock_history") {
//        var trackStock = localStorage.getItem("track_stock");
//        trackStock === "1" ? app.goodsStockHistory() : app.servicesStockHistory();
//    }
//    else if(type === "commission_history"){
//        app.reportHistory({
//            success : function(data){
//               var resp = data.response.data;
//                app.paginate({
//                    title: "Commissions",
//                    save_state: true,
//                    save_state_area: "content_area",
//                    onload_handler: app.pages.stock_history,
//                    onload: function () {
//                        var totalComm = 0, units = 0;
//                        $.each(resp.COMM_VALUE,function(x){
//                            totalComm = parseFloat(resp.COMM_VALUE[x]) + totalComm;
//                            units = parseInt(resp.UNITS_SOLD[x]) + units;
//                        });
//                        resp.PRODUCT_NAME.push("<b>Totals</b>");
//                        resp.UNITS_SOLD.push("<b>"+units+"</b>");
//                        resp.COMM_VALUE.push(totalComm);
//                        resp.USER_NAME.push("");
//                        resp.CREATED.push("");
//                        app.ui.table({
//                            id_to_append : "paginate_body",
//                            headers : ["Product Name","Units Sold", "Commission","User Name", "Date Entered"],
//                            values : [resp.PRODUCT_NAME,resp.UNITS_SOLD,resp.COMM_VALUE,resp.USER_NAME, resp.CREATED],
//                            include_nums : true,
//                            style : "",
//                            mobile_collapse : true,
//                            transform : {
//                                2 : function(value,index){ //transform col 2 values to money
//                                    if(index === (resp.PRODUCT_NAME.length - 1))
//                                        return "<b>"+app.formatMoney(value)+"</b>";
//                                    return app.formatMoney(value);
//                                },
//                                4 : function(value,index){
//                                    if(index === (resp.PRODUCT_NAME.length - 1))
//                                        return "";
//                                    return new Date(value).toLocaleString();
//                                }
//                            }
//                        });
//                     }
//                });
//            }
//        });
//    }
//    else if(type === "tax_history"){
//        app.reportHistory({
//            success : function(data){
//                var resp = data.response.data;
//                app.paginate({
//                    title: "Taxes",
//                    save_state: true,
//                    save_state_area: "content_area",
//                    onload_handler: app.pages.stock_history,
//                    onload: function () {
//                        var totalTax = 0, units = 0;
//                        $.each(resp.TAX_VALUE,function(x){
//                            totalTax = parseFloat(resp.TAX_VALUE[x]) + totalTax;
//                            units = parseInt(resp.UNITS_SOLD[x]) + units;
//                        });
//                        resp.PRODUCT_NAME.push("<b>Totals</b>");
//                        resp.UNITS_SOLD.push("<b>"+units+"</b>");
//                        resp.TAX_VALUE.push(totalTax);
//                        resp.USER_NAME.push("");
//                        resp.CREATED.push("");
//                        app.ui.table({
//                            id_to_append : "paginate_body",
//                            headers : ["Product Name","Units Sold", "Tax","User Name", "Date Entered"],
//                            values : [resp.PRODUCT_NAME,resp.UNITS_SOLD, resp.TAX_VALUE,resp.USER_NAME, resp.CREATED],
//                            include_nums : true,
//                            style : "",
//                            mobile_collapse : true,
//                            transform : {
//                                2 : function(value,index){ //transform col 2 values to money
//                                    if(index === (resp.PRODUCT_NAME.length - 1))
//                                        return "<b>"+app.formatMoney(value)+"</b>";
//                                    return app.formatMoney(value);
//                                },
//                                4 : function(value,index){
//                                    if(index === (resp.PRODUCT_NAME.length - 1))
//                                        return "";
//                                    return new Date(value).toLocaleString();
//                                }
//                            }
//                        });
//                    }
//                });
//            }
//        });
//    }
//};
//
//
//
//
//App.prototype.reportHistory = function(options){
//    var data = app.getFormData(app.context.stock_history);
//    var id = $("#search_stock").attr("current-item");
//    id = !id ? "all" : id;
//    if (!data)
//        return;
//    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
//        app.showMessage(app.context.invalid_dates);
//        return;
//    }
//    var request = {
//        id: id,
//        user_name: $("#stock_select_users").val(),
//        begin_date: data.start_date.value,
//        end_date: data.end_date.value,
//        report_type : data.report_type.value
//    };
//    app.xhr(request, app.dominant_privilege,"stock_history", {
//        load: true,
//        success: function (data) {
//           options.success(data);
//        }
//    });
//};
//




//App.prototype.defaultAutoHandler = function (autoHandler, data, index) {
//    //{id : key, id : key}
//    $.each(autoHandler, function (id) {
//        var key = autoHandler[id];
//        $("#" + id).val(data[key][index]);
//    });
//};




//
//App.prototype.setUpDate = function (id, minDate) {
//    $("#" + id).removeClass("hasDatepicker");
//    if (minDate) {
//        $('#' + id).datepicker({
//            dateFormat: "yy-mm-dd",
//            showButtonPanel: true,
//            changeMonth: true,
//            changeYear: true,
//            minDate: 0
//        });
//    }
//    else {
//        $('#' + id).datepicker({
//            dateFormat: "yy-mm-dd",
//            showButtonPanel: true,
//            changeMonth: true,
//            changeYear: true
//        });
//    }
//};
//
//App.prototype.autocomplete = function (field, func) {
//    var auto = field.autocomplete;
//    var requestData = {
//        database: auto.database,
//        table: auto.table,
//        column: auto.column,
//        where: auto.where(),
//        orderby: auto.orderby,
//        limit: auto.limit
//    };
//    app.xhr(requestData, app.dominant_privilege, "auto_complete", {
//        load: false,
//        success: function (data) {
//            if (data.response.data === "FAIL") {
//                app.showMessage(data.response.reason);
//            }
//            else {
//                func(data);
//            }
//
//        }
//    });
//};

//App.prototype.supplierAction = function(actionType){
//    var id,oldSupplierName;
//    if(actionType === "update" || actionType === "delete") {
//        id = $("#search_suppliers").attr("current-item");
//        oldSupplierName = $("#supplier_name").attr("old-supplier-name");
//        if (!id) {
//            //no item specified for updating
//            app.showMessage(app.context.no_supplier_selected);
//            return;
//        }
//    }
//
//    var data = app.getFormData(app.context.suppliers);
//    if (!data) return;
//
//    var request = {
//        supplier_name : data.supplier_name.value,
//        country : data.country.value,
//        city : data.city.value,
//        postal_address : data.postal_address.value,
//        phone_number : data.phone_number.value,
//        email_address : data.email_address.value,
//        company_website : data.company_website.value,
//        contact_person_name : data.contact_person_name.value,
//        contact_person_phone : data.contact_person_phone.value,
//        action_type : actionType,
//        supplier_id : id,
//        old_supplier_name : oldSupplierName
//    };
//    app.xhr(request, app.dominant_privilege, "supplier_action", {
//        load: true,
//        success: function (data) {
//            if (data.response.data === "success") {
//                if(actionType === "create"){
//                    app.showMessage(app.context.create_supplier);
//                }
//                else if(actionType === "update"){
//                    app.showMessage(app.context.update_supplier);
//                }
//                else if(actionType === "delete"){
//                    app.showMessage(app.context.delete_supplier);
//                }
//
//            }
//            else if (data.response.data === "fail") {
//                app.showMessage(data.response.reason);
//            }
//        }
//    });
//
//};
//
//App.prototype.createProduct = function () {
//    var type = app.appData.formData.login.current_user.business_type;
//    var context = type === "goods" ? app.context.product : app.context.service_product;
//    var data = app.getFormData(context);
//    
//    if (!data)
//        return;
//    if (type === "services") {
//        if(localStorage.getItem("track_stock") === "0"){
//            //dont track
//            data.product_quantity = {};
//            data.product_quantity.value = 0;
//        }
//        data.product_bp_unit_cost = {};
//        data.product_bp_unit_cost.value = 0;
//        data.product_reminder_limit = {};
//        data.product_reminder_limit.value = '1';
//        data.product_expiry_date = {};
//        data.product_expiry_date.value = '2015-01-01';
//    }
//    var requestData = {
//        product_name: data.product_name.value,
//        product_quantity: data.product_quantity.value,
//        product_type: data.product_type.value,
//        product_bp_unit_cost: data.product_bp_unit_cost.value,
//        product_sp_unit_cost: data.product_sp_unit_cost.value,
//        product_reminder_limit: data.product_reminder_limit.value,
//        product_expiry_date: data.product_expiry_date.value,
//        product_narration: data.product_narration.value,
//        tax : data.tax.value,
//        commission : data.commission.value,
//        business_type: app.appData.formData.login.current_user.business_type
//    };
//  
//    app.xhr(requestData, app.dominant_privilege, "create_product", {
//        load: true,
//        success: function (data) {
//            if (data.response.data === "SUCCESS") {
//                app.showMessage(app.context.create_product);
//            }
//            else if (data.response.data === "FAIL") {
//                app.showMessage(data.response.reason);
//            }
//        }
//    });
//};
//
//App.prototype.showMessage = function (msg) {
//    var errorSpace = $("#" + app.context.error_space);
//    errorSpace.html(msg);
//    app.scrollTo(errorSpace.attr('id'));
//    app.runLater(5000, function () {
//        $("#" + app.context.error_space).html("");
//    });
//};

//App.prototype.deleteProduct = function () {
//    var id = $("#search_products").attr("current-item");
//    if (!id) {
//        //no item specified for updating
//        app.showMessage(app.context.no_product_selected);
//        return;
//    }
//    var requestData = {
//        id: id
//    };
//    app.xhr(requestData, app.dominant_privilege, "delete_product", {
//        load: true,
//        success: function (data) {
//            console.log(data);
//            if (data.response.data === "SUCCESS") {
//                app.showMessage(app.context.product_deleted);
//            }
//            else if (data.response.data === "FAIL") {
//                app.showMessage(data.response.reason);
//            }
//        }
//    });
//};
//
//App.prototype.updateProduct = function () {
//    var id = $("#search_products").attr("current-item");
//    if (!id) {
//        //no item specified for updating
//        app.showMessage(app.context.no_product_selected);
//        return;
//    }
//    
//    var type = app.appData.formData.login.current_user.business_type;
//    var context = type === "goods" ? app.context.product : app.context.service_product;
//    var data = app.getFormData(context);
//    if (!data) return;
//    if (type === "services") {
//        if(localStorage.getItem("track_stock") === "0"){
//            //dont track
//            data.product_quantity = {};
//            data.product_quantity.value = 0;
//        }
//        data.product_bp_unit_cost = {};
//        data.product_bp_unit_cost.value = 0;
//        data.product_reminder_limit = {};
//        data.product_reminder_limit.value = '1';
//        data.product_expiry_date = {};
//        data.product_expiry_date.value = '2015-01-01';
//    }
//    var requestData = {
//            id: id,
//            old_product_name: $("#product_name").attr("old-product-name"),
//            product_name: data.product_name.value,
//            product_quantity: data.product_quantity.value,
//            product_type: data.product_type.value,
//            product_bp_unit_cost: data.product_bp_unit_cost.value,
//            product_sp_unit_cost: data.product_sp_unit_cost.value,
//            product_reminder_limit: data.product_reminder_limit.value,
//            product_expiry_date: data.product_expiry_date.value,
//            product_narration: data.product_narration.value,
//            tax : data.tax.value,
//            commission : data.commission.value,
//            business_type: app.appData.formData.login.current_user.business_type
//    };
//
//    app.xhr(requestData, app.dominant_privilege, "update_product", {
//        load: true,
//        success: function (data) {
//            if (data.response.data === "SUCCESS") {
//                app.showMessage(app.context.product_updated);
//            }
//            else if (data.response.data === "FAIL") {
//                app.showMessage(data.response.reason);
//            }
//        },
//        error: function () {
//            //do something fun
//            app.showMessage(app.context.error_message);
//        }
//    });
//};
//
//App.prototype.saveBusiness = function (actionType) {
//    var data = app.getFormData(app.context.business);
//    if (!data)
//        return;
//    if (actionType === "create") {
//        var conf = confirm(app.context.business_create_confirm);
//        if (!conf) return;
//    }
//    else if (actionType === "delete") {
//        var conf1 = confirm(app.context.business_delete_confirm);
//        if (!conf1) return;
//    }
//   
//    var request = {
//        action_type: actionType,
//        business_name: data.business_name.value,
//        country: data.country.value,
//        city: data.city.value,
//        postal_address: data.postal_address.value,
//        phone_number: data.phone_number.value,
//        company_website: data.company_website.value,
//        business_type: data.business_type.value,
//        business_owner: app.appData.formData.login.current_user.name
//    };
//    var svc = actionType === "delete" ? "open_data_service,pos_admin_service" : "open_data_service";
//    var msg = actionType === "delete" ? "save_business,delete_business" : "save_business";
//    app.xhr(request, svc, msg, {
//        load: true,
//        success: function (data) {
//            var resp = actionType === "delete" ? data.response.open_data_service_save_business.data : data.response.data;
//            var reason = actionType === "delete" ? data.response.open_data_service_save_business.reason : data.response.reason;
//            if (resp === "success") {
//                app.showMessage(app.context.action_success);
//                alert("Business settings changed, please sign in again");
//                app.logout();
//            }
//            else if (resp === "fail") {
//                app.showMessage(app.context.action_failed + " : " + reason);
//            }
//        }
//    });
//};
//

///////////////////////////////////////////////////////////////////////sale functionality


//App.prototype.generateReceipt = function() {
//	 var $frame = $("#receipt_area");
//	 var doc = $frame[0].contentWindow.document;
//	 var $body = $('body',doc);
//	 $body.html("<div id='receipt_iframe_area'></div>");
//	 $("#receipt_area_dummy").html("");
//	 var recArea = $("#receipt_iframe_area",doc);
//	 var elems = $(".sale_qtys");
//	 var totalCost = 0;
//	 var names = [];
//	 var amounts = [];
//	 var qtys = [];
//	 var subs = [];
//	 $.each(elems, function (elemIndex) {
//	        var elem = elems[elemIndex];
//            var prodId = elem.getAttribute("id");
//            var name = $("#prod_name_"+prodId).html();
//            var value = elem.value.trim() === "" ? 0 : parseInt(elem.value);
//            var sp = parseFloat($("#sale_span_" + prodId).html());
//            amounts.push(app.formatMoney(sp));
//            var cost = sp * value;
//            subs.push(app.formatMoney(cost));
//            qtys.push(value);
//            names.push(name);
//            totalCost = totalCost + cost;
//	    });
//	var bType = localStorage.getItem("business_type");
//	var recHeaders = ["Product","Price","Qty","S/Total"];
//	var recValues = [names,amounts,qtys,subs];
//	recValues[0].push("<b>Totals</b>");
//	recValues[1].push("<b>"+app.formatMoney(totalCost)+"</b>");
//	recValues[2].push("");
//	recValues[3].push("");
//	var bName = localStorage.getItem("business_name");
//	var header = "<div><h3>"+bName+"</h3></div>";
//	recArea.append(header);
//	app.ui.table({
//            id_to_append : "receipt_area_dummy",
//            headers : recHeaders,
//            values : recValues,
//        });
//	var username = localStorage.getItem("current_user");
//	var footer = "<div><span>Date : "+new Date().toLocaleString()+"</span><br/><span>Served by: "+username+"</span></div>";
//	recArea.append($("#receipt_area_dummy").html());//copy to iframe
//	recArea.append(footer);
//};
//
//App.prototype.printReceipt = function () {
//    if ($("#print_receipt")[0].checked) {
//        var win = document.getElementById("receipt_area").contentWindow;
//        win.focus();// focus on contentWindow is needed on some ie versions
//        win.print();
//    }
//};
//
//App.prototype.calculateCost = function () {
//    var elems = $(".sale_qtys");
//    var totalCost = 0;
//    $.each(elems, function (elemIndex) {
//        var elem = elems[elemIndex];
//        var prodId = elem.getAttribute("id");
//        var value = elem.value.trim() === "" ? 0 : parseInt(elem.value);
//        var sp = parseFloat($("#sale_span_" + prodId).html());
//        var cost = sp * value;
//        $("#sub_total_"+prodId).html(app.formatMoney(cost));
//        totalCost = totalCost + cost;
//    });
//    if(app.platform === "web"){
//    	app.generateReceipt();
//    }
//    $("#amount_due").html(app.formatMoney(totalCost));    
//};
//
//App.prototype.calculateChange = function () {
//    var amountDue = $("#amount_due").html();
//    var amountDueValue = amountDue.trim() === "" ? 0 : parseFloat(amountDue);
//    var amountIssued = $("#amount_issued").val();
//    var amountIssuedValue = amountIssued.trim() === "" ? 0 : parseFloat(amountIssued);
//    var change = amountIssuedValue - amountDueValue;
//    if (change > 0) {
//        $("#customer_change").html(app.formatMoney(change));
//    }
//    else {
//        $("#customer_change").html("0");
//    }
//};
//

//App.prototype.formatMoney = function (num) {
//    num = parseFloat(num);
//    var p = num.toFixed(2).split(".");
//    var chars = p[0].split("").reverse();
//    var newstr = '';
//    var count = 0;
//    for (var x in chars) {
//        count++;
//        if (count % 3 === 1 && count !== 1 && chars[x] !== "-") {
//            newstr = chars[x] + ',' + newstr;
//        } else {
//            newstr = chars[x] + newstr;
//        }
//    }
//    return newstr + "." + p[1];
//};

//App.prototype.rememberPrint = function () {
//    if ($("#print_receipt")[0].checked) {
//        localStorage.setItem("print_receipt", true);
//    }
//    else {
//        localStorage.setItem("print_receipt", false);
//    }
//};
//
////called when salesman selects an item from the auto suggest
//App.prototype.sale = function (data, index) {
//    //we need to display the selected items
//    //product name, type, SP/Unit, Available Stock,Expiry Date,sale qty
//    var id = data.ID[index];
//    //var name = "<span id='prod_name_'"+id+">"+data.PRODUCT_NAME[index]+"</span>";
//    var name = "<span id='prod_name_"+id+"'>"+data.PRODUCT_NAME[index]+"</span>";
//    var type = data.PRODUCT_TYPE[index];
//    var sp = "<span id=sale_span_" + id + ">" + app.formatMoney(data.SP_UNIT_COST[index]) + "</span>";
//    var elem = document.getElementById(id);
//    if(elem){ //increase quantity
//    	var value = elem.value;
//    	value++;
//    	elem.value = value;
//    	app.calculateCost();
//    	app.calculateChange();
//    	return;
//    }
//    var bcolor = parseInt(data.PRODUCT_QTY[index]) < parseInt(data.PRODUCT_REMIND_LIMIT[index]) ? "orange" : "white"; //show color
//    var style = bcolor === "orange" ? "background : " + bcolor + ";padding-left :10px;padding-right : 10px;color : white" : "";
//    var avail = "<span id=sale_stock_" + id + " style='" + style + "'>" + data.PRODUCT_QTY[index] + "</span>";
//    
//    var exp = new Date(data.PRODUCT_EXPIRY_DATE[index]).toLocaleDateString();
//    var extraStyle = app.platform === "mobile" ? "style='width : 100px'" : "";
//    var qty = "<input type='number' value=1 class='sale_qtys' "+extraStyle+" \n\
//                onkeyup='app.calculateCost();app.calculateChange()' onchange='app.calculateCost();app.calculateChange()' class='form-control' id=" + id + " >";
//    var sub = "<span id='sub_total_"+id+"'>"+data.SP_UNIT_COST[index]+"</span>";
//    var allItems = app.context.product.fields.search_products.autocomplete.selected;
//    var bType = app.appData.formData.login.current_user.business_type;
//    
//    if(app.platform === "mobile"){
//    	!allItems[0] ? allItems[0] = [name] : allItems[0].push(name);
//        !allItems[1] ? allItems[1] = [sp] : allItems[1].push(sp);
//        !allItems[2] ? allItems[2] = [avail] : allItems[2].push(avail);
//        !allItems[3] ? allItems[3] = [qty] : allItems[3].push(qty);
//    }
//    
//    else if (bType === "goods") {
//        !allItems[0] ? allItems[0] = [name] : allItems[0].push(name);
//        !allItems[1] ? allItems[1] = [type] : allItems[1].push(type);
//        !allItems[2] ? allItems[2] = [sp] : allItems[2].push(sp);
//        !allItems[3] ? allItems[3] = [avail] : allItems[3].push(avail);
//        !allItems[4] ? allItems[4] = [exp] : allItems[4].push(exp);
//        !allItems[5] ? allItems[5] = [qty] : allItems[5].push(qty);
//        !allItems[6] ? allItems[6] = [sub] : allItems[6].push(sub);
//    }
//    else {
//    	//services
//        var x = 0;
//        !allItems[x] ? allItems[x] = [name] : allItems[x].push(name);
//        x++;
//        !allItems[x] ? allItems[x] = [type] : allItems[x].push(type);
//        if(localStorage.getItem("track_stock") === "1"){
//            x++;
//           !allItems[x] ? allItems[x] = [avail] : allItems[x].push(avail);
//        }
//        x++;
//        !allItems[x] ? allItems[x] = [sp] : allItems[x].push(sp);
//        x++;
//        !allItems[x] ? allItems[x] = [qty] : allItems[x].push(qty);
//        x++;
//        !allItems[x] ? allItems[x] = [sub] : allItems[x].push(sub);
//    }
//    
//    var headers;
//    if(app.platform === "mobile"){
//    	headers = ["Name","SP/U","Stock","Qty"];
//    }
//    else if (bType === "goods") {
//        headers = ["Product Name", "Type", "SP/Unit", "Available Stock", "Expiry Date", "Sale Quantity","Sub Total"];
//    }
//    else if (bType === "services") {
//        if(localStorage.getItem("track_stock") === "1"){
//            headers = ["Product Name", "Type","Available Stock" , "SP/Unit", "Sale Quantity","Sub Total"];
//        }
//        else {
//            headers = ["Product Name", "Type", "SP/Unit", "Sale Quantity","Sub Total"];
//        }
//    }
//    
//    $("#sale_area").html("");
//    app.ui.table({
//        id_to_append : "sale_area",
//        headers : headers,
//        values : allItems,
//        include_nums : false,
//        style : "font-size:16px",
//        mobile_collapse : false
//    });
//    
//    var printReceipt = localStorage.getItem("print_receipt") === "true" ? "checked='checked'" : "";
//    var rct = app.platform === "web" ? "<td><input type='checkbox' id='print_receipt' "+printReceipt+" onclick='app.rememberPrint()' ></td>" : "";
//    var rctHeader = app.platform === "web" ? "<th>Print Receipt</th>" : "";
//    
//    var html = "<table class='table amount_area' >" +
//            "<tr>" +
//            "<th>Due</th>" +
//            "<th>Issued</th>" +
//            "<th>Change</th>" +
//             rctHeader +
//            "</tr>" +
//            "<tr>" +
//            "<td id='amount_due'>0</td>" +
//            "<td><input type='number' value='0' onkeyup='app.calculateChange()' onchange='app.calculateChange()' id='amount_issued' class='form-control'></td>" +
//            "<td id='customer_change'>0</td>" +
//             rct + 
//            "</tr>" +
//            "</table>";
//    //generate the print receipt area
//
//    var amountTable = $(html);
//    $("#sale_area").append(amountTable);
//    app.calculateCost();
//};


//
//App.prototype.stockExpiry = function (handler) {
//    app.xhr({}, app.dominant_privilege, "stock_expiry", {
//        load: true,
//        success: function (data) {
//            var resp = data.response.data;
//            //name,username,narr,time,type
//            app.paginate({
//                title: "Stock Expiry",
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: handler,
//                onload: function () {
//                    app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers : ["Product Name", "Expiry Date", "Date Entered"],
//                        values : [resp.PRODUCT_NAME, resp.PRODUCT_EXPIRY_DATE, resp.CREATED],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true
//                    });
//                }
//            });
//        }
//    });
//};
//
//App.prototype.stockLow = function (handler) {
//    app.xhr({}, app.dominant_privilege, "stock_low", {
//        load: true,
//        success: function (data) {
//            var resp = data.response.data;
//            //name,username,narr,time,type
//            app.paginate({
//                title: "Stock Running Low",
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: handler,
//                onload: function () {
//                    app.ui.table({
//                        id_to_append : "paginate_body",
//                        headers : ["Product Name", "Product Quantity", "Product Remind Limit", "Date Entered"],
//                        values : [resp.PRODUCT_NAME, resp.PRODUCT_QTY, resp.PRODUCT_REMIND_LIMIT, resp.CREATED],
//                        include_nums : true,
//                        style : "",
//                        mobile_collapse : true
//                    });
//                }
//            });
//        }
//    });
//};

//
//App.prototype.todaySales = function () {
//    var dateStr = new Date().toISOString();
//    var date = dateStr.substring(0, dateStr.indexOf("T"));
//    var request = {
//        id: "all",
//        user_name: app.appData.formData.login.current_user.name,
//        begin_date: date,
//        end_date: date,
//        report_type : "stock_history"
//    };
//    app.xhr(request, app.dominant_privilege, "stock_history", {
//        load: true,
//        success: function (data) {
//
//            var resp = data.response.data;
//            //name,username,narr,time,type
//            app.paginate({
//                title: "Todays Sales",
//                save_state: true,
//                save_state_area: "content_area",
//                onload_handler: app.pages.sale,
//                onload: function () {
//                    var totalQty = 0;
//                    var totalAmount = 0;
//                    var undos = [];
//
//                    for (var index = 0; index < resp.TRAN_FLAG.length; index++) {
//                        var flag = resp.TRAN_FLAG[index];
//                        var undo = "<a href='#' onclick='app.undoSale(\"" + resp.PRODUCT_ID[index] + "\",\"" + resp.STOCK_QTY[index] + "\")' \n\
//                        			title='Undo sale'>Undo Sale</a>";
//                        var color, span, qty, amount;
//                        if (flag === "sale_to_customer") {
//                            color = "red";
//                            span = "Sale To Customer";
//                            undos.push(undo);
//                            qty = parseInt(resp.STOCK_QTY[index]);
//                            amount = parseFloat(resp.STOCK_COST_SP[index]);
//                        }
//                        else if (flag === "reversal_of_sale") {
//                            color = "green";
//                            span = "Customer Returned Stock ";
//                            undos.push("");
//                            qty = -parseInt(resp.STOCK_QTY[index]);
//                            amount = -parseFloat(resp.STOCK_COST_SP[index]);
//                        }
//                        else {
//                            //this is a different flag e.g new_stock
//                            //dont show it
//                            resp.PRODUCT_NAME.splice(index, 1);
//                            resp.TRAN_TYPE.splice(index, 1);
//                            resp.STOCK_QTY.splice(index, 1);
//                            resp.STOCK_COST_SP.splice(index, 1);
//                            resp.NARRATION.splice(index, 1);
//                            resp.CREATED.splice(index, 1);
//                            resp.TRAN_FLAG.splice(index, 1);
//                            index--; //we do this to filter out stock increases from sales
//                            continue;
//                        }
//
//                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
//                        var time = new Date(resp.CREATED[index]).toLocaleTimeString();
//                        resp.CREATED[index] = time;
//                        resp.STOCK_COST_SP[index] = app.formatMoney(amount);
//                        resp.STOCK_QTY[index] = qty;
//                        totalQty = totalQty + qty;
//                        totalAmount = totalAmount + amount;
//
//
//                    }
//                    resp.STOCK_COST_SP.push("<b>" + app.formatMoney(totalAmount) + "</b>");
//                    resp.STOCK_QTY.push("<b>" + totalQty + "</b>");
//                    resp.PRODUCT_NAME.push("");
//                    resp.TRAN_TYPE.push("<b>Totals</b>");
//                    resp.NARRATION.push("");
//                    resp.CREATED.push("");
//                    app.ui.table({
//                        id_to_append: "paginate_body",
//                        headers: ["Product Name", "Entry Type", "Sale Qty", "Amount Received", "Narration", "Entry Time", "Undo Sale"],
//                        values: [resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.STOCK_QTY, resp.STOCK_COST_SP, resp.NARRATION, resp.CREATED, undos],
//                        include_nums: true,
//                        style: "",
//                        mobile_collapse: true,
//                        summarize: {
//                            cols: [4],
//                            lengths: [80]
//                        }
//                    });
//                }
//            });
//        }
//    });
//};
//

//
//App.prototype.undoSale = function (prodId, prodQty) {
//    var html = "<input type='text' class='form-control' id='undo_sale_narr' placeholder='Reason for Reversal'>";
//    var m = app.ui.modal(html, "Undo Transaction", {
//        ok: function () {
//            var narr = $("#undo_sale_narr").val();
//            var prodIds = [prodId];
//            var qtys = [prodQty];
//            var request = {
//                product_ids: prodIds,
//                product_qtys: qtys,
//                tran_type: "1",
//                narration: narr,
//                tran_flag: "reversal_of_sale"
//            };
//            //do some stuff like saving to the server
//            app.xhr(request, app.dominant_privilege, "transact", {
//                load: true,
//                success: function (data) {
//                    var resp = data.response.data;
//                    m.modal('hide');
//                    if (resp === "success") {
//                        //well transaction successful
//                        app.showMessage(app.context.reverse_success);
//                    }
//                    else if (resp === "fail") {
//                        app.showMessage(app.context.transact_fail);
//                    }
//                },
//                error: function () {
//                    //do something 
//                    app.showMessage(app.context.error_message);
//                }
//            });
//        },
//        cancel: function () {
//            //what to do?
//        },
//        okText: "Proceed",
//        cancelText: "Cancel"
//    });
//};

//
//App.prototype.clearSale = function () {
//    $("#sale_area").html("");
//    app.context.product.fields.search_products.autocomplete.selected = [];
//};
//
//App.prototype.commitSale = function () {
//    //do more stuff
//    var elems = $(".sale_qtys");
//    var prodIds = [];
//    var qtys = [];
//    var bType = app.appData.formData.login.current_user.business_type;
//    for (var x = 0; x < elems.length; x++) {
//        var elem = elems[x];
//        var prodId = elem.getAttribute("id");
//        var qty = elem.value.trim() === "" ? 0 : parseInt(elem.value);
//        var availStock = parseInt($("#sale_stock_" + prodId).html());
//        if (qty <= 0) {
//            app.showMessage(app.context.invalid_qty);
//            elem.focus();
//            return;
//        }
//        else if (qty > availStock && localStorage.getItem("track_stock") === "1") {
//            app.showMessage(app.context.insufficient_stock);
//            elem.focus();
//            return;
//        }
//        else {
//            prodIds.push(prodId);
//            qtys.push(qty);
//        }
//
//    }
//
//    if (prodIds.length === 0) {
//        app.showMessage(app.context.no_product_selected);
//        return;
//    }
//    
//    var m = app.ui.modal(app.context.commit_sale, "Commit Sale", {
//        ok: function () {
//        	 var request = {
//        		        product_ids: prodIds,
//        		        product_qtys: qtys,
//        		        tran_type: "0",
//        		        tran_flag: "sale_to_customer",
//        		        business_type: app.appData.formData.login.current_user.business_type
//        		    };
//        		    //do some stuff like saving to the server
//        		    app.xhr(request, app.dominant_privilege, "transact", {
//        		        load: true,
//        		        success: function (data) {
//        		            var resp = data.response.data;
//        		            if (resp === "success") {
//        		                //well transaction successful
//        		            	if(app.platform === "web"){
//                                    app.printReceipt();
//        		            	}
//        		                app.clearSale();
//        		                app.showMessage(app.context.transact_success);
//        		            }
//        		            else if (resp === "fail") {
//        		                app.showMessage(app.context.transact_fail);
//        		            }
//        		        }
//        		    });
//        		    m.modal('hide');
//        },
//        cancel: function () {
//          //do nothing
//        },
//        okText: "Proceed",
//        cancelText: "Cancel"
//    });
//    app.runLater(500,function(){
//    	$("#modal_area_button_ok").focus();	
//    });
//    
//};
//
//App.prototype.runLater = function (time, func) {
//    return setTimeout(func, time);
//};
//
//
//
//window.app = new App();

