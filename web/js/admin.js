App.prototype.brand = function(){
  var html = "This product is a trademark of Quest Pico at \n\
        <a href='http://www.questpico.com'>www.questpico.com</a><br/>Talk\n\
         to us today at <a href='mailto:info@questpico.com'>info@questpico.com</a>\n\
        <br>Call us today : +254 771 048 762";
  app.ui.modal(html,"About",{
      cancelText : "Done"
  });  
};

App.prototype.activateProduct = function(){
    var html = "<label for='business_name'>Business Name</label>" +
        "<input type='text' id='business_name' class='form-control'>" +
        "<label for='activation_key'>Activation Key</label>" +
        "<input type='text' id='activation_key' class='form-control'>";
    app.ui.modal(html,"Activate Product",{
        okText : "Activate",
        ok : function(){
            var name = $("#business_name").val().trim();
            var key = $("#activation_key").val().trim();
            if(name === "" || key === "") {
                alert("Both business name and activation key are required");
                return;
            }
            var request = {
                business_name : name,
                activation_key : key
            };
            app.xhr(request,"open_data_service","activate_product",{
                load : true,
                success : function(data){
                    var resp = data.response.data;
                    var date = new Date(parseInt(resp.expiry)).toLocaleString();
                    var show = "Congratulations, Your product is activated!<br> \n\
                        Restart your computer to finish activation.<br>Expires: "+date+" \n\
                        <br>Version: "+resp.version_name+"\n\
                        <br>Version No : "+resp.version_no+"";
                    $("#modal_content_area").html(show);
                    $("#modal_area_button_ok").html("Done");
                    $("#modal_area_button_ok").unbind("click");
                    $("#modal_area_button_ok").click(app.logout);
                }

            });

        }
    });
};

App.prototype.saveSettings = function(){
    var data = app.getFormData(app.context.settings);
    if (!data) return;
    var request = {};
    $.each(app.settings,function(key){
        request[key] = data[key].value;
    });
    app.xhr(request, "open_data_service", "save_settings", {
        load: false,
        success: function (resp) {
            var r = resp.response.data;
            if (r === "success") {
                app.briefShow({
                    title : "Info",
                    content : "Settings saved successfully"
                });
                app.fetchSettings();
            }
            else if (r === "fail") {
                app.briefShow({
                    title: "Info",
                    content : resp.response.reason
                });
            }
        }
    });
};


App.prototype.loadSettings = function () {
    app.context.settings.fields = app.settings;
    var settingsArea = $("#settings_area");
    //$("#paginate_body").append(settingsArea);
    //render settings from app.settings
    $.each(app.settings, function (setting) {
        app.renderDom(app.settings[setting], settingsArea);
    });
    //load the currencies
    var currArea = $('#currency');
    $.each(app.currencies,function(curr){
        var country = app.currencies[curr].name;
        currArea.append("<option value="+curr+">"+country+"</option>");
    });
    app.xhr({}, "open_data_service", "fetch_settings", {
        load: false,
        success: function (resp) {
            var r = resp.response.data;
            $.each(r.CONF_KEY, function (x) {
                $("#" + r.CONF_KEY[x]).val(r.CONF_VALUE[x]);
            });
        }
    });
};



App.prototype.updateUser = function () {
    var data = app.getFormData(app.context.user);
    if (!data)
        return;
    var role = data.user_role.value;
    var priv;
    if(role === "admin"){
        priv = ["pos_admin_service", "user_service"];
    }
    else if(role === "intermediate"){
        priv = ["pos_middle_service"];
    }
    else if(role === "seller"){
        priv = ["pos_sale_service"];
    }
    var requestData = {
        user_name: data.email_address.value,
        host: "localhost",
        group: role,
        privs: priv
    };
    app.xhr(requestData, "user_service", "edit_user", {
        load: true,
        success: function (data) {
            //say the user was created
            if (data.response.data === "success") {
                app.showMessage(app.context.update_user);
            }
            else if (data.response.data === "fail") {
                app.showMessage(data.response.reason);
            }
            else if (data.response.type === "exception") {
                app.showMessage(data.response.ex_reason);
            }
        },
    });
};

App.prototype.generalUserRequest = function (msg) {
    var data = app.getFormData(app.context.user);
    if (!data) return;
    var successMsg,confirmMsg;
    if(msg === "delete_user"){
        successMsg = app.context.delete_user;
        confirmMsg = app.context.delete_user_confirm;
    }
    else if(msg === "disable_user"){
        successMsg = app.context.disable_user;
        confirmMsg = app.context.disable_user_confirm; 
    }
    else if(msg === "enable_user"){
        successMsg = app.context.enable_user;
        confirmMsg = app.context.enable_user_confirm; 
    }
    var conf = confirm(confirmMsg);
    if(!conf) return;
    var requestData = {
        name: data.email_address.value
    };
    app.xhr(requestData, "user_service", msg, {
        load: true,
        success: function (data) {
            if (data.response.data === "success") {
                app.showMessage(successMsg);
            }
            else if (data.response.type === "exception") {
                app.showMessage(data.response.ex_reason);
            }
            else if (data.response.data === "fail") {
                app.showMessage(data.response.reason);
            }
            //save the local data
        }
    });
};





App.prototype.createUser = function () {
    var data = app.getFormData(app.context.user);
    if (!data)
        return;
    var role = data.user_role.value;
    var priv;
    if(role === "admin"){
        priv = ["pos_admin_service", "user_service"];
    }
    else if(role === "intermediate"){
        priv = ["pos_middle_service"];
    }
    else if(role === "seller"){
        priv = ["pos_sale_service"];
    }
    var pin = Math.floor(Math.random()*100000);
    var requestData = {
        name: data.email_address.value,
        host: app.appData.formData.login.current_user.host,
        group: role,
        privs: priv,
        real_name : data.real_name.value,
        password : pin,
        user_interface : "touch"
    };
    app.xhr(requestData, "open_data_service", "create_account", {
        load: true,
        success: function (data) {
            if (data.response.data === "success") {
                alert("User created, PIN is : "+pin);
            }
            else if (data.response.data === "fail") {
                app.showMessage(data.response.reason);
            }
            //save the local data
        }
    });


};


App.prototype.resetPassword = function () {
    var data = app.getFormData(app.context.user);
    if (!data)
        return;
    var interface = "touch";
    var requestData = {
        name: data.email_address.value,
        user_interface : "touch"
    };
    app.xhr(requestData, "user_service", "reset_pass", {
        load: true,
        success: function (data) {
            if (data.response.data === "success") {
                if(interface === "touch"){
                    alert("PIN reset successful, PIN is : "+data.response.reason);
                }
                else {
                    app.showMessage(app.context.reset_password);
                }
            }
            else if (data.response.data === "fail") {
                app.showMessage(data.response.reason);
            }
            else if (data.response.type === "exception") {
                app.showMessage(data.response.ex_reason);
            }
        }
    });
};

App.prototype.allUsers = function () {
    app.xhr({}, app.dominant_privilege, "all_users", {
        load: true,
        success: function (data) {
            var title = "All Users";
            //var names = data.response.pos_admin_service_all_users.data.USER_NAME;
            var userData = data.response.data;
            var names = userData.USER_NAME;
            var privs = [];
            var created = [];
            $.each(names,function(index){
                var name = names[index];
                var x = names.indexOf(name);
                var priv;
                if (userData.privileges[x].indexOf("pos_admin_service") > -1) {
                    priv = "Admin";
                }
                else if (userData.privileges[x].indexOf("pos_sale_service") > -1) {
                    priv = "Seller";
                }
                else if (userData.privileges[x].indexOf("pos_middle_service") > -1) {
                    priv = "Cashier";
                }
                privs[index] = priv;
                created[index] = app.formatDate(userData.CREATED[x]);
                
            });
            

            app.paginate({
                title: title,
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.users,
                onload: function () {
                     app.ui.table({
                        id_to_append : "paginate_body",
                        headers :  ["Email Address", "User Role", "Date Created"],
                        values :  [names, privs,created],
                        include_nums : true,
                        style : "",
                        mobile_collapse : true
                    });
                }
            });
        }
    });
};



App.prototype.addResource = function () {
    var data = app.getFormData(app.context.expense);
    if (!data) return;
    var request = {
        resource_type: data.resource_type.value,
        resource_name: data.expense_name.value,
        resource_amount: data.expense_amount.value
    };
    var conf = confirm("Add "+data.resource_type.value+" ?");
    if(!conf) return;
    app.xhr(request, app.dominant_privilege, "add_resource", {
        load: true,
        success: function (resp) {
            if (resp.response.data === "success") {
                app.showMessage(app.context.resource_success.replace("{resource_type}", data.resource_type.value));
            }
            else if (resp.response.data === "fail") {
                app.showMessage(data.response.reason);
            }

        }
    });

};



