
function AppData() {
    $(document).ready(function () {
        var path = window.location.pathname;
        app.appData.formData.onload.once();
        app.appData.formData.onload.always();
        app.skippable_pages = [app.pages.paginate, app.pages.account, "/help/"];
        app.ignoreIrrelevantPaths(path);
        if (app.appData.formData.onload[path]) {
            app.appData.formData.onload[path]();
        }
    });
}

AppData.prototype.onload = {
    once: function () {
        //run once when the app loads
        //always enable modal windows
        var modalArea = $("<div id='modal_area'></div>");
        if (!$("#modal_area")[0])
            $("body").append(modalArea);

        //setup the pages
        var bType = app.getSetting("business_type");
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
        app.pages.account = "/views/account.html";
        app.pages.suppliers = "/views/suppliers.html";
        app.pages.supplier_select = "/views/supplier_select.html";
        app.pages.supplier_account = "/views/supplier_account.html";
        app.pages.settings = "/views/settings.html";
        app.pages.keypad = "/views/keypad.html";
        app.pages.app_settings = "/views/app_settings.html";
        app.pages.graphs = "/views/graphs.html";
        app.pages.glance = "/views/glance.html";
        //setup the dominant privilege
        app.dominant_privilege = app.appData.formData.login.current_user.dominantPrivilege();
    },
    always: function () {
        //run always when a page is loaded
        app.appData.formData.onload.setupAccount();

    },
    setupAccount: function () {
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
        logoutLink.click(function () {
            var m = app.ui.modal("", "User Account", {
                cancelText: "Cancel",
                cancel: function () {
                    m.modal('hide');
                }
            });
            app.loadPage({
                load_url: app.pages.account,
                load_area: "modal_content_area",
                onload: function () {
                    $("#sign_out_link").click(function(){
                        m.modal('hide');
                        app.logout();
                    });
                    $("#about_link").click(function(){
                        m.modal('hide');
                        app.brand();
                    });
                    $("#activate_link").click(function(){
                        m.modal('hide');
                        app.activateProduct();
                    });
                    $("#help_link").click(function () {
                        app.paginate({
                            title: "Help",
                            save_state: true,
                            save_state_area: "content_area",
                            onload_handler: app.currentPage(),
                            onload: function () {
                                m.modal('hide');
                                app.loadPage({
                                    load_url: app.sub_context.help_url,
                                    load_area: "paginate_body"
                                });
                            }
                        });
                    });

                    $("#change_password_link").click(function () {
                        window.location = "/change.html?user_name=" + user;
                    });

                }
            });
        });
    },
    "/index.html": function () {
        app.keyPad("keypad");
        app.setupKeyPadField("password");
        app.context = app.appData.formData.login;
        $("#password").val("");
        $("#password").focus();
        $("#settings_icon").click(app.appSettings);
        app.fetchSettings();
    },
    "/": function () {
        this["/index.html"]();
    },
    "/views/paginate.html": function () {
        //dont show a print button on mobile
        if (app.platform === "mobile") {
            $("#paginate_print").remove();
        }
    },
    "/sale.html": function () {
        app.context = app.appData.formData.sale;
        app.sub_context = app.appData.formData.sale.product;
        $("#product_display_area").html("");
        $("#category_area").html("");
        app.getSetting("user_interface") === "desktop" ? app.loadSaleSearch() :  app.loadCategories("category_area", "category");
        
        $("#home_link").click(function () {
            $("#category_area").html("");
            $("#product_display_area").html("");
            app.getSetting("user_interface") === "desktop" ? app.loadSaleSearch() :  app.loadCategories("category_area", "category");
        });

        $("#clear_sale_link").click(function () {
            app.clearSale();
        });

        $("#commit_link").click(app.commitSale);
        $("#todays_sale_link").click(function () {
            app.todaySales(app.appData.formData.login.current_user.name, "all");
        });
        $("#logout_link").unbind("click");
        $("#logout_link").click(app.logout);

        if (app.dominant_privilege === "pos_middle_service") {
            $("#users_report_link").css("visibility", "visible");
            $("#users_report_link").click(function () {
                var select = "<label for='user_select'>Select User</label>\n\
                                    <select id='user_select'><option value='all'>All</select>\n\
                                    <label for='category_select'>Product Category</label>\n\
                                    <select id='category_select'><option value='all'>All</select>";
                var m = app.ui.modal(select, "Generate Report", {
                    okText: "Generate",
                    ok: function () {
                        app.todaySales($("#user_select").val(), $("#category_select").val());
                        m.modal('hide');
                    }
                });
                
                    app.xhr({category_type: "category"}, "" + app.dominant_privilege + "," + app.dominant_privilege + "", "all_users,product_categories", {
                        load: false,
                        success: function (data) {
                            var key = app.dominant_privilege + "_all_users";
                            var key1 = app.dominant_privilege + "_product_categories";
                            var userResp = data.response[key].data;
                            var catResp = data.response[key1].data.PRODUCT_CATEGORY.sort();
                            userResp.USER_NAME.sort();
                            $.each(userResp.USER_NAME, function (index) {
                                var name = userResp.USER_NAME[index];
                                $("#user_select").append($("<option value=" + name + ">" + name + "</option>"));
                            });

                            $.each(catResp, function (index) {
                                var cat = catResp[index];
                                $("#category_select").append($("<option value=" + cat + ">" + cat + "</option>"));
                            });

                            app.runLater(200, function () {
                                $("#modal_area_button_ok").focus();
                            });
                        }
                    });
            });
        }
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
//    "/sale.html": function () {
//        app.context = app.appData.formData.sale;
//        app.sub_context = app.appData.formData.sale.product;
//        app.setUpAuto(app.context.product.fields.search_products);
//        $("#search_link").click(function () {
//            app.allProducts(app.pages.sale);
//        });
//        $("#clear_sale_btn").click(app.clearSale);
//        $("#commit_sale_btn").click(app.commitSale);
//        $("#todays_sale_btn").click(app.todaySales);
//        $("#stock_expiry_btn").click(function () {
//            app.stockExpiry(app.pages.sale);
//        });
//        $("#stock_low_btn").click(function () {
//            app.stockLow(app.pages.sale);
//        });
//
//        //bind shortcuts for the sales person
//        $(document).bind('keyup', 'Shift+return', function () {
//            app.commitSale();
//        });
//        $(document).bind('keyup', 'Shift+c', function () {
//            app.clearSale();
//        });
//        $(document).bind('keyup', 'Shift+f', function () {
//            $("#search_products").val("");
//            $("#search_products").focus();
//        });
//        $("#commit_sale_btn").bind('keyup', 'Shift+f', function () {
//            $("#search_products").val("");
//            $("#search_products").focus();
//        });
//        $("#commit_sale_btn").bind('keyup', 'Shift+c', function () {
//            app.clearSale();
//        });
//
//        //$("#logout_link").click(app.logout);
//        var bType = app.appData.formData.login.current_user.business_type;
//        if (bType === "services") {
//            $("#stock_low_btn").remove();
//            $("#stock_expiry_btn").remove();
//        }
//        ////////-----print receipt stuff
//        if (app.platform === "web") {
//            if (!$("#receipt_area")[0]) {
//                $("body").append("<iframe id='receipt_area' name='receipt_area' style='width:0px;height:0px'></iframe>");
//                $("body").append("<div id='receipt_area_dummy' style='display:none'></div>");
//                var cssLink = document.createElement("link")
//                cssLink.href = "css/bootstrap.min.css";
//                cssLink.rel = "stylesheet";
//                cssLink.type = "text/css";
//                app.runLater(2000, function () {
//                    window.frames['receipt_area'].document.getElementsByTagName("head")[0].appendChild(cssLink);
//                });
//            }
//        }
//    },
    "/admin.html": function () {
        app.context = app.appData.formData.admin;
        app.loadPage({load_url: app.pages.glance, load_area: "content_area"});
        $("#logo_cont_main").click(app.brand);
    },
    "/views/glance.html" : function(){
        app.showGlance();
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
        $("#search_link").click(app.allUsers);
        app.setUpAuto(app.context.user.fields.search_users);

    },
    "/views/product.html": function () {
        app.sub_context = app.context.product;
        $("#create_product_btn").click(app.createProduct);
        $("#update_product_btn").click(app.updateProduct);
        $("#delete_product_btn").click(app.deleteProduct);
        $("#supplier_product_btn").click(app.supplierSelect);
        $("#excel_upload").click(app.uploadProductExcel);
        $("#search_link").click(function () {
            app.allProducts(app.pages.products);
        });
        app.setUpAuto(app.context.product.fields.search_products);
        app.setUpAuto(app.context.product.fields.product_category);
        app.setUpAuto(app.context.product.fields.product_sub_category);
        app.setUpAuto(app.context.product.fields.product_parent);
        app.setUpDate("product_expiry_date", true); //has limit
        app.xhr({category_type: "category"}, app.dominant_privilege, "product_categories", {
            load: false,
            success: function (resp) {
                var r = resp.response.data.PRODUCT_CATEGORY;
                $("#product_categories").html("");
                $("#product_categories").append($("<option value='all'>All</option>"));
                $.each(r, function (index) {
                    var cat = r[index];
                    $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                });
            }
        });
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
        app.setUpAuto(app.context.service_product.fields.search_products);
        app.setUpAuto(app.context.service_product.fields.product_category);
        app.setUpAuto(app.context.service_product.fields.product_sub_category);
        app.setUpAuto(app.context.service_product.fields.product_parent);
        if (localStorage.getItem("track_stock") === "0") {
            $("#product_quantity").remove();
            $("#product_quantity_label").remove();
        }
        app.xhr({category_type: "category"}, app.dominant_privilege, "product_categories", {
            load: false,
            success: function (resp) {
                var r = resp.response.data.PRODUCT_CATEGORY;
                $("#product_categories").html("")
                $("#product_categories").append($("<option value='all'>All</option>"));
                $.each(r, function (index) {
                    var cat = r[index];
                    $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                });
            }
        });
    },
    "/views/supplier_select.html": function () {
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
        app.loadSettings();
    },
    "/views/expenses.html": function () {
        app.sub_context = app.context.expense;
        $("#save_resource_btn").click(app.addResource);
        app.setUpDate("start_date"); //no limit
        app.setUpDate("end_date"); //no limit
        $("#profit_and_loss_btn").click(app.profitAndLoss);
        app.setUpAuto(app.context.expense.fields.expense_name);
    },
    "/change.html": function () {
        app.keyPad("keypad");
        app.setupKeyPadField("old_pin");
        app.setupKeyPadField("new_pin");
        app.setupKeyPadField("confirm_new_pin");
        $("#user_name").val(app.getUrlParameter("user_name"));
        $("#old_pin").val(app.getUrlParameter("pass_word"));
    },
    "/views/graphs.html" : function(){
        app.setUpDate("start_date"); //no limit
        app.setUpDate("end_date"); //no limit
        $("#y_btn").click(app.yAxisData);
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

        $("#report_type").change(function () {
            var report = $("#report_type").val();
            if (report === "supplier_history") {
                $("#stock_select_suppliers_div").css("display", "block");
            }
            else {
                $("#stock_select_suppliers_div").css("display", "none");
            }
        });

        app.setUpDate("start_date"); //no limit
        app.setUpDate("end_date"); //no limit
        app.setUpAuto(app.context.stock_history.fields.search_products);
        var bType = app.getSetting("business_type");
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
        app.xhr({category_type: "category"}, "" + app.dominant_privilege + "," + app.dominant_privilege + "," + app.dominant_privilege + "", "all_users,all_suppliers,product_categories", {
            load: false,
            success: function (data) {
                var key = app.dominant_privilege + "_all_users";
                var key1 = app.dominant_privilege + "_all_suppliers";
                var key2 = app.dominant_privilege + "_product_categories";
                var userResp = data.response[key].data;
                var supResp = data.response[key1].data;
                var catResp = data.response[key2].data.PRODUCT_CATEGORY;
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

                $("#product_categories").html("<option value='all'>All</option>");
                $.each(catResp, function (index) {
                    var cat = catResp[index];
                    $("#product_categories").append($("<option value=" + cat + ">" + cat + "</option>"));
                });


            }
        });
    }
};