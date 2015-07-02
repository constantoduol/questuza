/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function AppData() {
    $(document).ready(function () {
        var path = window.location.pathname;
        app.appData.formData.onload.once();
        app.appData.formData.onload.always();
        app.skippable_pages = [app.pages.paginate,app.pages.account,"/help/"];
        app.ignoreIrrelevantPaths(path);
        if (app.appData.formData.onload[path]) {
            app.appData.formData.onload[path]();
        }
    });
}

AppData.prototype.formData = {
    onload: {
        once : function(){
            //run once when the app loads
            //always enable modal windows
            var modalArea = $("<div id='modal_area'></div>");
            if(!$("#modal_area")[0])  $("body").append(modalArea);

            //setup the pages
            var bType = app.appData.formData.login.current_user.business_type;
            var prodPage = bType === "goods" ? "/views/product.html" : "/views/service_product.html";
            app.pages.products = prodPage;
            app.pages.users = "/views/user.html";
            app.pages.business = "/views/business.html";
            app.pages.expenses = "/views/expenses.html";
            app.pages.stock_history = "/views/stock_history.html";
            app.pages.paginate = "/views/paginate.html";
            app.pages.billing = "/views/billing.html";
            app.pages.pay_bill = "/views/pay_bill.html";
            app.pages.sale = "/sale.html";
            app.pages.sale_touch = "/sale_touch.html";
            app.pages.account = "/views/account.html";
            app.pages.suppliers = "/views/suppliers.html";
            app.pages.supplier_select = "/views/supplier_select.html";
            app.pages.supplier_account = "/views/supplier_account.html";
            app.pages.settings = "/views/settings.html";
            app.pages.keypad = "/views/keypad.html";

            //setup the dominant privilege
            app.dominant_privilege = app.appData.formData.login.current_user.dominantPrivilege();
        },
        always: function () {
            //run always when a page is loaded
            app.appData.formData.onload.setupAccount();

        },
        setupAccount : function(){
            //always shorten the username
            var user = app.appData.formData.login.current_user.name;
            var shortUser;
            if (user && user.length > 20) {
                shortUser = user.substring(0, 20) + "..."; //no overlong usernames
            }
            else {
               shortUser = user;
            }
            
            //setup account details
            var logoutLink = $("#logout_link");
            logoutLink.html(shortUser);
            logoutLink.unbind("click");
            logoutLink.click(function(){
                var m = app.ui.modal("","User Account",{
                    cancelText : "Cancel",
                    cancel : function(){
                        m.modal('hide');
                    }
                });
                app.loadPage({
                    load_url: app.pages.account,
                    load_area: "modal_content_area",
                    onload: function () {
                        $("#sign_out_link").click(app.logout);
                        $("#about_link").click(app.brand);
                        $("#activate_link").click(app.activateProduct);
                        $("#help_link").click(function(){
                            app.paginate({
                                title: "Help",
                                save_state: true,
                                save_state_area: "content_area",
                                onload_handler : app.currentPage(),
                                onload : function(){
                                    m.modal('hide');
                                    app.loadPage({
                                        load_url : app.sub_context.help_url,
                                        load_area: "paginate_body"
                                    });
                                }
                            });
                        });
                        
                        $("#change_password_link").click(function(){
                            window.location = "/change.html?user_name="+user;
                        });
                   
                    }
                });
            });
        },
        "/index.html" : function(){
            app.context = app.appData.formData.login;
            app.xhr({}, "open_data_service", "fetch_settings", {
                load: false,
                success: function (resp) {
                    var r = resp.response.data;
                    localStorage.setItem("settings", JSON.stringify(r));
                    var userInterface = app.getSetting("user_interface");
                    if(userInterface === "touch"){
                        window.location = "index_touch.html";
                    }
                }
            });
        },
        "/" : function(){
            this["/index.html"]();
        },
        "/index_touch.html" : function(){
            app.keyPad("keypad","password");
            app.context = app.appData.formData.login_touch;
            app.xhr({}, "open_data_service", "fetch_settings", {
                load: false,
                success: function (resp) {
                    var r = resp.response.data;
                    localStorage.setItem("settings", JSON.stringify(r));
                     $("#password").val("");
                }
            });
        },
        "/views/paginate.html": function () {
            //dont show a print button on mobile
            if (app.platform === "mobile") {
                $("#paginate_print").remove();
            }
        },
        "/sale_touch.html" : function(){
            app.context = app.appData.formData.sale_touch;
            app.sub_context = app.appData.formData.sale_touch.product;
            $("#product_display_area").html("");
            $("#category_area").html("");
            app.loadCategories("category_area","category");
            $("#home_link").click(function(){
               $("#category_area").html("");
               $("#product_display_area").html("");
               app.loadCategories("category_area","category"); 
            });
            
             $("#clear_sale_link").click(function(){
                 $("#category_area").html("");
                $("#product_display_area").html("");
                $("#current_sale_card").html("");
                $("#commit_link").css("visibility", "hidden");
                $("#total_qty").css("visibility", "hidden");
                $("#total_amount").css("visibility", "hidden");
                $("#clear_sale_link").css("visibility", "hidden");
                $("#total_qty").html("0");
                $("#total_amount").html("0.00");
                app.loadCategories("category_area", "category"); 
            });
            
            $("#commit_link").click(app.commitSale);
            
            $("#todays_sale_link").click(app.todaySales);
            
            
            $("#logout_link").unbind("click");
            $("#logout_link").click(app.logout);
            
            app.generateReceiptHeaders();
            
            if (app.platform === "web") {
                if (!$("#receipt_area")[0]) {
                    $("body").append("<iframe id='receipt_area' name='receipt_area' style='width:0px;height:0px'></iframe>");
                    $("body").append("<div id='receipt_area_dummy' style='display:none'></div>");
                    var cssLink = document.createElement("link")
                    cssLink.href = "css/bootstrap.min.css";
                    cssLink.rel = "stylesheet";
                    cssLink.type = "text/css";
                    app.runLater(2000, function () {
                        window.frames['receipt_area'].document.getElementsByTagName("head")[0].appendChild(cssLink);
                    });
                }
            }
        },
        "/sale.html": function () {
            app.context = app.appData.formData.sale;
            app.sub_context = app.appData.formData.sale.product;
            app.setUpAuto(app.context.product.fields.search_products);
            $("#search_link").click(function () {
                app.allProducts(app.pages.sale);
            });
            $("#clear_sale_btn").click(app.clearSale);
            $("#commit_sale_btn").click(app.commitSale);
            $("#todays_sale_btn").click(app.todaySales);
            $("#stock_expiry_btn").click(function () {
                app.stockExpiry(app.pages.sale);
            });
            $("#stock_low_btn").click(function () {
                app.stockLow(app.pages.sale);
            });
            
            //bind shortcuts for the sales person
            $(document).bind('keyup', 'Shift+return', function(){
                app.commitSale();
            });
            $(document).bind('keyup', 'Shift+c', function(){
                app.clearSale();
            });
             $(document).bind('keyup', 'Shift+f', function(){
                $("#search_products").val("");
                $("#search_products").focus();
             });
              $("#commit_sale_btn").bind('keyup', 'Shift+f', function(){
                $("#search_products").val("");
                $("#search_products").focus();
             });
              $("#commit_sale_btn").bind('keyup', 'Shift+c', function(){
                  app.clearSale();
             });
            
            //$("#logout_link").click(app.logout);
            var bType = app.appData.formData.login.current_user.business_type;
            if (bType === "services") {
                $("#stock_low_btn").remove();
                $("#stock_expiry_btn").remove();
            }
            ////////-----print receipt stuff
            if(app.platform === "web"){
                if(!$("#receipt_area")[0]) {
                    $("body").append("<iframe id='receipt_area' name='receipt_area' style='width:0px;height:0px'></iframe>");
                    $("body").append("<div id='receipt_area_dummy' style='display:none'></div>");
                    var cssLink = document.createElement("link")
                    cssLink.href = "css/bootstrap.min.css";
                    cssLink.rel = "stylesheet";
                    cssLink.type = "text/css";
                    app.runLater(2000, function () {
                        window.frames['receipt_area'].document.getElementsByTagName("head")[0].appendChild(cssLink);
                    });
                }
            }
        },
        "/admin.html": function () {
            app.context = app.appData.formData.admin;
            app.loadPage({load_url: app.pages.products, load_area: "content_area"});
            $("#logo_cont_main").click(app.brand);
            var bussId = localStorage.getItem("business_id");
            if (!bussId) {
                var m = app.ui.modal("Welcome, Please proceed to setup your business", "No Business Set", {
                    ok: function () {
                        app.loadPage({load_url: app.pages.business, load_area: "content_area"});
                        m.modal('hide');
                    },
                    cancel: function () {
                        alert("No business set, signing out");
                        app.logout();
                    },
                    okText: "Proceed",
                    cancelText: "Cancel"
                });
            }
        },
        "/views/user.html": function () {
            app.sub_context = app.context.user;
            $("#create_user_btn").click(app.createUser);
            $("#update_user_btn").click(app.updateUser);
            $("#delete_user_btn").click(function () {
                app.generalUserRequest("delete_user");
            });
            $("#disable_user_btn").click(function () {
                app.generalUserRequest("disable_user");
            });
            $("#enable_user_btn").click(function () {
                app.generalUserRequest("enable_user");
            });
            $("#reset_user_btn").click(app.resetPassword);
            $("#add_category_btn").click(app.addProductCategory);
            $("#search_link").click(app.allUsers);
            app.setUpAuto(app.context.user.fields.search_users);
            app.xhr({category_type : "category"},app.dominant_privilege,"product_categories",{
                load : false,
                success : function(resp){
                    var r = resp.response.data.PRODUCT_CATEGORY;
                    $.each(r, function (index) {
                        var cat = r[index];
                        $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                    }); 
                }
            });
          
        },
        "/views/product.html": function () {
            app.sub_context = app.context.product;
            $("#create_product_btn").click(app.createProduct);
            $("#update_product_btn").click(app.updateProduct);
            $("#delete_product_btn").click(app.deleteProduct);
            $("#supplier_product_btn").click(app.supplierSelect);
            $("#search_link").click(function () {
                app.allProducts(app.pages.products);
            });
            app.setUpAuto(app.context.product.fields.search_products);
            app.setUpAuto(app.context.product.fields.product_category);
            app.setUpAuto(app.context.product.fields.product_sub_category);
            app.setUpDate("product_expiry_date", true); //has limit
        },
        "/views/service_product.html": function () {
            app.sub_context = app.context.service_product;
            $("#create_product_btn").click(app.createProduct);
            $("#update_product_btn").click(app.updateProduct);
            $("#delete_product_btn").click(app.deleteProduct);
            $("#supplier_product_btn").click(app.supplierSelect);
            $("#search_link").click(function () {
                app.allProducts(app.pages.products);
            });
            app.setUpAuto(app.context.product.fields.search_products);
            app.setUpAuto(app.context.product.fields.product_category);
            app.setUpAuto(app.context.product.fields.product_sub_category);
            if(localStorage.getItem("track_stock") === "0" ){
                $("#product_quantity").remove();
                $("#product_quantity_label").remove();
            }
        },
        "/views/supplier_select.html" : function(){
            app.setUpAuto(app.context.suppliers.fields.search_suppliers);
        },
        "/views/suppliers.html": function () {
            app.sub_context = app.context.suppliers;
            app.setUpAuto(app.context.suppliers.fields.search_suppliers);
            $("#save_supplier_btn").click(function () {
                app.supplierAction("create");
            });
            $("#update_supplier_btn").click(function () {
                app.supplierAction("update");
            });
            $("#delete_supplier_btn").click(function () {
                app.supplierAction("delete");
            });
            $("#search_link").click(app.allSuppliers);
            $("#country").html("");
            $.each(app.nations, function (index) {
                var nation = app.nations[index];
                $("#country").append($("<option value=" + nation + ">" + nation + "</option>"));
            });

        },
        "/views/business.html": function () {
            app.sub_context = app.context.business;
            $("#save_business_btn").click(function () {
                app.saveBusiness("create");
            });
            $("#update_business_btn").click(function () {
                app.saveBusiness("update");
            });
            $("#delete_business_btn").click(function () {
                app.saveBusiness("delete");
            });
            
            $("#settings_business_btn").click(app.settings);
            
            $("#country").html("");
            $.each(app.nations, function (index) {
                var nation = app.nations[index];
                $("#country").append($("<option value=" + nation + ">" + nation + "</option>"));
            });
            //load all values for business
            app.xhr({}, "open_data_service", "business_data", {
                load: true,
                success: function (data) {
                    var resp = data.response.data;
                    $("#business_name").val(resp.BUSINESS_NAME[0]);
                    $("#country").val(resp.COUNTRY[0]);
                    $("#city").val(resp.CITY[0]);
                    $("#postal_address").val(resp.POSTAL_ADDRESS[0]);
                    $("#phone_number").val(resp.PHONE_NUMBER[0]);
                    $("#company_website").val(resp.COMPANY_WEBSITE[0]);
                    $("#business_type").val(resp.BUSINESS_TYPE[0]);

                },
                error: function () {
                    //do something 
                    app.showMessage(app.context.error_message);
                }
            });
        },
        "/views/expenses.html": function () {
            app.sub_context = app.context.expense;
            $("#save_resource_btn").click(app.addResource);
            app.setUpDate("start_date"); //no limit
            app.setUpDate("end_date"); //no limit
            $("#profit_and_loss_btn").click(app.profitAndLoss);
        },
        "/change.html": function () {
            $("#user_name").val(app.getUrlParameter("user_name"));
            $("#old_password").val(app.getUrlParameter("pass_word"));
        },
        "/views/stock_history.html": function () {
            app.sub_context = app.context.stock_history;
            $("#stock_history_btn").click(app.stockHistory);
            $("#stock_expiry_btn").click(function () {
                app.stockExpiry(app.pages.stock_history);
            });
            $("#stock_low_btn").click(function () {
                app.stockLow(app.pages.stock_history);
            });
            $("#search_link").click(function () {
                app.allProducts(app.pages.stock_history);
            });
            
            $("#report_type").change(function(){
               var report = $("#report_type").val();
               if(report === "supplier_history"){
                  $("#stock_select_suppliers_div").css("display","block"); 
               }
               else {
                  $("#stock_select_suppliers_div").css("display","none");   
               }
            });
            
            app.setUpDate("start_date"); //no limit
            app.setUpDate("end_date"); //no limit
            app.setUpAuto(app.context.stock_history.fields.search_stock);
            var bType = app.appData.formData.login.current_user.business_type;
            if (bType === "services") {
                $("#stock_low_btn").remove();
                $("#stock_expiry_btn").remove();
            }
            
            $.each(app.times, function (index) {
                var time = app.times[index];
                $("#start_time").append($("<option value=" + time + ">" + time + "</option>"));
                $("#stop_time").append($("<option value=" + time + ">" + time + "</option>"));
            });
            //load all users
            app.xhr({}, "pos_admin_service,pos_admin_service", "all_users,all_suppliers", {
                load: false,
                success: function (data) {
                    var userResp = data.response.pos_admin_service_all_users.data;
                    var supResp = data.response.pos_admin_service_all_suppliers.data;
                    $("#stock_select_users").html("<option value='all'>All</option>");
                    $.each(userResp.USER_NAME, function (index) {
                        var name = userResp.USER_NAME[index];
                        $("#stock_select_users").append($("<option value=" + name + ">" + name + "</option>"));
                    });
                    
                    $("#stock_select_suppliers").html("<option value='all'>All</option>");
                    $.each(supResp.SUPPLIER_NAME, function (index) {
                        var name = supResp.SUPPLIER_NAME[index];
                        var id = supResp.ID[index];
                        $("#stock_select_suppliers").append($("<option value=" + id + ">" + name + "</option>"));
                    });
                }
            });
        }
    },
    login: {
        fields: {
            username: {required: true, message: "Email address is required"},
            password: {required: true, message: "Password is required"}
        },
        error_space: "error_space_login",
        load_area: "error_space_login",
        error_message: "Well,it seems the server is unavailable",
        businesss_required: "Both email and business name are required!",
        password_reset_success: "An email has been sent to your address, use it to reset your password",
        current_user: {
            name: localStorage.getItem("current_user"),
            host: localStorage.getItem("host"),
            business_id: localStorage.getItem("business_id"),
            business_type: localStorage.getItem("business_type"),
            dominantPrivilege: function () {
                var privs = localStorage.getItem("privileges");
                if (privs && privs.indexOf("pos_admin_service") > -1) {
                    return "pos_admin_service";
                }
                else if (privs && privs.indexOf("pos_sale_service") > -1) {
                    return "pos_sale_service";
                }
            }
        },
        messages: {
            invalidpass: "The password you entered is invalid",
            notexist: "User account does not exist",
            disabled: "User account has been disabled"
        }
    },
    login_touch : {
        fields: {
            password: {required: true, message: "PIN is required"},
            username: {required: false}//dLhkCJaBox2jIDpJKfHzsIxV1SGiNqWNh+ZWDtYrZDBgaweQQExDLcn66d0mExrECCtwnzT+l/fky7OR2Qr6iw==
        },
        error_space: "error_space_login",
        load_area: "error_space_login",
        error_message: "Server is unavailable! No connection.",
        businesss_required: "Both email and business name are required!",
        password_reset_success: "An email has been sent to your address, use it to reset your password",
        current_user: {
            name: localStorage.getItem("current_user"),
            host: localStorage.getItem("host"),
            business_id: localStorage.getItem("business_id"),
            business_type: localStorage.getItem("business_type"),
            dominantPrivilege: function () {
                var privs = localStorage.getItem("privileges");
                if (privs && privs.indexOf("pos_admin_service") > -1) {
                    return "pos_admin_service";
                }
                else if (privs && privs.indexOf("pos_sale_service") > -1) {
                    return "pos_sale_service";
                }
            }
        },
        messages: {
            invalidpass: "The password you entered is invalid",
            notexist: "User account does not exist",
            disabled: "User account has been disabled"
        }
    },
    create_account: {
        fields: {
            user_name: {required: true, message: "Email address is required"},
            real_name: {required: true, message: "Name is required"},
            password: {required: true, message: "Password is required"},
            confirm_password: {required: true, message: "Confirm password is required"}
        },
        error_space: "error_space_create",
        load_area: "error_space_create",
        error_message: "Well,it seems the server is unavailable",
        passwords_not_match: "The passwords entered do not match",
        password_not_valid: "Password should be more than 4 characters, have at least one number and be less than 50 characters",
        create_account_success: "User account was created successfully, check your email to activate your account",
        create_account_fail: "User account already exists, try a different email address"
    },
    change_pass: {
        fields: {
            user_name: {required: true, message: "Email address is required"},
            old_password: {required: true, message: "Old password is required"},
            new_password: {required: true, message: "New password is required"},
            confirm_password: {required: true, message: "Confirm password is required"}
        },
        error_space: "error_space_login",
        load_area: "error_space_login",
        error_message: "Well,it seems the server is unavailable",
        passwords_not_match: "New password and confirm password do not match",
        password_not_valid: "Password should be more than 4 characters, have at least one number and be less than 50 characters",
        messages: {
            false: "The old password entered is invalid"
        }
    },
    sale_touch: {
        product: {
            fields: {
                
            },
            help_url : "/help/sale.html"
        },
        error_space: "error_space_sale",
        load_area: "error_space_sale",
        error_message: "Well,it seems the server is unavailable",
        commit_sale: "Do you wish to commit transaction?",
        invalid_qty: "An invalid quantity has been specified for this item",
        insufficient_stock: "There is not sufficient stock to proceed with the sale",
        no_product_selected: "No products have been selected for sale",
        transact_fail: "Transaction failed",
        transact_success: "Transaction was successful",
        reverse_success: "Transaction reversed successfully"
    },
    sale: {
        product: {
            fields: {
                search_products: {
                    autocomplete: {
                        id: "search_products",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        selected: [],
                        after: function (data, index) {
                            app.sale(data, index);
                            $("#commit_sale_btn").focus(); 
                            
                        }
                    }}
            },
            help_url : "/help/sale.html"
        },
        error_space: "error_space_sale",
        load_area: "error_space_sale",
        error_message: "Well,it seems the server is unavailable",
        commit_sale: "Do you wish to commit transaction?",
        invalid_qty: "An invalid quantity has been specified for this item",
        insufficient_stock: "There is not sufficient stock to proceed with the sale",
        no_product_selected: "No products have been selected for sale",
        transact_fail: "Transaction failed",
        transact_success: "Transaction was successful",
        reverse_success: "Transaction reversed successfully"
    },
    admin: {
        user: {
            fields: {
                search_users: {
                    autocomplete: {
                        id: "search_users",
                        database: "user_server",
                        table: "BUSINESS_USERS",
                        column: "USER_NAME,ID",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "USER_NAME  LIKE '" + $("#search_users").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "USER_NAME ASC",
                        limit: 10,
                        key: "USER_NAME",
                        data: {},
                        after: function (data, index) {
                            var name = data.USER_NAME[index];
                            $("#email_address").val(name);
                            var request = {
                                name: name
                            };
                            app.xhr(request, "user_service", "view_user", {
                                load: false,
                                success: function (data) {
                                    var privs = data.response.data.priv_data;
                                    if (privs.indexOf("pos_admin_service") > -1) {
                                        $("#user_role").val("admin");
                                    }
                                    else {
                                        $("#user_role").val("seller");
                                    }
                                }
                            });
                            app.fetchProductCategory();
                        }
                    }
                },
                email_address: {required: true, message: "Email address is required"},
                user_role: {required: true, message: "User role is required"},
                real_name: {required: false}
            },
            help_url : "/help/user.html"
        },
        service_product: {
            fields: {
                search_products: {
                    autocomplete: {
                        id: "search_products",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        after: function (data, index) {
                            var currentProduct = data.PRODUCT_NAME[index];
                            $("#product_name").attr("old-product-name", currentProduct);
                        }
                    },
                    autocomplete_handler: {
                        product_name: "PRODUCT_NAME",
                        product_category: "PRODUCT_CATEGORY",
                        product_sub_category: "PRODUCT_SUB_CATEGORY",
                        product_sp_unit_cost: "SP_UNIT_COST",
                        product_narration: "PRODUCT_NARRATION",
                        tax : "TAX",
                        commission : "COMMISSION"
                    }
                },
                product_quantity: {required: false, sign : "+"},
                product_name: {required: true, message: "Product name is required"},
                product_category: {
                    required: false,
                    autocomplete: {
                        id: "product_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_CATEGORY",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_CATEGORY  LIKE '" + $("#product_category").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_CATEGORY",
                        data: {}
                    }
                },
                product_sub_category: {
                    required: false,
                    autocomplete: {
                        id: "product_sub_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_SUB_CATEGORY",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_SUB_CATEGORY  LIKE '" + $("#product_sub_category").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_SUB_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_SUB_CATEGORY",
                        data: {}
                    }
                },
                product_sp_unit_cost: {required: true, message: "Product selling price per unit is required", sign : "+"},
                product_narration: {required: false},
                tax : {required:false, sign : "+"},
                commission : {required:false, sign : "+"}
            },
            help_url : "/help/service_product.html"
        },
        product: {
            fields: {
                search_products: {
                    autocomplete: {
                        id: "search_products",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        after: function (data, index) {
                            var currentProduct = data.PRODUCT_NAME[index];
                            $("#product_name").attr("old-product-name", currentProduct);
                        }
                    },
                    autocomplete_handler: {
                        product_name: "PRODUCT_NAME",
                        product_quantity: "PRODUCT_QTY",
                         product_category: "PRODUCT_CATEGORY",
                        product_sub_category: "PRODUCT_SUB_CATEGORY",
                        product_bp_unit_cost: "BP_UNIT_COST",
                        product_sp_unit_cost: "SP_UNIT_COST",
                        product_reminder_limit: "PRODUCT_REMIND_LIMIT",
                        product_expiry_date: "PRODUCT_EXPIRY_DATE",
                        product_narration: "PRODUCT_NARRATION",
                        tax : "TAX",
                        commission : "COMMISSION"
                    }
                },
                product_name: {required: true, message: "Product name is required"},
                product_quantity: {required: true, message: "Product quantity is required", sign : "+"},
                product_category: {
                    required: false,
                    autocomplete: {
                        id: "product_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_CATEGORY",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_CATEGORY  LIKE '" + $("#product_category").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_CATEGORY",
                        data: {}
                    }
                },
                product_sub_category: {
                    required: false,
                    autocomplete: {
                        id: "product_sub_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_SUB_CATEGORY",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_SUB_CATEGORY  LIKE '" + $("#product_sub_category").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_SUB_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_SUB_CATEGORY",
                        data: {}
                    }
                },
                product_bp_unit_cost: {required: true, message: "Product buying price per unit is required", sign : "+"},
                product_sp_unit_cost: {required: true, message: "Product selling price per unit is required", sign : "+"},
                product_reminder_limit: {required: true, message: "Product reminder limit is required", sign : "+"},
                product_expiry_date: {required: true, message: "Product expiry date required"},
                product_narration: {required: false},
                tax : {required:false, sign : "+"},
                commission : {required:false, sign : "+"}
            },
            help_url : "/help/product.html"
        },
        suppliers: {
            fields: {
                search_suppliers: {
                    autocomplete: {
                        id: "search_suppliers",
                        database: "pos_data",
                        table: "SUPPLIER_DATA",
                        column: "*",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "SUPPLIER_NAME  LIKE '" + $("#search_suppliers").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "SUPPLIER_NAME ASC",
                        limit: 10,
                        key: "SUPPLIER_NAME",
                        data: {},
                        after: function (data, index) {
                            var currentSupplier = data.SUPPLIER_NAME[index];
                            $("#supplier_name").attr("old-supplier-name", currentSupplier);
                        }
                    },
                    autocomplete_handler: {
                        supplier_name: "SUPPLIER_NAME",
                        phone_number: "PHONE_NUMBER",
                        email_address: "EMAIL_ADDRESS",
                        postal_address: "POSTAL_ADDRESS",
                        company_website: "WEBSITE",
                        contact_person_name: "CONTACT_PERSON_NAME",
                        contact_person_phone: "CONTACT_PERSON_PHONE",
                        city: "CITY",
                        country : "COUNTRY"
                    }
                },
                supplier_name: {required: true, message: "Supplier's name is required"},
                phone_number: {required: false},
                email_address: {required: false},
                postal_address: {required: false},
                company_website: {required: false},
                contact_person_name: {required: false},
                contact_person_phone: {required: false},
                city : {required:false},
                country : {required:false}
            },
            help_url : "/help/suppliers.html"
        },
        supplier_account : {
            fields : {
                entry_type : {required : true,message : "Entry type is required"},
                amount : {required : true,message : "Amount is required", sign : "+"},
                units_received : {required : true,message : "Units received is required",sign : "+"},
                sp_per_unit : {required : true,message : "Selling price per unit is required",sign : "+"},
                narration : {required : true,message : "Narration is required"}
            }
        },
       settings : {
            fields : {
                enable_undo_sales : {required : true},
                add_tax : {required : true},
                add_comm : {required : true},
                add_purchases : {required : true},
                track_stock : {required : true},
                user_interface : {required : false}
            }
        },
        stock_history: {
            fields: {
                report_type: {required: true, message: "Report type is required"},
                start_date: {required: true, message: "Start date is required"},
                end_date: {required: true, message: "End date is required"},
                search_stock: {
                    required: false,
                    autocomplete: {
                        id: "search_stock",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            var id = app.appData.formData.login.current_user.business_id;
                            return "PRODUCT_NAME  LIKE '" + $("#search_stock").val() + "%' AND BUSINESS_ID = '" + id + "'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {}
                    }
                }
            },
            help_url : "/help/stock_history.html"
        },
        expense: {
            fields: {
                resource_type: {required: true, message: "Resource type is required"},
                expense_name: {required: true, message: "Expense/Income name is required"},
                expense_amount: {required: true, message: "Expense/Income amount is required", sign : "+"}
            },
            help_url : "/help/expenses.html"
        },
        profit_and_loss: {
            fields: {
                start_date: {required: true, message: "Start date is required"},
                end_date: {required: true, message: "End date is required"}
            },
            help_url : "/help/profit_and_loss.html"
        },
        business: {
            fields: {
                business_name: {required: true, message: "Business name is required"},
                country: {required: true, message: "Country is required"},
                city: {required: true, message: "City is required"},
                postal_address: {required: false},
                phone_number: {required: false},
                company_website: {required: false},
                business_type: {required: true, message: "Business type is required"}
            },
            help_url : "/help/business.html"
        },
        error_space: "error_space_admin",
        load_area: "error_space_admin",
        error_message: "Well,it seems the server is unavailable",
        create_user: "User created successfully, initial password:pass",
        email_invalid: "The email address entered is invalid",
        update_user: "The user was updated successfully",
        delete_user: "The user was deleted successfully",
        delete_user_confirm: "Delete user ? This action cannot be undone",
        disable_user: "The user account was disabled successfully",
        disable_user_confirm: "Disable user account?",
        enable_user: "The user account was enabled successfully",
        enable_user_confirm: "Enable user account?",
        create_product: "Product created successfully",
        create_supplier : "Supplier created successfully",
        update_supplier : "Supplier updated successfully",
        delete_supplier : "Supplier deleted successfully",
        no_product_selected: "You have not selected any product, search to select",
        no_supplier_selected : "You have not selected any supplier, search to select",
        supplier_added : "Supplier was added successfully",
        supplier_deleted : "Supplier was deleted successfully",
        product_updated: "Product updated successfully",
        product_deleted: "Product deleted successfully",
        invalid_dates: "End date cannot be less than starting date",
        reset_password: "User password reset successfully",
        business_saved: "Business details saved successfully",
        action_success: "Requested action was completed successfully",
        action_failed: "Requested action failed",
        business_create_confirm: "Create a new Business ?",
        business_delete_confirm: "Delete business? You will lose all records for this business",
        business_deleted_success: "Business deleted successfully",
        resource_success: "{resource_type} was added successfully",
        supplier_transact : "Transaction was successful"
    }
};