App.prototype.profitAndLoss = function () {
    var data = app.getFormData(app.context.profit_and_loss);
    if (!data)
        return;
    var request = {
        start_date: data.start_date.value,
        end_date: data.end_date.value,
        business_type : app.getSetting("business_type")
    };
    app.xhr(request, app.dominant_privilege, "profit_and_loss", {
        load: true,
        success: function (resp) {
            var pandl = resp.response.data;
            var startDate = app.formatDate(data.start_date.value,true);
            var endDate = app.formatDate(data.end_date.value,true);
            app.paginate({
                save_state: true,
                save_state_area: "content_area",
                title: "Profit And Loss between " + startDate + " and " + endDate + " ",
                onload_handler: app.pages.expenses,
                onload: function () {
                    var items = ["<b>Sales</b>", "<b>Opening Stock</b>", "<b>Purchases</b>",
                        "<b>Less Closing Stock</b>", "<b>Cost of Goods sold</b>", "<b>Gross Profit</b>", "<b>Expenses</b>"];
                    var types = [1, 0, 0, 0, 0, 1, ""];
                    var costOfGoodsSold = pandl.opening_stock + pandl.cost_of_goods_bought_bp - pandl.closing_stock;
                    var grossProfit = pandl.cost_of_goods_sold_sp - costOfGoodsSold;
                    var values = [pandl.cost_of_goods_sold_sp, pandl.opening_stock, pandl.cost_of_goods_bought_bp, pandl.closing_stock, costOfGoodsSold, grossProfit, ""];
                    var debits = [];
                    var credits = [];
                    var totalExpenses = 0;
                    var totalIncomes = 0;
                    $.each(pandl.resource_data.RESOURCE_TYPE, function (index) {
                        var type = pandl.resource_data.RESOURCE_TYPE[index];
                        if (type === "expense") {
                            var rName = pandl.resource_data.RESOURCE_NAME[index];
                            var rAmount = parseFloat(pandl.resource_data.RESOURCE_AMOUNT[index]);
                            var index = items.indexOf(rName);
                            if(index > -1){
                               values[index] = values[index] + rAmount;
                            }
                            else {
                                items.push(rName);
                                values.push(rAmount);
                                types.push(0);
                            }
                            totalExpenses += rAmount;
                        }
                    });

                    items.push("<b>Incomes</b>");
                    types.push("");
                    values.push("");
                    $.each(pandl.resource_data.RESOURCE_TYPE, function (index) {
                        var type = pandl.resource_data.RESOURCE_TYPE[index];
                        if (type === "income") {
                            var rName = pandl.resource_data.RESOURCE_NAME[index];
                            var rAmount = parseFloat(pandl.resource_data.RESOURCE_AMOUNT[index]);
                            var index = items.indexOf(rName);
                            if(index > -1){
                               values[index] = values[index] + rAmount;
                            }
                            else {
                                items.push(rName);
                                values.push(rAmount);
                                types.push(1);
                            }
                            totalIncomes += rAmount;
                        }
                    });

                    var netProfit = grossProfit + totalIncomes - totalExpenses;
                    items.push("<b>Net Profit</b>");
                    types.push(1);
                    values.push(netProfit);
                    $.each(items, function (index) {
                        if (types[index] === 1) {
                            //this is a credit
                            credits.push(app.formatMoney(values[index]));
                            debits.push("");
                        }
                        else if (types[index] === 0) {
                            debits.push(app.formatMoney(values[index]));
                            credits.push("");
                        }
                        else {
                            credits.push("");
                            debits.push("");
                        }
                    });
                    var curr = app.getSetting("currency");
                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers :  ["Items", curr, curr],
                        values :  [items, debits, credits],
                        include_nums : false,
                        style : ""
                    });
                }
            });

            //cost of sales : 100000 
            //opening stock : 10000
            //purchases :    30000
            //closing stock : 10000
            //cost of goods sold : 30000
            //gross profit :    70000
            //expenses : 
            //  rent :  3000
            //  elect : 4000
            //incomes : 
            //  stuff :      2000
            //  more stuff : 3000
            //net profit : 52000
            //
        }
    });



};

App.prototype.supplierSelect = function(){
    var prodId = $("#search_products").attr("current-item");
    var name = $("#product_name").val();
    if(!prodId){
        app.showMessage(app.context.no_product_selected);
        return;
    }
    app.paginate({
        title: "Select Suppliers for "+name,
        save_state: true,
        save_state_area: "content_area",
        onload_handler: app.pages.products,
        onload: function () {
            $("#paginate_print").remove(); //remove the print button
            app.loadPage({
                load_url: app.pages.supplier_select,
                load_area: "paginate_body",
                onload: function () {
                   //fetch the suppliers this product has
                    //setup click handlers
                    $("#supplier_add_btn").click(function(){
                        app.supplierAndProduct("create",prodId);
                    });
                    app.supplierAndProduct("fetch_all",prodId);
                }
            });
        }
    });
};




App.prototype.supplierAndProduct = function(actionType,prodId,supId){
    if(actionType === "create"){
        supId = $("#search_suppliers").attr("current-item");
        if(!supId) {
            app.showMessage(app.context.no_supplier_selected);
            return;
        }
    }
    else if(actionType === "delete"){
        var conf = confirm("Remove supplier ?");
        if(!conf) return;
    }

    var request = {
        action_type : actionType,
        supplier_id : supId,
        product_id : prodId
    };
    app.xhr(request,app.dominant_privilege,"supplier_and_product",{
        load : true,
        success : function(data){
            var resp = data.response.data;
            if(actionType === "create" && resp === "success"){
                app.showMessage(app.context.supplier_added);
                app.supplierAndProduct("fetch_all",prodId);
            }
            else if(actionType === "delete" && resp === "success"){
                app.showMessage(app.context.supplier_deleted);
                app.supplierAndProduct("fetch_all",prodId);
            }
            else if(actionType === "fetch_all"){
                $("#supplier_area").html("<h4>Current Suppliers</h4>");
                var ID = $.extend(true, [], resp.SUPPLIER_ID);
                app.ui.table({
                    id_to_append : "supplier_area",
                    headers :  ["Name","Account","Remove"],
                    values :  [resp.SUPPLIER_NAME,resp.SUPPLIER_ID, ID],
                    include_nums : true,
                    style : "",
                    mobile_collapse : true,
                    transform : {
                        1 : function(supId,index){
                            var name = encodeURIComponent(resp.SUPPLIER_NAME[index]);
                            return "<a href='#' onclick=app.supplierAccount('"+prodId+"','"+supId+"','"+name+"')>Account</a>";
                        },
                        2 : function(value){
                            return "<a href='#' onclick=app.supplierAndProduct('delete','"+prodId+"','"+value+"')>Remove</a>";
                        }
                    }
                });
            }
            else {
                app.showMessage(data.response.reason);
            }
        }
    });
};


App.prototype.supplierAccount = function(prodId,supId,name){
    name = decodeURIComponent(name);
    var m = app.ui.modal("","Supplier Account",{
        okText : "Proceed",
        ok : function(){
            var data = app.getFormData(app.context.supplier_account);
            if(!data) return;
            var request = {
                entry_type : data.entry_type.value,
                payment_mode : data.payment_mode.value,
                amount : data.amount.value,
                narration : data.narration.value,
                units_received : data.units_received.value,
                sp_per_unit : data.sp_per_unit.value,
                supplier_id : supId,
                product_id : prodId,
                business_type : app.getSetting("business_type")
            };
            app.xhr(request,app.dominant_privilege,"supplier_account_transact",{
                load : true,
                success : function (data) {
                    var resp = data.response.data;
                    if(resp === "success"){
                        app.showMessage(app.context.supplier_transact);
                    }
                    else if(resp === "fail"){
                        app.showMessage(data.response.reason);
                    }
                    m.modal('hide');
                }
            });
        }
    });
    app.loadPage({
        load_url: app.pages.supplier_account,
        load_area: "modal_content_area",
        onload : function(){
            $("#supplier_account_name").html(name);
            if(app.getSetting("business_type") === "services"){
                $("#units_received").val("0");
                $("#sp_per_unit").val("0");
                $("#units_received").css("display","none");
                $("#sp_per_unit").css("display","none");
                $("#units_received_lbl").css("display","none");
                $("#sp_per_unit_lbl").css("display","none");
            }
        }
    });
};


