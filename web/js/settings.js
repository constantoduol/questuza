/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

App.prototype.settings = {
    business_name : {
        type: "text",
        id: "business_name",
        required: true,
        value: "",
        label: "Business Name",
        "class": "form-control" 
    },
    business_type : {
        type: "select",
        id: "business_type",
        option_names: ["Goods", "Services"],
        option_values: ["goods", "services"],
        required: true,
        selected: "1",
        "class": "form-control",
        label: "Business Type"
    },
    enable_undo_sales: {
        type : "select",
        id : "enable_undo_sales",
        option_names : ["Yes","No"],
        option_values : ["1","0"],
        required : true,
        selected : "1",
        "class" : "form-control",
        label : "Enable reverse sales for sales persons"
    },
    add_tax: {
        type: "select",
        id : "add_tax",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Add tax as an expense to profit and loss"
    },
    add_comm: {
        type: "select",
        id : "add_comm",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Add commission as an expense to profit and loss"
    },
    add_purchases: {
        type: "select",
        id : "add_purchases",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Add purchases from suppliers to profit and loss"
    },
    allow_discounts: {
        type: "select",
        id : "allow_discounts",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Allow discounts?"
    },
    add_discounts: {
        type: "select",
        id : "add_discounts",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Add discounts as an expense to profit and loss"
    },
    currency: {
        type: "select",
        id: "currency",
        option_names: [],
        option_values: [],
        required: true,
         "class" : "form-control",
        selected: "KES",
        label: "Currency"
    },
    track_stock:{
        type: "select",
        id : "track_stock",
        option_names: ["Yes", "No"],
        option_values: ["1", "0"],
        required : true,
        selected : "1",
         "class" : "form-control",
        label : "Track stock movement"
    },
    user_interface: {
        type: "select",
        id : "user_interface",
        option_names: ["Touch/Modern", "Desktop/Traditional"],
        option_values: ["touch", "desktop"],
        required : true,
        selected : "touch",
         "class" : "form-control",
        label : "User Interface"
    },
    date_format: {
        type: "select",
        id: "date_format",
        option_names: ["dd/MM/yyyy","yyyy/MM/dd","MM/dd/yyyy"],
        option_values: ["dd/MM/yyyy","yyyy/MM/dd","MM/dd/yyyy"],
        required: true,
        "class": "form-control",
        label: "Date Format"
    },
    no_of_decimals: {
        type: "text",
        id: "no_of_decimals",
        required: false,
        value: "2",
        label: "Number of Decimals",
        "class": "form-control"
    },
    no_of_receipts: {
        type : "number",
        id : "no_of_receipts",
        required : true,
        value : 1,
        label : "No of receipts",
        "class" : "form-control"
    },
    receipt_header: {
        type : "text",
        id : "receipt_header",
        required : false,
        value : "",
        label : "Receipt Header",
        "class" : "form-control"
    },
    receipt_footer: {
        type : "text",
        id : "receipt_footer",
        required : false,
        value : "",
        label : "Receipt Footer",
        "class" : "form-control"
    },
    save_btn :{
        type : "button",
        id : "save_btn",
        value : "Save Settings",
        "class" : "btn",
        style : "margin-top : 20px;",
        events : {
            click : app.saveSettings
        }
    }
};
