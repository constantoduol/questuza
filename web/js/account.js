App.prototype.logout = function () {
    var index =  "index.html";
    var requestData = {
        user_name: app.appData.formData.login.current_user.name
    };
    app.xhr(requestData, "open_data_service", "logout", {
        load: true,
        success: function (data) {
            //login again
            localStorage.removeItem("session_id");
            localStorage.removeItem("current_user");
            localStorage.removeItem("privileges");
            localStorage.removeItem("host");
            localStorage.removeItem("business_name");
            localStorage.removeItem("business_id");
            localStorage.removeItem("business_type");
            localStorage.removeItem("settings");
            window.location = index;
        },
        error: function () {
            //do something 
            $("#" + app.context.error_space).html(app.context.error_message);
        }
    });
};


App.prototype.changePin = function () {
    app.context = app.appData.formData.change_pass;
    var data = app.getFormData(app.context);
    if (!data)
        return;
    if (data.new_pin.value !== data.confirm_new_pin.value) {
        //do something cool
        app.showMessage(app.context.passwords_not_match);
        return;
    }
    var reg = /^[0-9]/;
    var valid = reg.test(data.confirm_new_pin.value);
    if (!valid) {
        app.showMessage(app.context.password_not_valid);
        return;
    }
    var requestData = {
        user_name: data.user_name.value,
        old_password: data.old_pin.value,
        new_password: data.new_pin.value,
        confirm_password: data.confirm_new_pin.value
    };
    app.xhr(requestData, "open_data_service", "changepass", {
        load: true,
        success: function (data) {
            if (data.response.data === true) {
                //login again
                window.location = "index.html";
            }
            else {
                app.briefShow({
                    title : "Info",
                    content : app.context.messages["false"]
                });
            }
        }
    });
    return false;
};


App.prototype.login = function () {
    var data = app.getFormData(app.context);
    if (!data) return;
    var requestData = {
        username: data.username.value,
        password: data.password.value,
        user_interface : "touch"
    };
    app.xhr(requestData, "open_data_service", "login", {
        load: true,
        success: function (resp) {
            var l = resp.response.data;
            var request = {
                username: l.user,
                user_interface: "touch"
            };
            app.xhr(request,"open_data_service","business_info",{
                load : true,
                success : function(data){
                    var bInfo = data.response.data;
                    if (l.response === "loginsuccess") {
                        //get the session id
                        localStorage.setItem("session_id", l.rand);
                        localStorage.setItem("current_user", l.user);
                        localStorage.setItem("privileges", l.privileges);
                        localStorage.setItem("host", l.host);
                        app.navigate(l.privileges, bInfo);
                    }
                    else if (l === "changepass") {
                        window.location = "change.html?user_name=" + data.username.value;
                    }
                    else {
                        app.briefShow({
                            title: "Info",
                            content: app.context.messages[l]
                        });
                    }
                }
            });
        }
    });
    return false;
};




App.prototype.navigate = function (privileges, buss) {
    var adminIndex = privileges.indexOf("pos_admin_service");
    var saleIndex = privileges.indexOf("pos_sale_service");
    var interIndex = privileges.indexOf("pos_middle_service");
    var saleUrl = "sale.html";
    //if you have more than one business id, navigate to the correct one
    if (adminIndex > -1 && saleIndex > -1) {
        //you have to select because you have both privileges
        var html = "<select id='select_role'>\n\
                    <option value='seller'>Seller</option>\n\
                    <option value='admin'>Admin</option></select>";

        var m = app.ui.modal(html, "Select Role", {
            ok: function () {
                var role = $("#select_role").val();
                m.modal('hide');
                $(".modal-backdrop").remove();
                if (role === "seller") {
                    app.navigateBusiness(buss,saleUrl);
                }
                else if (role === "admin") {
                    app.navigateBusiness(buss, "admin.html");
                }
            },
            cancel: function () {

            },
            okText: "Proceed",
            cancelText: "Cancel"
        });

    }
    else if (adminIndex > -1) {
        //you're only an admin
        app.navigateBusiness(buss, "admin.html");
    }
    else if (saleIndex > -1 || interIndex > -1) {
        //you're a salesperson 
        app.navigateBusiness(buss,saleUrl);
    }
    else {
        //you have nothing...
        //no privileges found
        //thats strange
    }
};

App.prototype.navigateBusiness = function (buss, url) {
    if (buss.business_ids && buss.business_ids.length === 1) {
        window.location = url;
        localStorage.setItem("business_id", buss.business_ids[0]);
        localStorage.setItem("business_type", buss.business_types[0]);
        localStorage.setItem("business_name", buss.business_names[0]);
        localStorage.setItem("business_extra_data",buss.business_extra_data[0]);
    }
    else if (buss.business_ids && buss.business_ids.length > 1) {
        var options = "";
        for (var x = 0; x < buss.business_names.length; x++) {
            var option = "<option value=" + buss.business_ids[x] + ">" + buss.business_names[x] + "</option>";
            options = options + option;
        }
        var html = "<select id='select_business_id'>" + options + "</select>";
        var m = app.ui.modal(html, "Select Business", {
            ok: function () {
                var businessId = $("#select_business_id").val();
                var businessType = buss.business_types[buss.business_ids.indexOf(businessId)];
                var businessName = buss.business_names[buss.business_ids.indexOf(businessId)];
                var busExtra = buss.business_extra_data[buss.business_ids.indexOf(businessId)];
                localStorage.setItem("business_type", businessType);
                localStorage.setItem("business_id", businessId);
                localStorage.setItem("business_name", businessName);
                localStorage.setItem("business_extra_data",busExtra);
                window.location = url;
            },
            okText: "Proceed",
            cancelText: "Cancel"
        });

    }
    else {
       //you have no business at all
       console.log("no business set");
       window.location = url;
       
    }
};

App.prototype.appSettings = function(){
    var m = app.ui.modal("","Settings",{
        okText : "Save",
        cancelText : "Cancel"
    });
    app.loadPage({
        load_url: app.pages.app_settings,
        load_area: "modal_content_area",
        onload: function () {

        }
    });
};