App.prototype.allSuppliers = function(){
    app.xhr({},app.dominant_privilege,"all_suppliers",{
        load : true,
        success : function(data){
            var r = data.response.data;
            app.paginate({
                save_state : true,
                save_state_area : "content_area",
                title : "Suppliers",
                onload_handler : app.pages.suppliers,
                onload : function(){
                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers :  ["Name","Phone","Email","Address","Website","Contact Name","Contact Phone","City","Country"],
                        values :  [r.SUPPLIER_NAME, r.PHONE_NUMBER, r.EMAIL_ADDRESS, r.POSTAL_ADDRESS, r.WEBSITE,
                            r.CONTACT_PERSON_NAME, r.CONTACT_PERSON_PHONE, r.CITY, r.COUNTRY],
                        include_nums : true,
                        style : "",
                        mobile_collapse : true
                    });
                }
            });
        }
    });
};


App.prototype.gridEdit = function(ids,columns,headers,values){
    headers.shift(); //remove the No header
    $("#paginate_body").html("");//empty the area
    app.newGrid({
        id : "paginate_body",
        col_names : headers,
        load_column_by_column : true, 
        init_data : values,
        disabled : [0,1,11,12],
        col_types: function () {
            var types = [];
            $.each(headers, function (index) {
                var width = 80;
                width = headers[index] === "Product Name" ? 200 : width;
                types.push({
                    type: 'text',
                    width: width
                });
            });
            return types;
        },
        onEdit : function(row,col,oldValue,newValue){
           //do a delayed save
           app.runLater(1000,function(){
               var request = {
                   id : ids[row],
                   old_value : oldValue,
                   new_value : newValue,
                   column : columns[col],
                   business_type : app.getSetting("business_type")
               };
               app.xhr(request,app.dominant_privilege,"save_grid_edit",{
                   load : false,
                   success : function(resp){
                       if(resp.response.data === "success"){
                          $("#paginate_edit_icon").css("background","lightgreen");
                          app.runLater(2000,function(){
                              $("#paginate_edit_icon").css("background","lightblue"); 
                          });
                       }
                   }
               });
           });
        }
    });
};

App.prototype.allProducts = function (handler) {
    var request = {
        category : $("#product_categories").val()
    };
    app.xhr(request, app.dominant_privilege, "all_products", {
        load: true,
        success: function (data) {
            var r = data.response.data;
            app.context.product.fields.search_products.autocomplete.data = $.extend(true, {}, r); //we will need this for paginateSelect
            var title = "All Products";
            app.paginate({
                save_state: true,
                save_state_area: "content_area",
                title: title,
                onload_handler: handler,
                onload: function () {
                    var bType = app.getSetting("business_type");
                    var headers, values,columns;
                    $.each(r.PRODUCT_NAME, function (index) {
                        r.CREATED[index] = app.formatDate(r.CREATED[index]);
                        r.PRODUCT_EXPIRY_DATE[index] = new Date(r.PRODUCT_EXPIRY_DATE[index]).toLocaleDateString();
                        r.BP_UNIT_COST[index] = app.formatMoney(r.BP_UNIT_COST[index]);
                        r.SP_UNIT_COST[index] = app.formatMoney(r.SP_UNIT_COST[index]);
                    });
                    
                    if (bType === "goods") {
                        headers = ["Code","Product Name", "Category","S/Category", "BP/Unit", "SP/Unit", "Qty", "Reminder Limit","% Tax","Commission","Discount", "Date Created", "Expiry Date"];
                        values = [r.PRODUCT_CODE,r.PRODUCT_NAME, r.PRODUCT_CATEGORY,r.PRODUCT_SUB_CATEGORY, r.BP_UNIT_COST, r.SP_UNIT_COST, r.PRODUCT_QTY,
                            r.PRODUCT_REMIND_LIMIT,r.TAX,r.COMMISSION,r.MAX_DISCOUNT, r.CREATED, r.PRODUCT_EXPIRY_DATE];
                        columns = ["PRODUCT_CODE","PRODUCT_NAME", "PRODUCT_CATEGORY","PRODUCT_SUB_CATEGORY", "BP_UNIT_COST", "SP_UNIT_COST","PRODUCT_QTY",
                            "PRODUCT_REMIND_LIMIT","TAX","COMMISSION","MAX_DISCOUNT", "CREATED","PRODUCT_EXPIRY_DATE"];
                        
                    }
                    else if (bType === "services") {
                        if (app.getSetting("track_stock") === "1") {
                            headers = ["Code","Product Name", "Category","S/Category", "SP/Unit","Available Qty","Tax","Commission","Discount", "Date Created"];
                            values = [r.PRODUCT_CODE,r.PRODUCT_NAME, r.PRODUCT_CATEGORY,r.PRODUCT_SUB_CATEGORY, r.SP_UNIT_COST, 
                                r.PRODUCT_QTY,r.TAX,r.COMMISSION,r.MAX_DISCOUNT, r.CREATED];
                            columns = ["PRODUCT_CODE","PRODUCT_NAME", "PRODUCT_CATEGORY","PRODUCT_SUB_CATEGORY", "SP_UNIT_COST", 
                                "PRODUCT_QTY","TAX","COMMISSION","MAX_DISCOUNT","CREATED"];
                            
                        }
                        else {
                            headers = ["Code","Product Name", "Category","S/Category" ,"SP/Unit","Tax","Commission","Discount", "Date Created"];
                            values = [r.PRODUCT_CODE,r.PRODUCT_NAME, r.PRODUCT_CATEGORY,r.PRODUCT_SUB_CATEGORY, 
                                r.SP_UNIT_COST,r.TAX,r.COMMISSION,r.MAX_DISCOUNT, r.CREATED];
                            columns = ["PRODUCT_CODE","PRODUCT_NAME", "PRODUCT_CATEGORY","PRODUCT_SUB_CATEGORY","SP_UNIT_COST","TAX","COMMISSION","MAX_DISCOUNT","CREATED"];
                        }
                    }
                     app.ui.table({
                        id_to_append : "paginate_body",
                        headers :  headers,
                        values :  values,
                        include_nums : true,
                        style : "",
                        mobile_collapse : true,
                        transform : {
                            1: function(value,index){
                                return "<a href='#' id=item_select_" + index + ">" + value + "</a>";
                            }
                        }
                    });
                    $.each(r.PRODUCT_NAME, function (index) {
                        //set up onclick handlers
                        $("#item_select_" + index).click(function () {
                            var defaultHandler = handler === app.pages.sale ? undefined : app.context.product.fields.search_products.autocomplete_handler;
                            var afterSelectItem = handler === app.pages.sale ? app.sale : function(data,index){
                                $("#search_products").attr("current-item",data.ID[index]);
                                $("#search_products").val(data.PRODUCT_NAME[index]);
                                $("#product_name").attr("old-product-name",data.PRODUCT_NAME[index]);
                            };
                            app.paginateSelectItem({
                                data: app.context.product.fields.search_products.autocomplete.data,
                                index: index,
                                handler: defaultHandler,
                                afterSelectItem: afterSelectItem
                            });
                        });
                    });
                    
                    //add an edit button for the admin
                    if (app.dominant_privilege === "pos_admin_service") {
                        var img = $("<img src='img/edit.png' title='Edit' class='paginate_round_icon' id='paginate_edit_icon'>");
                        img.click(function () {
                            //launch the edit grid 
                            app.gridEdit(r.ID,columns,headers,values);
                        });
                        $("#paginate_button_area").append(img);
                    }
                }
            });
        }
    });
};


