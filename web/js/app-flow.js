AppData.prototype.formData = {
    onload: AppData.prototype.onload,
    login: {
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
            dominantPrivilege: function () {
                var privs = localStorage.getItem("privileges");
                if (privs && privs.indexOf("pos_admin_service") > -1) {
                    return "pos_admin_service";
                }
                else if (privs && privs.indexOf("pos_sale_service") > -1) {
                    return "pos_sale_service";
                }
                else if (privs && privs.indexOf("pos_middle_service") > -1) {
                    return "pos_middle_service";
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
            user_name : {required : true},
            old_pin: {required: true, message: "Old pin is required"},
            new_pin: {required: true, message: "New pin is required"},
            confirm_new_pin: {required: true, message: "Confirm pin is required"}
        },
        error_space: "error_space_login",
        load_area: "error_space_login",
        error_message: "Well,it seems the server is unavailable",
        passwords_not_match: "New pin and confirm pin do not match",
        password_not_valid: "Pin should be numbers only",
        messages: {
            false: "The old pin entered is invalid"
        }
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
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        selected: [],
                        after: function (data, index) {
                            $("#category_area").html("");
                            $("#product_display_area").html("");
                            app.quantityPicker({
                                data: data,
                                index: index
                            });
                            

                        }
                    }
               }
            },
            help_url: "/help/sale.html"
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
                        table: "USERS",
                        column: "USER_NAME,USER_ID",
                        where: function () {
                            return "USER_NAME  LIKE '" + $("#search_users").val() + "%'";
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
                                    else if(privs.indexOf("pos_sale_service") > -1){
                                        $("#user_role").val("seller");
                                    }
                                    else if (privs.indexOf("pos_middle_service") > -1) {
                                        $("#user_role").val("intermediate");
                                    }
                                }
                            });
                        }
                    }
                },
                email_address: {required: true, message: "Email address is required"},
                user_role: {required: true, message: "User role is required"},
                real_name: {required: false}
            },
            help_url: "/help/user.html"
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
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%'";
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
                        fields: {
                            product_name: "PRODUCT_NAME",
                            product_category: "PRODUCT_CATEGORY",
                            product_sub_category: "PRODUCT_SUB_CATEGORY",
                            product_sp_unit_cost: "SP_UNIT_COST",
                            product_narration: "PRODUCT_NARRATION",
                            product_parent: "PRODUCT_PARENT",
                            max_discount : "MAX_DISCOUNT",
                            tax: "TAX",
                            commission: "COMMISSION"
                        }

                    }
                },
                product_quantity: {required: false, sign: "+"},
                product_name: {required: true, message: "Product name is required"},
                product_category: {
                    required: false,
                    autocomplete: {
                        id: "product_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_CATEGORY",
                        where: function () {
                            return "PRODUCT_CATEGORY  LIKE '" + $("#product_category").val() + "%'";
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
                            return "PRODUCT_SUB_CATEGORY  LIKE '" + $("#product_sub_category").val() + "%'";
                        },
                        orderby: "PRODUCT_SUB_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_SUB_CATEGORY",
                        data: {}
                    }
                },
                product_parent: {
                    required: false,
                    autocomplete: {
                        id: "product_parent",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            return "PRODUCT_NAME  LIKE '" + $("#product_parent").val() + "%'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        after: function (data, index) {
                            var prodId = data.ID[index];
                            $("#product_parent").attr("current-item", prodId);
                        }
                    }
                },
                product_sp_unit_cost: {required: true, message: "Product selling price per unit is required", sign: "+"},
                max_discount :{required:false,sign : "+"},
                product_narration: {required: false},
                tax: {required: false, sign: "+"},
                commission: {required: false, sign: "+"}
            },
            help_url: "/help/service_product.html"
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
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%'";
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
                        fields: {
                            product_name: "PRODUCT_NAME",
                            current_product_quantity : "PRODUCT_QTY",
                            product_category: "PRODUCT_CATEGORY",
                            product_sub_category: "PRODUCT_SUB_CATEGORY",
                            product_bp_unit_cost: "BP_UNIT_COST",
                            product_sp_unit_cost: "SP_UNIT_COST",
                            product_reminder_limit: "PRODUCT_REMIND_LIMIT",
                            product_expiry_date: "PRODUCT_EXPIRY_DATE",
                            product_narration: "PRODUCT_NARRATION",
                            max_discount : "MAX_DISCOUNT",
                            tax: "TAX",
                            commission: "COMMISSION"
                        },
                        after: function (data, index) {
                            var parentId = data.PRODUCT_PARENT[index];
                            console.log(parentId);
                            $("#product_parent").attr("current-item", parentId);
                            app.fetchItemById({
                                database: "pos_data",
                                table: "PRODUCT_DATA",
                                column: "*",
                                where: function () {
                                    return "ID = '" + parentId + "'";
                                },
                                success: function (data) {
                                    var r = data.response.data;
                                    $("#product_parent").val(r.PRODUCT_NAME[0]);
                                }
                            });
                        }
                    }
                },
                product_name: {required: true, message: "Product name is required"},
                product_quantity: {required: true, message: "Product quantity is required", sign: "+"},
                product_category: {
                    required: false,
                    autocomplete: {
                        id: "product_category",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "PRODUCT_CATEGORY",
                        where: function () {
                            return "PRODUCT_CATEGORY  LIKE '" + $("#product_category").val() + "%'";
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
                            return "PRODUCT_SUB_CATEGORY  LIKE '" + $("#product_sub_category").val() + "%'";
                        },
                        orderby: "PRODUCT_SUB_CATEGORY ASC",
                        limit: 10,
                        key: "PRODUCT_SUB_CATEGORY",
                        data: {}
                    }
                },
                product_parent: {
                    required: false,
                    autocomplete: {
                        id: "product_parent",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            return "PRODUCT_NAME  LIKE '" + $("#product_parent").val() + "%'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {},
                        after: function (data, index) {
                            var prodId = data.ID[index];
                            $("#product_parent").attr("current-item", prodId);
                        }
                    }
                },
                product_bp_unit_cost: {required: true, message: "Product buying price per unit is required", sign: "+"},
                product_sp_unit_cost: {required: true, message: "Product selling price per unit is required", sign: "+"},
                max_discount :{required:false,sign : "+"},
                product_reminder_limit: {required: false, message: "Product reminder limit is required", sign: "+"},
                product_expiry_date: {required: false, message: "Product expiry date required"},
                product_narration: {required: false},
                tax: {required: false, sign: "+"},
                commission: {required: false, sign: "+"}
            },
            help_url: "/help/product.html"
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
                            return "SUPPLIER_NAME  LIKE '" + $("#search_suppliers").val() + "%'";
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
                        fields: {
                            supplier_name: "SUPPLIER_NAME",
                            phone_number: "PHONE_NUMBER",
                            email_address: "EMAIL_ADDRESS",
                            postal_address: "POSTAL_ADDRESS",
                            company_website: "WEBSITE",
                            contact_person_name: "CONTACT_PERSON_NAME",
                            contact_person_phone: "CONTACT_PERSON_PHONE",
                            city: "CITY",
                            country: "COUNTRY"
                        }
                    }
                },
                supplier_name: {required: true, message: "Supplier's name is required"},
                phone_number: {required: false},
                email_address: {required: false},
                postal_address: {required: false},
                company_website: {required: false},
                contact_person_name: {required: false},
                contact_person_phone: {required: false},
                city: {required: false},
                country: {required: false}
            },
            help_url: "/help/suppliers.html"
        },
        supplier_account: {
            fields: {
                entry_type: {required: true, message: "Entry type is required"},
                payment_mode:  {required: true, message: "Payment mode is required"},
                amount: {required: true, message: "Amount is required", sign: "+"},
                units_received: {required: true, message: "Units received is required", sign: "+"},
                sp_per_unit: {required: true, message: "Selling price per unit is required", sign: "+"},
                narration: {required: true, message: "Narration is required"}
            }
        },
        settings: {
            fields: {
              
            }
        },
        stock_history: {
            fields: {
                report_type: {required: true, message: "Report type is required"},
                start_date: {required: true, message: "Start date is required"},
                end_date: {required: true, message: "End date is required"},
                product_categories : {required : true,message : "Product category is required"},
                search_products: {
                    required: false,
                    autocomplete: {
                        id: "search_products",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {}
                    }
                }
            },
            help_url: "/help/stock_history.html"
        },
        graphs : {
            fields : {
                search_products : {
                    required : false,
                    autocomplete: {
                        id: "search_products",
                        database: "pos_data",
                        table: "PRODUCT_DATA",
                        column: "*",
                        where: function () {
                            return "PRODUCT_NAME  LIKE '" + $("#search_products").val() + "%'";
                        },
                        orderby: "PRODUCT_NAME ASC",
                        limit: 10,
                        key: "PRODUCT_NAME",
                        data: {}
                    }
                },
                start_date: {required: true, message: "The start date is required"},
                end_date: {required: true, message: "The end date is required"}  
            }
        },
        expense: {
            fields: {
                resource_type: {required: true, message: "Resource type is required"},
                expense_name: {
                    required: true,
                    message: "Expense/Income name is required",
                    autocomplete: {
                        id: "expense_name",
                        database: "pos_data",
                        table: "EXPENSE_DATA",
                        column: "RESOURCE_NAME",
                        where: function () {
                            return "RESOURCE_NAME  LIKE '" + $("#expense_name").val() + "%'" +
                                    " AND RESOURCE_TYPE='" + $("#resource_type").val() + "'";
                        },
                        orderby: "RESOURCE_NAME ASC",
                        limit: 10,
                        key: "RESOURCE_NAME",
                        data: {},
                        after: function (data, index) {
                            console.log(data);
                        }
                    }
                },
                expense_amount: {required: true, message: "Expense/Income amount is required", sign: "+"}
            },
            help_url: "/help/expenses.html"
        },
        profit_and_loss: {
            fields: {
                start_date: {required: true, message: "Start date is required"},
                end_date: {required: true, message: "End date is required"}
            },
            help_url: "/help/profit_and_loss.html"
        },
        business: {
            fields: {
                business_name: {required: true, message: "Business name is required"},
                business_type: {required: true, message: "Business type is required"}
            },
            help_url: "/help/business.html"
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
        create_supplier: "Supplier created successfully",
        update_supplier: "Supplier updated successfully",
        delete_supplier: "Supplier deleted successfully",
        no_product_selected: "You have not selected any product, search to select",
        no_supplier_selected: "You have not selected any supplier, search to select",
        supplier_added: "Supplier was added successfully",
        supplier_deleted: "Supplier was deleted successfully",
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
        supplier_transact: "Transaction was successful",
        reverse_success: "Transaction reversed successfully"
    }
};