App.prototype.goodsStockHistory = function () {
    var data = app.getFormData(app.context.stock_history);
    var id = $("#search_products").attr("current-item");
    id = $("#search_products").val().trim() === ""  ? "all" : id;
    if (!data)
        return;
    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
        app.showMessage(app.context.invalid_dates);
        return;
    }
    var request = {
        id: id,
        user_name: $("#stock_select_users").val(),
        begin_date: data.start_date.value+" "+$("#start_time").val()+":00",
        end_date: data.end_date.value+" "+$("#stop_time").val()+":59",
        report_type : data.report_type.value,
        product_categories : data.product_categories.value
    };
    app.xhr(request, app.dominant_privilege, "stock_history", {
        load: true,
        success: function (data) {
            //product name
            var resp = data.response.data;
            //name,username,narr,time,type
            app.paginate({
                title: "Stock History",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalQty = 0;
                    var totalSP = 0;
                    var totalBP = 0;
                    var profits = 0;
                    var sales = 0;
                    var costOfGoods = 0;
                    var undos = [];
                    $.each(resp.TRAN_TYPE, function (index) {
                        var type = resp.TRAN_TYPE[index];
                        var flag = resp.TRAN_FLAG[index];
                        var color;
                        if(flag === "sale_to_customer"){
                            color = "red";
                        }
                        else if(flag === "stock_in"){
                            color = "green";
                        }
                        else if(flag === "stock_out"){
                            color = "orange";
                        }
                        else if(flag === "reversal_of_sale"){
                            color = "blue";
                        }

                        var qty = type === "1" ? parseFloat(resp.STOCK_QTY[index]) : -parseFloat(resp.STOCK_QTY[index]);
                        var amountSP = type === "1" ? parseFloat(resp.STOCK_COST_SP[index]) : -parseFloat(resp.STOCK_COST_SP[index]);
                        var amountBP = type === "1" ? parseFloat(resp.STOCK_COST_BP[index]) : -parseFloat(resp.STOCK_COST_BP[index]);
                        var profit = type === "1" ? parseFloat(resp.PROFIT[index]) : -parseFloat(resp.PROFIT[index]);
                                               
                        var span = type === "0" ? "Stock Decrease" : "Stock Increase";
                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
                        var transId = resp.ID[index];
                        
                        var undo = "<a href='#' onclick='app.undoSale(\"" + transId + "\")' title='Undo sale'>Undo Sale</a>";
                        flag === "sale_to_customer"  ? undos.push(undo) : undos.push("");

                        resp.CREATED[index] = app.formatDate(resp.CREATED[index],false,true);

                        resp.STOCK_QTY[index] = "<span style='color :" + color + "'>" + resp.STOCK_QTY[index] + "</span>";
                        resp.STOCK_COST_SP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_SP[index]) + "</span>";
                        resp.STOCK_COST_BP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_BP[index]) + "</span>";
                        resp.PROFIT[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.PROFIT[index]) + "</span>";

                        totalQty = totalQty + qty;
                        totalSP = totalSP + amountSP;
                        totalBP = totalBP + amountBP;
                        if(flag === "sale_to_customer"){
                            profits = profits - profit;
                            sales = sales - amountSP;
                            costOfGoods = costOfGoods - amountBP;
                        }
                        else if(flag === "reversal_of_sale"){
                            profits = profits - profit;
                            sales = sales - amountSP;
                            costOfGoods = costOfGoods - amountBP;
                        }
                        
                    });
                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers :  ["Ref","Product Name", "Stock Value/BP", "Stock Value/SP ", "Stock Qty", "Margin", "Entry Type", "Narration", "Entry Date", "Undo Sale"],
                        values :  [resp.ID,resp.PRODUCT_NAME, resp.STOCK_COST_BP, resp.STOCK_COST_SP, resp.STOCK_QTY, resp.PROFIT, resp.TRAN_TYPE, resp.NARRATION, resp.CREATED, undos],
                        include_nums : false,
                        style : "",
                        mobile_collapse : true,
                        sortable : true, //this table can be sorted
                        summarize : {
                            cols : [0,7],
                            lengths : [4,30]
                        },  
                        onRender: function (id) {
                            $("#" + id).append(app.footerRow([
                                "","Totals",
                                app.formatMoney(totalBP),
                                app.formatMoney(totalSP),
                                totalQty,app.formatMoney(profits)
                            ],"font-weight:bold"));
                        }
                    });
                    var summary = $("<table class='summary table'><tr>"+
                                    "<tr><th>Cost Of Goods</th><th>Sales</th><th>Margin</th></tr>"+
                                    "<tr><td>"+app.formatMoney(costOfGoods) + "</td>"+
                                    "<td>" + app.formatMoney(sales) + "</td>"+
                                    "<td>" + app.formatMoney(profits) + "</td></tr></table>");
                    $("#paginate_body").append(summary);
                    
                    $("#paginate_body").append(app.colorKey());
                }
            });

        }
    });
};

App.prototype.footerRow = function(values,style){
    var tbody = $("<tbody class='avoid-sort'>");
    var tr = $("<tr style = "+style+">");
    $.each(values,function(x){
        var td = $("<td>");
        td.append(values[x]);
        tr.append(td);
    });
    tbody.append(tr);
    return tbody;
};

App.prototype.colorKey = function(){
   var colorKey = "<div style='font-size:10px;display:flex'>\n\
                   <div style='background:green;height:10px;width:10px;margin-left:5px'></div>\n\
                   <div style='margin-left:5px;line-height:1'>stock increase from new stock</div>\n\
                   <div style='background:red;height:10px;width:10px;margin-left:5px'></div>\n\
                   <div style='margin-left:5px;line-height:1'>stock decrease from sale to customer</div> \n\
                   <div style='background:orange;height:10px;width:10px;margin-left:5px'></div>\n\
                   <div style='margin-left:5px;line-height:1'>stock decrease from deductions by admin</div>\n\
                   <div style='background:blue;height:10px;width:10px;margin-left:5px'></div>\n\
                   <div style='margin-left:5px;line-height:1'>stock increase from reversal of sale</div></div>";
    return colorKey;
};

App.prototype.servicesStockHistory = function () {
    var data = app.getFormData(app.context.stock_history);
    var id = $("#search_products").attr("current-item");
    id = $("#search_products").val().trim() === ""  ? "all" : id;
    if (!data)
        return;
    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
        app.showMessage(app.context.invalid_dates);
        return;
    }
    var request = {
        id: id,
        user_name: $("#stock_select_users").val(),
        begin_date: data.start_date.value+" "+$("#start_time").val()+":00",
        end_date: data.end_date.value+" "+$("#stop_time").val()+":59",
        report_type : data.report_type.value,
        product_categories : data.product_categories.value
    };
    app.xhr(request, app.dominant_privilege, "stock_history", {
        load: true,
        success: function (data) {
            //product name
            var resp = data.response.data;
            //name,username,narr,time,type
            app.paginate({
                title: "Stock History",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalQty = 0;
                    var totalSP = 0;
                    var costOfSales = 0;
                    var undos = [];
                    $.each(resp.TRAN_TYPE, function (index) {
                        var type = resp.TRAN_TYPE[index];
                        var flag = resp.TRAN_FLAG[index];
                        var color;
                        if (flag === "sale_to_customer") {
                            color = "red";
                        }
                        else if (flag === "stock_in") {
                            color = "green";
                        }
                        else if (flag === "stock_out") {
                            color = "orange";
                        }
                        else if (flag === "reversal_of_sale") {
                            color = "blue";
                        }

                        var qty = type === "1" ? parseFloat(resp.STOCK_QTY[index]) : -parseFloat(resp.STOCK_QTY[index]);
                        var amountSP = type === "1" ? parseFloat(resp.STOCK_COST_SP[index]) : -parseFloat(resp.STOCK_COST_SP[index]);
                       
                        var span = type === "0" ? "Stock Decrease" : "Stock Increase";
                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
                        
                        var transId = resp.ID[index];
                        var undo = "<a href='#' onclick='app.undoSale(\"" + transId + "\")' title='Undo sale'>Undo Sale</a>";

                        flag === "sale_to_customer" ? undos.push(undo) : undos.push("");

                        var time = new Date(resp.CREATED[index]).toLocaleString();
                        resp.CREATED[index] = time;

                        resp.STOCK_QTY[index] = "<span style='color :" + color + "'>" + resp.STOCK_QTY[index] + "</span>";
                        resp.STOCK_COST_SP[index] = "<span style='color :" + color + "'>" + app.formatMoney(resp.STOCK_COST_SP[index]) + "</span>";

                        totalQty = totalQty + qty;
                        totalSP = totalSP + amountSP;
                       
                        if (flag === "sale_to_customer") {
                            costOfSales = costOfSales - amountSP;
                        }
                        else if (flag === "reversal_of_sale") {
                            costOfSales = costOfSales - amountSP;

                        }
                    });

                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers : ["Ref","Product Name", "Cost ", "Qty", "Entry Type", "Narration", "Entry Date", "Undo Sale"],
                        values :   [resp.ID,resp.PRODUCT_NAME, resp.STOCK_COST_SP, resp.STOCK_QTY, resp.TRAN_TYPE, resp.NARRATION, resp.CREATED, undos],
                        include_nums : false,
                        style : "",
                        mobile_collapse : true,
                        sortable : true,
                        summarize : {
                            cols : [0,5],
                            lengths : [4,30]
                        },
                        onRender : function(tableId){
                            $("#" + tableId).append(app.footerRow([
                                "", "Totals",
                                app.formatMoney(totalSP),
                                totalQty,"","","",""
                            ], "font-weight:bold"));
                        }
                    });
                    var summary = $("<div class='summary'><span>Sales: " + app.formatMoney(costOfSales) + "</span></div>");
                    $("#paginate_body").append(summary);
                }
            });

        }
    });
};

App.prototype.commissionHistory = function(){
    app.reportHistory({
        success: function (data) {
            var resp = data.response.data;
            app.paginate({
                title: "Commissions",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalComm = 0, units = 0;
                    $.each(resp.COMM_VALUE, function (x) {
                        var type = resp.TRAN_TYPE[x];
                        var color, narr;
                        var comm = parseFloat(resp.COMM_VALUE[x]);
                        var unit = parseFloat(resp.UNITS_SOLD[x]);

                        if (type === "0") {
                            narr = "Increase";
                            color = "green";
                            totalComm = totalComm + comm;
                            units = units + unit;
                        }
                        else if (type === "1") {
                            narr = "Decrease";
                            color = "red";
                            totalComm = totalComm - comm;
                            units = units - unit;
                        }
                        resp.UNITS_SOLD[x] = "<span style='color:" + color + "'>" + unit + "</span>";
                        resp.COMM_VALUE[x] = "<span style='color:" + color + "'>" + app.formatMoney(comm) + "</span>";
                        resp.TRAN_TYPE[x] = "<span style='color:" + color + "'>" + narr + "</span>";
                    });
                    resp.PRODUCT_NAME.push("<b>Totals</b>");
                    resp.UNITS_SOLD.push("<b>" + units + "</b>");
                    resp.COMM_VALUE.push(app.formatMoney(totalComm));
                    resp.USER_NAME.push("");
                    resp.CREATED.push("");
                    resp.TRAN_TYPE.push("");
                    resp.ID.push("");
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: ["Ref", "Product Name", "Type", "Units Sold", "Commission", "User Name", "Date Entered"],
                        values: [resp.ID, resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.UNITS_SOLD, resp.COMM_VALUE, resp.USER_NAME, resp.CREATED],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        summarize: {
                            cols: [0],
                            lengths: [4]
                        },
                        transform: {
                            6: function (value, index) {
                                if (index === (resp.PRODUCT_NAME.length - 1))
                                    return "";
                                return app.formatDate(value,false,true);;
                            }
                        }
                    });
                }
            });
        }
    });
};

App.prototype.discountHistory = function () {
    app.reportHistory({
        success: function (data) {
            var resp = data.response.data;
            app.paginate({
                title: "Discounts",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalDisc = 0, units = 0;
                    $.each(resp.DISC_VALUE, function (x) {
                        var type = resp.TRAN_TYPE[x];
                        var color, narr;
                        var disc = parseFloat(resp.DISC_VALUE[x]);
                        var unit = parseFloat(resp.UNITS_SOLD[x]);

                        if (type === "0") {
                            narr = "Increase";
                            color = "green";
                            totalDisc = totalDisc + disc;
                            units = units + unit;
                        }
                        else if (type === "1") {
                            narr = "Decrease";
                            color = "red";
                            totalDisc = totalDisc - disc;
                            units = units - unit;
                        }
                        resp.UNITS_SOLD[x] = "<span style='color:" + color + "'>" + unit + "</span>";
                        resp.DISC_VALUE[x] = "<span style='color:" + color + "'>" + app.formatMoney(disc) + "</span>";
                        resp.TRAN_TYPE[x] = "<span style='color:" + color + "'>" + narr + "</span>";
                    });
                    resp.PRODUCT_NAME.push("<b>Totals</b>");
                    resp.UNITS_SOLD.push("<b>" + units + "</b>");
                    resp.DISC_VALUE.push(app.formatMoney(totalDisc));
                    resp.USER_NAME.push("");
                    resp.CREATED.push("");
                    resp.TRAN_TYPE.push("");
                    resp.ID.push("");
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: ["Ref", "Product Name", "Type", "Units Sold", "Discount", "User Name", "Date Entered"],
                        values: [resp.ID, resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.UNITS_SOLD, resp.DISC_VALUE, resp.USER_NAME, resp.CREATED],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        summarize: {
                            cols: [0],
                            lengths: [4]
                        },
                        transform: {
                            6: function (value, index) {
                                if (index === (resp.PRODUCT_NAME.length - 1))
                                    return "";
                                return app.formatDate(value,false,true);
                            }
                        }
                    });
                }
            });
        }
    });
};

App.prototype.taxHistory = function () {
    app.reportHistory({
        success: function (data) {
            var resp = data.response.data;
            app.paginate({
                title: "Taxes",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalTax = 0, units = 0;
                    $.each(resp.TAX_VALUE, function (x) {
                        var type = resp.TRAN_TYPE[x];
                        var color, narr;
                        var tax = parseFloat(resp.TAX_VALUE[x]);
                        var unit = parseFloat(resp.UNITS_SOLD[x]);

                        if (type === "0") {
                            narr = "Increase";
                            color = "green";
                            totalTax = totalTax + tax;
                            units = units + unit;
                        }
                        else if (type === "1") {
                            narr = "Decrease";
                            color = "red";
                            totalTax = totalTax - tax;
                            units = units - unit;
                        }
                        resp.UNITS_SOLD[x] = "<span style='color:" + color + "'>" + unit + "</span>";
                        resp.TAX_VALUE[x] = "<span style='color:" + color + "'>" + app.formatMoney(tax) + "</span>";
                        resp.TRAN_TYPE[x] = "<span style='color:" + color + "'>" + narr + "</span>";
                    });
                    resp.PRODUCT_NAME.push("<b>Totals</b>");
                    resp.UNITS_SOLD.push("<b>" + units + "</b>");
                    resp.TAX_VALUE.push(app.formatMoney(totalTax));
                    resp.USER_NAME.push("");
                    resp.CREATED.push("");
                    resp.TRAN_TYPE.push("");
                    resp.ID.push("");
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: ["Ref", "Product Name", "Type", "Units Sold", "Tax", "User Name", "Date Entered"],
                        values: [resp.ID, resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.UNITS_SOLD, resp.TAX_VALUE, resp.USER_NAME, resp.CREATED],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        summarize: {
                            cols: [0],
                            lengths: [4]
                        },
                        transform: {
                            6: function (value, index) {
                                if (index === (resp.PRODUCT_NAME.length - 1))
                                    return "";
                                return app.formatDate(value,false,true);
                            }
                        }
                    });
                }
            });
        }
    });
};

App.prototype.supplierHistory = function(){
    app.reportHistory({
        success: function (data) {
            var r = data.response.data;
            var totalAmount = 0;
            var totalUnits = 0;
            app.paginate({
                title: "Suppliers",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: ["Supplier Name", "Product Name", "Product Units", "Amount", "Entry Type", "Payment Mode", "Narration", "Username", "Date"],
                        values: [r.SUPPLIER_NAME, r.PRODUCT_NAME, r.UNITS, r.TRANS_AMOUNT, r.TRAN_TYPE, r.PAYMENT_MODE, r.NARRATION, r.USER_NAME, r.CREATED],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        summarize: {
                            cols: [6],
                            lengths: [30]
                        },
                        transform: {
                            2: function (value) {
                                totalUnits = totalUnits + parseFloat(value);
                                return value;
                            },
                            3: function (value) {
                                totalAmount = totalAmount + parseFloat(value);
                                return app.formatMoney(value);
                            },
                            4: function (value) {
                                return value === "0" ? "<span style='color:green'>Stock Out</span>" : "<span style='color:red'>Stock In</span>";
                            },
                            8: function (value) {
                                return app.formatDate(value,false,true);
                            }
                        },
                        onRender: function (id) {
                            //append amounts
                            totalAmount = app.formatMoney(totalAmount);
                            $("#" + id).append("<tr><td></td> <td></td> <td><b>Totals</b></td> <td><b>" + totalUnits + "</b></td> <td><b>" + totalAmount + "</b></td></tr>");
                        }
                    });

                }
            });
        }
    });
};

App.prototype.salesVolume = function(){
    app.reportHistory({
        success: function (data) {
            var resp = data.response.data;
            app.paginate({
                title: "Sales Volume",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.stock_history,
                onload: function () {
                    var totalUnits = 0;
                    var totalCostBp = 0;
                    var totalCostSp = 0;
                    
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: [ "Product Name", "Total Units", "Value/BP", "Value/SP"],
                        values: [ resp.names, resp.units, resp.cost_bp, resp.cost_sp],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        sortable : true,
                        transform: {
                            1 : function (value) {
                                totalUnits = totalUnits + parseFloat(value);
                                return value;
                            },
                            2 : function (value) {
                                totalCostBp = totalCostBp + parseFloat(value);
                                return app.formatMoney(value);
                            },
                            3 : function (value) {
                                totalCostSp = totalCostSp + parseFloat(value);
                                return app.formatMoney(value);
                            }
                        },
                        onRender: function (id) {
                            $("#" + id).append(app.footerRow([
                                "","Totals",
                                app.formatMoney(totalUnits),
                                app.formatMoney(totalCostBp),
                                app.formatMoney(totalCostSp)
                            ], "font-weight:bold"));
                        }
                    });
                }
            });
        }
    });
};

App.prototype.stockHistory = function () {
    var type = $("#report_type").val();
    if(type === "stock_history") {
        var trackStock = app.getSetting("track_stock");
        trackStock = app.getSetting("business_type") === "goods" ? "1" : "0";
        trackStock === "1" ? app.goodsStockHistory() : app.servicesStockHistory();
    }
    else if(type === "commission_history"){
        app.commissionHistory();
    }
    else if (type === "discount_history") {
        app.discountHistory();
    }
    else if(type === "tax_history"){
        app.taxHistory();
    }
    else if(type === "supplier_history"){
        app.supplierHistory();
    }
    else if(type === "sales_volume"){
        app.salesVolume();
    }
};



App.prototype.reportHistory = function(options){
    var data = app.getFormData(app.context.stock_history);
    var id = $("#search_products").attr("current-item");
    id = $("#search_products").val().trim() === ""  ? "all" : id;
    if (!data) return;
    if (Date.parse(data.end_date.value) < Date.parse(data.start_date.value)) {
        app.showMessage(app.context.invalid_dates);
        return;
    }
    var request = {
        id: id,
        user_name: $("#stock_select_users").val(),
        begin_date: data.start_date.value+" "+$("#start_time").val()+":00",
        end_date: data.end_date.value+" "+$("#stop_time").val()+":59",
        report_type : data.report_type.value,
        supplier_id : $("#stock_select_suppliers").val()
    };
    app.xhr(request, app.dominant_privilege,"stock_history", {
        load: true,
        success: function (data) {
           options.success(data);
        }
    });
};

App.prototype.supplierAction = function(actionType){
    var id,oldSupplierName;
    if(actionType === "update" || actionType === "delete") {
        id = $("#search_suppliers").attr("current-item");
        oldSupplierName = $("#supplier_name").attr("old-supplier-name");
        if (!id) {
            //no item specified for updating
            app.showMessage(app.context.no_supplier_selected);
            return;
        }
    }

    var data = app.getFormData(app.context.suppliers);
    if (!data) return;

    var request = {
        supplier_name : data.supplier_name.value,
        country : data.country.value,
        city : data.city.value,
        postal_address : data.postal_address.value,
        phone_number : data.phone_number.value,
        email_address : data.email_address.value,
        company_website : data.company_website.value,
        contact_person_name : data.contact_person_name.value,
        contact_person_phone : data.contact_person_phone.value,
        action_type : actionType,
        supplier_id : id,
        old_supplier_name : oldSupplierName
    };
    app.xhr(request, app.dominant_privilege, "supplier_action", {
        load: true,
        success: function (data) {
            if (data.response.data === "success") {
                if(actionType === "create"){
                    app.showMessage(app.context.create_supplier);
                }
                else if(actionType === "update"){
                    app.showMessage(app.context.update_supplier);
                }
                else if(actionType === "delete"){
                    app.showMessage(app.context.delete_supplier);
                }

            }
            else if (data.response.data === "fail") {
                app.showMessage(data.response.reason);
            }
        }
    });

};

App.prototype.createProduct = function () {
    var type = app.getSetting("business_type");
    var context = type === "goods" ? app.context.product : app.context.service_product;
    var data = app.getFormData(context);
    if (!data) return;
    if (type === "services") {
        if(app.getSetting("track_stock") === "0"){
            //dont track
            data.product_quantity = {};
            data.product_quantity.value = 0;
        }
        data.product_bp_unit_cost = {};
        data.product_bp_unit_cost.value = 0;
        data.product_reminder_limit = {};
        data.product_reminder_limit.value = '1';
        data.product_expiry_date = {};
        data.product_expiry_date.value = '2015-01-01';
    }
    
    //take care of shared products
    var unitSize = 1;
    if(data.product_parent.value === data.product_name.value) {
        alert("Parent product cannot be the same as the product itself");
        $("#product_parent").focus();
        return;
    }
    else if(data.product_parent.value.trim().length > 0){
        unitSize = data.product_parent.value.length > 0 ?
                window.prompt("WARNING!\n Stock deductions for " + data.product_name.value + " will be made on " + data.product_parent.value + "\n Enter the product unit size: ") : 0;
        if (!unitSize || isNaN(unitSize))
            return; //this happens if the user pressed cancel
    }
    else {
        $("#product_parent").removeAttr("current-item");
    }
    var currentQty = parseFloat($("#current_product_quantity").val());
    var changeQty = parseFloat(data.product_quantity.value);
    var qtyType = $("#product_quantity_type").val();
    var newQty = qtyType === "increase" ? currentQty + changeQty : currentQty - changeQty;
    newQty = newQty < 0 ? 0 : newQty;
    var requestData = {
        product_name: data.product_name.value,
        product_quantity: newQty,
        product_category: data.product_category.value,
        product_sub_category: data.product_sub_category.value,
        product_bp_unit_cost: data.product_bp_unit_cost.value,
        product_sp_unit_cost: data.product_sp_unit_cost.value,
        product_reminder_limit: data.product_reminder_limit.value,
        product_expiry_date: data.product_expiry_date.value,
        product_narration: data.product_narration.value,
        product_unit_size : unitSize,
        max_discount : data.max_discount.value,
        product_parent : $("#product_parent").attr("current-item"),
        tax : data.tax.value,
        commission : data.commission.value,
        business_type: app.getSetting("business_type")
    };
    
    app.xhr(requestData, app.dominant_privilege, "create_product", {
        load: true,
        success: function (data) {
            if (data.response.data === "SUCCESS") {
                app.briefShow({
                    title : "Info",
                    content : app.context.create_product
                });
                $("#product_parent").val("");
                $("#product_parent").removeAttr("current-item");
            }
            else if (data.response.data === "FAIL") {
                app.briefShow({
                    title: "Info",
                    content: data.response.reason
                });
            }
        }
    });
};


App.prototype.deleteProduct = function () {
    var id = $("#search_products").attr("current-item");
    if (!id) {
        //no item specified for updating
        app.showMessage(app.context.no_product_selected);
        return;
    }
    var requestData = {
        id: id
    };
    app.xhr(requestData, app.dominant_privilege, "delete_product", {
        load: true,
        success: function (data) {
            if (data.response.data === "SUCCESS") {
                app.briefShow({
                    title: "Info",
                    content: app.context.product_deleted
                });
            }
            else if (data.response.data === "FAIL") {
                app.briefShow({
                    title: "Info",
                    content: data.response.reason
                });
            }
        }
    });
};

App.prototype.updateProduct = function () {
    var id = $("#search_products").attr("current-item");
    if (!id) {
        //no item specified for updating
        app.showMessage(app.context.no_product_selected);
        return;
    }
    
    var type = app.getSetting("business_type");
    var context = type === "goods" ? app.context.product : app.context.service_product;
    var data = app.getFormData(context);
    if (!data) return;
    if (type === "services") {
        if(app.getSetting("track_stock") === "0"){
            //dont track
            data.product_quantity = {};
            data.product_quantity.value = 0;
        }
        data.product_bp_unit_cost = {};
        data.product_bp_unit_cost.value = 0;
        data.product_reminder_limit = {};
        data.product_reminder_limit.value = '1';
        data.product_expiry_date = {};
        data.product_expiry_date.value = '2015-01-01';
    }
    
    //take care of shared products
    var unitSize = 1;
    if(data.product_parent.value === data.product_name.value) {
        alert("Parent product cannot be the same as the product itself");
        $("#product_parent").focus();
        return;
    }
    else if(data.product_parent.value.trim().length > 0){
        unitSize = data.product_parent.value.length > 0 ?
                window.prompt("WARNING!\n Stock deductions for " + data.product_name.value + " will be made on " + data.product_parent.value + "\n Enter the product unit size: ") : 0;
        if(!unitSize || isNaN(unitSize))
            return; //this happens if the user pressed cancel
    }
    else {
        $("#product_parent").removeAttr("current-item");
    }
    var currentQty = parseFloat($("#current_product_quantity").val());
    var changeQty = parseFloat(data.product_quantity.value);
    var qtyType = $("#product_quantity_type").val();
    var newQty = qtyType === "increase" ? currentQty + changeQty : currentQty - changeQty;
    newQty = newQty < 0 ? 0 : newQty;
    var requestData = {
            id: id,
            old_product_name: $("#product_name").attr("old-product-name"),
            product_name: data.product_name.value,
            product_quantity: newQty,
            product_category: data.product_category.value,
            product_sub_category: data.product_sub_category.value,
            product_bp_unit_cost: data.product_bp_unit_cost.value,
            product_sp_unit_cost: data.product_sp_unit_cost.value,
            product_reminder_limit: data.product_reminder_limit.value,
            product_expiry_date: data.product_expiry_date.value,
            product_narration: data.product_narration.value,
            product_unit_size : unitSize,
            max_discount : data.max_discount.value,
            product_parent : $("#product_parent").attr("current-item"),
            tax : data.tax.value,
            commission : data.commission.value,
            business_type: app.getSetting("business_type")
    };

    app.xhr(requestData, app.dominant_privilege, "update_product", {
        load: true,
        success: function (data) {
            if (data.response.data === "SUCCESS") {
                app.briefShow({
                    title: "Info",
                    content: app.context.product_updated
                });
                $("#product_parent").val("");
                $("#product_parent").removeAttr("current-item");
            }
            else if (data.response.data === "FAIL") {
                app.briefShow({
                    title: "Info",
                    content: data.response.reason
                });
            }
        }
    });
};


App.prototype.stockExpiry = function (handler) {
    app.xhr({}, app.dominant_privilege, "stock_expiry", {
        load: true,
        success: function (data) {
            var resp = data.response.data;
            //name,username,narr,time,type
            app.paginate({
                title: "Stock Expiry",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: handler,
                onload: function () {
                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers : ["Product Name", "Expiry Date", "Date Entered"],
                        values : [resp.PRODUCT_NAME, resp.PRODUCT_EXPIRY_DATE, resp.CREATED],
                        include_nums : true,
                        style : "",
                        mobile_collapse : true,
                        transform : {
                            1 : function(value){
                                return app.formatDate(value,true);
                            },
                            2 : function(value){
                                return app.formatDate(value,false,true);
                            }
                        }
                    });
                }
            });
        }
    });
};

App.prototype.stockLow = function (handler) {
    app.xhr({}, app.dominant_privilege, "stock_low", {
        load: true,
        success: function (data) {
            var resp = data.response.data;
            //name,username,narr,time,type
            app.paginate({
                title: "Stock Running Low",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: handler,
                onload: function () {
                    app.ui.table({
                        id_to_append : "paginate_body",
                        headers : ["Product Name", "Product Quantity", "Product Remind Limit", "Date Entered"],
                        values : [resp.PRODUCT_NAME, resp.PRODUCT_QTY, resp.PRODUCT_REMIND_LIMIT, resp.CREATED],
                        include_nums : true,
                        style : "",
                        mobile_collapse : true,
                        transform: {
                            3: function (value) {
                                return app.formatDate(value, false, true);
                            }
                        }
                    });
                }
            });
        }
    });
};


App.prototype.undoSale = function (transId) {
    var ref = transId.substring(0,4);
    var html = "<span>This will undo all transactions with reference no. <b>"+ref+"</b></span><br><br>\n\
                <input type='text' class='form-control' id='undo_sale_narr' placeholder='Reason for Reversal'>";
    var m = app.ui.modal(html, "Reverse Transaction", {
        ok: function () {
            var narr = $("#undo_sale_narr").val();
            var request = {
                tran_type: "1",
                narration: narr,
                tran_flag: "reversal_of_sale",
                previous_trans_id : transId
            };
            m.modal('hide');
            $(".modal-backdrop").remove();
            //do some stuff like saving to the server
            app.xhr(request, app.dominant_privilege, "transact", {
                load: true,
                success: function (data) {
                    var resp = data.response.data;
                    if (resp.status === "success") {
                        //well transaction successful
                        app.briefShow({
                            title : "Info",
                            content : app.context.reverse_success
                        });
                    }
                    else if (resp.status === "fail") {
                        app.briefShow({
                            title: "Info",
                            content: resp.reason
                        });
                    }
                }
            });
        },
        okText: "Proceed",
        cancelText: "Cancel"
    });
};

App.prototype.graphData = function(){
    var data = app.getFormData(app.context.graphs);
    if (!data) return;
    var start = data.start_date.value;
    var end = data.end_date.value;
    $("#cache_area").html(""); //clear the cache
    var categoryElems = $(".category-type");
    var prodElems = $(".product-search");
    var categories = [];
    var products = [];
    for(var x = 0; x < categoryElems.length; x++){
        var cat = $(categoryElems[x]).val();
        var prodElem = $(prodElems[x]); 
        var prodId = prodElem.val().trim() === "" ? "all" : prodElem.attr("current-item");
        if(categories.indexOf(cat) === -1){
            categories.push(cat);
            products.push(prodId);   
        }
    }
    var request = {
        begin_date : start,
        end_date : end,
        prod_ids : products,
        categories : categories
    };
    app.xhr(request, app.dominant_privilege, "graph_data", {
        load: true,
        success: function (data) {
            var r = data.response.data;
            $("#graph_area").html("");
            Morris.Line({
                element: 'graph_area',
                parseTime: true,
                data: r, 
                xkey: "date", 
                ykeys: categories, 
                labels: categories,
                dateFormat: function (d) {
                    return app.formatDate(d);
                },
                xLabelFormat: function (d) {
                    return app.formatDate(d);
                }
            });
        }
    });
};

App.prototype.yAxisData = function(){
    var html = "<input type='button' class='btn' value='Add Data' onclick='app.addyAxisData()'>\n\
                <div id='data_area'></div><div style='display : none' id='cache_area'></div>";
    var m = app.ui.modal(html,"Y axis data",{
        ok : function(){
            app.graphData();
            m.modal('hide');
        },
        okText : "Plot Graph",
        cancelText : "Cancel"
    });
    $("#cache_area").load("templates/y_data.html");
};

App.prototype.addyAxisData = function(){
    var id = "search_"+app.rand(6);
    var elems = $(".product-search");
    elems[elems.length - 1].setAttribute("id",id);
    $("#data_area").append($("#cache_area").html());
    var autoTemplate = $.extend(true, {}, app.context.graphs.fields.search_products);
    autoTemplate.autocomplete.id = id;
    autoTemplate.autocomplete.where = function(){
        return "PRODUCT_NAME  LIKE '" + $("#"+id).val() + "%'";
    };
    app.context.graphs.fields[id] = autoTemplate;
    app.setUpAuto(app.context.graphs.fields[id]);
};

App.prototype.max = function(values){
    var currMax = 0;
    $.each(values,function(x){
        if(values[x] > currMax) currMax = values[x];
    });
    return currMax;
};

App.prototype.showGlance = function(){
    var headers = ["Sales","Cost of Goods","Margin","Taxes",
        "Discounts","Commissions","Expenses","Incomes","Best selling product","Top earning product"];
    var categories = ["sales", "cost of goods", "margin",
        "taxes", "discounts", "commissions", "expenses","incomes"];
    var request1 = {
        prod_ids: ["all", "all", "all", "all", "all", "all", "all", "all"],
        categories: categories,
        begin_date: app.getDate(-7) + " 00:00:00",
        end_date: app.getDate(0) + " 23:59:59"
    };

    app.xhr(request1, app.dominant_privilege, "graph_data", {
        load: true,
        success: function (data1) {
            var request2 = {
                id: "all",
                user_name: "all",
                report_type: "sales_volume",
                begin_date: app.getDate(-1) + " 00:00:00",
                end_date: app.getDate(-1) + " 23:59:59"
            };
            app.xhr(request2, app.dominant_privilege, "stock_history", {
                load: true,
                success: function (data2) {
                    var request3 = {
                        id: "all",
                        user_name: "all",
                        report_type: "sales_volume",
                        begin_date: app.getDate() + " 00:00:00",
                        end_date: app.getDate() + " 23:59:59"
                    };
                    app.xhr(request3, app.dominant_privilege, "stock_history", {
                        load: true,
                        success: function (data3) {
                            var r1 = data1.response.data;
                            var r1Copy = $.extend(true, [], r1);
                            var r2 = data2.response.data;
                            var r3 = data3.response.data;
                            var todayDate = app.getDate();
                            var yesterDate = app.getDate(-1);
                            var today, yester;
                            var lastWeek = {};
                            $.each(r1, function (x) {
                                if (r1[x].date === todayDate) {
                                    today = r1[x];
                                }
                                else if (r1[x].date === yesterDate) {
                                    yester = r1[x];
                                }
                            });
                            lastWeek.sales = 0;
                            lastWeek["cost of goods"] = 0;
                            lastWeek.margin = 0;
                            lastWeek.taxes = 0;
                            lastWeek.discounts = 0;
                            lastWeek.expenses = 0;
                            lastWeek.incomes = 0;
                            lastWeek.commissions = 0;
                            $.each(r1, function (x) {
                                if (r1[x]) {
                                    if (r1[x].sales) 
                                        lastWeek.sales = lastWeek.sales + r1[x].sales;
                                    if (r1[x]["cost of goods"])
                                        lastWeek["cost of goods"] = lastWeek["cost of goods"] + r1[x]["cost of goods"];
                                    if (r1[x].margin)
                                        lastWeek.margin = lastWeek.margin + r1[x].margin;
                                    if (r1[x].taxes)
                                        lastWeek.taxes = lastWeek.taxes + r1[x].taxes;
                                    if (r1[x].discounts)
                                        lastWeek.discounts = lastWeek.discounts + r1[x].discounts;
                                    if (r1[x].expenses)
                                        lastWeek.expenses = lastWeek.expenses + r1[x].expenses;
                                    if (r1[x].incomes)
                                        lastWeek.incomes = lastWeek.incomes + r1[x].incomes;
                                    if (r1[x].commissions)
                                        lastWeek.commissions = lastWeek.commissions + r1[x].commissions;
                                }
                            });
                            var bestSellYester = r2.names[r2.units.indexOf(app.max(r2.units))];
                            var topEarnerYester = r2.names[r2.cost_sp.indexOf(app.max(r2.cost_sp))];
                            var bestSellToday = r3.names[r3.units.indexOf(app.max(r3.units))];
                            var topEarnerToday = r3.names[r3.cost_sp.indexOf(app.max(r3.cost_sp))];
                            
                            var yesterValues = !yester ? [] : [yester.sales, yester["cost of goods"],
                                yester.margin, yester.taxes, yester.discounts, yester.commissions,
                                yester.expenses, yester.incomes,bestSellYester, topEarnerYester];
                            
                            var todayValues = !today ? [] : [today.sales, today["cost of goods"],
                                today.margin, today.taxes, today.discounts,today.commissions, 
                                today.expenses, today.incomes,bestSellToday,topEarnerToday];
                            
                            var lastWeekValues = !lastWeek ? [] : [lastWeek.sales, lastWeek["cost of goods"],
                                lastWeek.margin, lastWeek.taxes, lastWeek.discounts,lastWeek.commissions,
                                lastWeek.expenses, lastWeek.incomes,'',''];
                           
                            app.ui.table({
                                id_to_append: "glance_area",
                                headers: ["Category", "Today", "Yesterday","Last 7 days"],
                                values: [headers, todayValues, yesterValues,lastWeekValues],
                                include_nums: false,
                                style: "",
                                mobile_collapse: false,
                                transform: {
                                    1: function (value,index) {
                                        if(index === 8 || index === 9) return value;
                                        return !value ? 0 : app.formatMoney(value);
                                    },
                                    2: function (value,index) {
                                        if(index === 8 || index === 9) return value;
                                        return !value ? 0 : app.formatMoney(value);
                                    },
                                    3: function (value, index) {
                                        if (index === 8 || index === 9)
                                            return value;
                                        return !value ? 0 : app.formatMoney(value);
                                    }
                                }
                            });
                            Morris.Line({
                                element: 'graph_area',
                                parseTime: true,
                                data: r1Copy,
                                xkey: "date",
                                ykeys: categories,
                                labels: categories,
                                dateFormat : function(d){
                                    return app.formatDate(d);
                                },
                                xLabelFormat: function (d) {
                                    return app.formatDate(d);
                                }
                            });
                        }});
                }
            });
        }
    });
};

App.prototype.uploadProductExcel = function(){
    var m = app.ui.modal("<div id='product_load_area' style='overflow:auto;height:600px'></div>",'Upload Excel File',{
        okText : "Done",
        ok : function(){
            m.modal('hide');
        }
    });
    var requiredHeaders = ['product_name', 'product_quantity', 'product_category',
        'product_sub_category','product_bp_unit_cost', 'product_sp_unit_cost'];
    var realNames =  ['Product Name','Quantity','Category','Sub Category','Buying Unit Cost',
                 'Selling Unit Cost','Low Stock Limit','Expiry Date','Description','Maximum Discount',
                  'Tax Percentage','Commission'];
    var foundHeaders = [];
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var tableId = app.ui.table({
        id_to_append: "product_load_area",
        headers: ["Excel Column Headers","Required","Full Name","Data Format"],
        values: [['product_name','product_quantity','product_category','product_sub_category',
                'product_bp_unit_cost','product_sp_unit_cost','product_reminder_limit',
                'product_expiry_date','product_narration','max_discount','tax','commission'],
                 ['Yes','Yes','Yes','Yes','Yes','Yes','No','No','No','No','No','No'],
                realNames,
              ['Text','Number','Text','Text','Number','Number','Number','Date','Text','Number',
              'Number','Number']],
        include_nums: false,
        style: ""
    });
    $("#product_load_area").append("<input class='btn' id='choose_file' type='file'>");
    $("#product_load_area").append("<p class='warning' style='margin-top:10px'>\n\
            Place your products in the first worksheet.Please note that if a product \n\
            with the same name already exists it will not be recreated.</p>");
    $("#choose_file").change(handleFile);
    function handleFile(e) {
        var files = e.target.files;
        var i, f;
        for (i = 0, f = files[i]; i !== files.length; ++i) {
            var reader = new FileReader();
            var name = f.name;
            reader.onload = function (e) {
                var data = e.target.result;
                var workbook = XLSX.read(data, {type: 'binary'});
                var firstSheet = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheet];
                for (var z in worksheet) {
                    //read headers first
                    /* all keys that do not begin with "!" correspond to cell addresses */
                    if (z[0] === '!') continue;
                    if(z[1] === '1'){
                        //we are dealing with headers
                        foundHeaders.push(worksheet[z].v);
                    }
                    else {
                        break;
                    }
                   
                }
                //check that we have all the headers
                for(var x = 0; x < requiredHeaders.length; x++){
                    if(foundHeaders.indexOf(requiredHeaders[x]) === -1){
                        //this header is missing so complain about it
                        $("#"+tableId).html("<b>"+requiredHeaders[x]+"</b> referring to <b>"+realNames[x]+"</b> is a required \n\
                            column, it is missing from your excel file, please add it and retry.");
                        $('#choose_file').val('');
                        return;
                    }
                }
                //start creating the products
                $("#product_load_area").html("");
                var requestData = {
                    business_type : app.getSetting("business_type"),
                    product_unit_size : 1
                };
                var lastCol = foundHeaders[foundHeaders.length - 1];
                $("#product_load_area").append("");
                var statTable = app.ui.table({
                    id_to_append: "product_load_area",
                    headers: ["Product Name", "Creation Status", "Failure Reason"],
                    values: [[],[],[]],
                    include_nums: false,
                    style: ""
                });
                for (var z in worksheet) {
                    //read headers first
                    /* all keys that do not begin with "!" correspond to cell addresses */
                    if (z[0] === '!') continue;
                    if (z[1] === '1') continue; //skip headers
                    var currCol = foundHeaders[alpha.indexOf(z[0])];
                    var currVal = worksheet[z].v;
                    if(currCol === lastCol){
                        requestData[lastCol] = currVal;
                        var rq = $.extend(true, {}, requestData);
                        //send the create product request
                        app.xhr(rq, app.dominant_privilege, "create_product", {
                            load: false,
                            success: function (data,request) {
                                if (data.response.data === "SUCCESS") {
                                    $("#" + statTable).append("<tr><td>" + request.product_name + "</td>\n\
                                        <td>" + data.response.data + "</td><td></td></tr>");
                                }
                                else if (data.response.data === "FAIL") {
                                    $("#" + statTable).append("<tr><td>" + request.product_name + "</td>\n\
                                        <td>" + data.response.data + "</td><td>"+data.response.reason+"</td></tr>");
                                }
                            }
                        });
                    }
                    else {
                        requestData[currCol] = currVal;
                    }
                }
                
            };
            reader.readAsBinaryString(f);
        }
    }
};


