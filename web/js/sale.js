App.prototype.generateReceipt = function () {
    var $frame = $("#receipt_area");
    var doc = $frame[0].contentWindow.document;
    var $body = $('body', doc);
    $body.html("<div id='receipt_iframe_area'></div>");
    $("#receipt_area_dummy").html("");
    var recArea = $("#receipt_iframe_area", doc);
    var elems = $(".sale_qtys");
    var totalCost = 0;
    var names = [];
    var amounts = [];
    var qtys = [];
    var subs = [];
    $.each(elems, function (elemIndex) {
        var elem = elems[elemIndex];
        var prodId = elem.getAttribute("id");
        var name = $("#prod_name_" + prodId).html();
        var value = elem.value.trim() === "" ? 0 : parseInt(elem.value);
        var sp = parseFloat($("#sale_span_" + prodId).html());
        amounts.push(app.formatMoney(sp));
        var cost = sp * value;
        subs.push(app.formatMoney(cost));
        qtys.push(value);
        names.push(name);
        totalCost = totalCost + cost;
    });
    var bType = localStorage.getItem("business_type");
    var recHeaders = ["Product", "Price", "Qty", "S/Total"];
    var recValues = [names, amounts, qtys, subs];
    recValues[0].push("<b>Totals</b>");
    recValues[1].push("<b>" + app.formatMoney(totalCost) + "</b>");
    recValues[2].push("");
    recValues[3].push("");
    var bName = localStorage.getItem("business_name");
    var header = "<div><h3>" + bName + "</h3></div>";
    recArea.append(header);
    app.ui.table({
        id_to_append: "receipt_area_dummy",
        headers: recHeaders,
        values: recValues,
    });
    var username = localStorage.getItem("current_user");
    var footer = "<div><span>Date : " + new Date().toLocaleString() + "</span><br/><span>Served by: " + username + "</span></div>";
    recArea.append($("#receipt_area_dummy").html());//copy to iframe
    recArea.append(footer);
};

App.prototype.printReceipt = function () {
    if ($("#print_receipt")[0].checked) {
        var win = document.getElementById("receipt_area").contentWindow;
        win.focus();// focus on contentWindow is needed on some ie versions
        win.print();
    }
};

App.prototype.calculateCost = function () {
    var elems = $(".sale_qtys");
    var totalCost = 0;
    $.each(elems, function (elemIndex) {
        var elem = elems[elemIndex];
        var prodId = elem.getAttribute("id");
        var value = elem.value.trim() === "" ? 0 : parseInt(elem.value);
        var sp = parseFloat($("#sale_span_" + prodId).html());
        var cost = sp * value;
        $("#sub_total_" + prodId).html(app.formatMoney(cost));
        totalCost = totalCost + cost;
    });
    if (app.platform === "web") {
        app.generateReceipt();
    }
    $("#amount_due").html(app.formatMoney(totalCost));
};

App.prototype.calculateChange = function () {
    var amountDue = $("#amount_due").html();
    var amountDueValue = amountDue.trim() === "" ? 0 : parseFloat(amountDue);
    var amountIssued = $("#amount_issued").val();
    var amountIssuedValue = amountIssued.trim() === "" ? 0 : parseFloat(amountIssued);
    var change = amountIssuedValue - amountDueValue;
    if (change > 0) {
        $("#customer_change").html(app.formatMoney(change));
    }
    else {
        $("#customer_change").html("0");
    }
};

App.prototype.rememberPrint = function () {
    if ($("#print_receipt")[0].checked) {
        localStorage.setItem("print_receipt", true);
    }
    else {
        localStorage.setItem("print_receipt", false);
    }
};

//called when salesman selects an item from the auto suggest
App.prototype.sale = function (data, index) {
    //we need to display the selected items
    //product name, type, SP/Unit, Available Stock,Expiry Date,sale qty
    var id = data.ID[index];
    //var name = "<span id='prod_name_'"+id+">"+data.PRODUCT_NAME[index]+"</span>";
    var name = "<span id='prod_name_"+id+"'>"+data.PRODUCT_NAME[index]+"</span>";
    var type = data.PRODUCT_TYPE[index];
    var sp = "<span id=sale_span_" + id + ">" + app.formatMoney(data.SP_UNIT_COST[index]) + "</span>";
    var elem = document.getElementById(id);
    if(elem){ //increase quantity
    	var value = elem.value;
    	value++;
    	elem.value = value;
    	app.calculateCost();
    	app.calculateChange();
    	return;
    }
    var bcolor = parseInt(data.PRODUCT_QTY[index]) < parseInt(data.PRODUCT_REMIND_LIMIT[index]) ? "orange" : "white"; //show color
    var style = bcolor === "orange" ? "background : " + bcolor + ";padding-left :10px;padding-right : 10px;color : white" : "";
    var avail = "<span id=sale_stock_" + id + " style='" + style + "'>" + data.PRODUCT_QTY[index] + "</span>";
    
    var exp = new Date(data.PRODUCT_EXPIRY_DATE[index]).toLocaleDateString();
    var extraStyle = app.platform === "mobile" ? "style='width : 100px'" : "";
    var qty = "<input type='number' value=1 class='sale_qtys' "+extraStyle+" \n\
                onkeyup='app.calculateCost();app.calculateChange()' onchange='app.calculateCost();app.calculateChange()' class='form-control' id=" + id + " >";
    var sub = "<span id='sub_total_"+id+"'>"+data.SP_UNIT_COST[index]+"</span>";
    var allItems = app.context.product.fields.search_products.autocomplete.selected;
    var bType = app.appData.formData.login.current_user.business_type;
    
    if(app.platform === "mobile"){
    	!allItems[0] ? allItems[0] = [name] : allItems[0].push(name);
        !allItems[1] ? allItems[1] = [sp] : allItems[1].push(sp);
        !allItems[2] ? allItems[2] = [avail] : allItems[2].push(avail);
        !allItems[3] ? allItems[3] = [qty] : allItems[3].push(qty);
    }
    
    else if (bType === "goods") {
        !allItems[0] ? allItems[0] = [name] : allItems[0].push(name);
        !allItems[1] ? allItems[1] = [type] : allItems[1].push(type);
        !allItems[2] ? allItems[2] = [sp] : allItems[2].push(sp);
        !allItems[3] ? allItems[3] = [avail] : allItems[3].push(avail);
        !allItems[4] ? allItems[4] = [exp] : allItems[4].push(exp);
        !allItems[5] ? allItems[5] = [qty] : allItems[5].push(qty);
        !allItems[6] ? allItems[6] = [sub] : allItems[6].push(sub);
    }
    else {
    	//services
        var x = 0;
        !allItems[x] ? allItems[x] = [name] : allItems[x].push(name);
        x++;
        !allItems[x] ? allItems[x] = [type] : allItems[x].push(type);
        if(app.getSetting("track_stock") === "1"){
            x++;
           !allItems[x] ? allItems[x] = [avail] : allItems[x].push(avail);
        }
        x++;
        !allItems[x] ? allItems[x] = [sp] : allItems[x].push(sp);
        x++;
        !allItems[x] ? allItems[x] = [qty] : allItems[x].push(qty);
        x++;
        !allItems[x] ? allItems[x] = [sub] : allItems[x].push(sub);
    }
    
    var headers;
    if(app.platform === "mobile"){
    	headers = ["Name","SP/U","Stock","Qty"];
    }
    else if (bType === "goods") {
        headers = ["Product Name", "Type", "SP/Unit", "Available Stock", "Expiry Date", "Sale Quantity","Sub Total"];
    }
    else if (bType === "services") {
        if(app.getSetting("track_stock") === "1"){
            headers = ["Product Name", "Type","Available Stock" , "SP/Unit", "Sale Quantity","Sub Total"];
        }
        else {
            headers = ["Product Name", "Type", "SP/Unit", "Sale Quantity","Sub Total"];
        }
    }
    
    $("#sale_area").html("");
    app.ui.table({
        id_to_append : "sale_area",
        headers : headers,
        values : allItems,
        include_nums : false,
        style : "font-size:16px",
        mobile_collapse : false
    });
    
    var printReceipt = localStorage.getItem("print_receipt") === "true" ? "checked='checked'" : "";
    var rct = app.platform === "web" ? "<td><input type='checkbox' id='print_receipt' "+printReceipt+" onclick='app.rememberPrint()' ></td>" : "";
    var rctHeader = app.platform === "web" ? "<th>Print Receipt</th>" : "";
    
    var html = "<table class='table amount_area' >" +
            "<tr>" +
            "<th>Due</th>" +
            "<th>Issued</th>" +
            "<th>Change</th>" +
             rctHeader +
            "</tr>" +
            "<tr>" +
            "<td id='amount_due'>0</td>" +
            "<td><input type='number' value='0' onkeyup='app.calculateChange()' onchange='app.calculateChange()' id='amount_issued' class='form-control'></td>" +
            "<td id='customer_change'>0</td>" +
             rct + 
            "</tr>" +
            "</table>";
    //generate the print receipt area

    var amountTable = $(html);
    $("#sale_area").append(amountTable);
    app.calculateCost();
};


App.prototype.todaySales = function () {
    var dateStr = new Date().toISOString();
    var date = dateStr.substring(0, dateStr.indexOf("T"));
    var request = {
        id: "all",
        user_name: app.appData.formData.login.current_user.name,
        begin_date: date,
        end_date: date,
        report_type : "stock_history"
    };
    app.xhr(request, app.dominant_privilege, "stock_history", {
        load: true,
        success: function (data) {

            var resp = data.response.data;
            //name,username,narr,time,type
            app.paginate({
                title: "Todays Sales",
                save_state: true,
                save_state_area: "content_area",
                onload_handler: app.pages.sale,
                onload: function () {
                    var totalQty = 0;
                    var totalAmount = 0;
                    var undos = [];
                    for (var index = 0; index < resp.TRAN_FLAG.length; index++) {
                        var flag = resp.TRAN_FLAG[index];
                        var undo = "<a href='#' onclick='app.undoSale(\"" + resp.PRODUCT_ID[index] + "\",\"" + resp.STOCK_QTY[index] + "\")' \n\
                        			title='Undo sale'>Undo Sale</a>";
                        var color, span, qty, amount;
                        if (flag === "sale_to_customer") {
                            color = "red";
                            span = "Sale To Customer";
                            app.getSetting("enable_undo_sales") === "1" ? undos.push(undo) : undos.push("");
                            qty = parseInt(resp.STOCK_QTY[index]);
                            amount = parseFloat(resp.STOCK_COST_SP[index]);
                        }
                        else if (flag === "reversal_of_sale") {
                            color = "green";
                            span = "Customer Returned Stock ";
                            undos.push("");
                            qty = -parseInt(resp.STOCK_QTY[index]);
                            amount = -parseFloat(resp.STOCK_COST_SP[index]);
                        }
                        else {
                            //this is a different flag e.g new_stock
                            //dont show it
                            resp.PRODUCT_NAME.splice(index, 1);
                            resp.TRAN_TYPE.splice(index, 1);
                            resp.STOCK_QTY.splice(index, 1);
                            resp.STOCK_COST_SP.splice(index, 1);
                            resp.NARRATION.splice(index, 1);
                            resp.CREATED.splice(index, 1);
                            resp.TRAN_FLAG.splice(index, 1);
                            index--; //we do this to filter out stock increases from sales
                            continue;
                        }

                        resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + span + "<span>";
                        var time = new Date(resp.CREATED[index]).toLocaleTimeString();
                        resp.CREATED[index] = time;
                        resp.STOCK_COST_SP[index] = app.formatMoney(amount);
                        resp.STOCK_QTY[index] = qty;
                        totalQty = totalQty + qty;
                        totalAmount = totalAmount + amount;


                    }
                    resp.STOCK_COST_SP.push("<b>" + app.formatMoney(totalAmount) + "</b>");
                    resp.STOCK_QTY.push("<b>" + totalQty + "</b>");
                    resp.PRODUCT_NAME.push("");
                    resp.TRAN_TYPE.push("<b>Totals</b>");
                    resp.NARRATION.push("");
                    resp.CREATED.push("");
                    app.ui.table({
                        id_to_append: "paginate_body",
                        headers: ["Product Name", "Entry Type", "Sale Qty", "Amount Received", "Narration", "Entry Time", "Undo Sale"],
                        values: [resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.STOCK_QTY, resp.STOCK_COST_SP, resp.NARRATION, resp.CREATED, undos],
                        include_nums: true,
                        style: "",
                        mobile_collapse: true,
                        summarize: {
                            cols: [4],
                            lengths: [80]
                        }
                    });
                }
            });
        }
    });
};


App.prototype.clearSale = function () {
    $("#sale_area").html("");
    app.context.product.fields.search_products.autocomplete.selected = [];
};

App.prototype.commitSale = function () {
    //do more stuff
    var elems = $(".sale_qtys");
    var prodIds = [];
    var qtys = [];
    var bType = app.appData.formData.login.current_user.business_type;
    for (var x = 0; x < elems.length; x++) {
        var elem = elems[x];
        var prodId = elem.getAttribute("id");
        var qty = elem.value.trim() === "" ? 0 : parseInt(elem.value);
        var availStock = parseInt($("#sale_stock_" + prodId).html());
        if (qty <= 0) {
            app.showMessage(app.context.invalid_qty);
            elem.focus();
            return;
        }
        else if (qty > availStock && app.getSetting("track_stock") === "1") {
            app.showMessage(app.context.insufficient_stock);
            elem.focus();
            return;
        }
        else {
            prodIds.push(prodId);
            qtys.push(qty);
        }

    }

    if (prodIds.length === 0) {
        app.showMessage(app.context.no_product_selected);
        return;
    }

    var m = app.ui.modal(app.context.commit_sale, "Commit Sale", {
        ok: function () {
            var request = {
                product_ids: prodIds,
                product_qtys: qtys,
                tran_type: "0",
                tran_flag: "sale_to_customer",
                business_type: app.appData.formData.login.current_user.business_type
            };
            //do some stuff like saving to the server
            app.xhr(request, app.dominant_privilege, "transact", {
                load: true,
                success: function (data) {
                    var resp = data.response.data;
                    if (resp === "success") {
                        //well transaction successful
                        if (app.platform === "web") {
                            app.printReceipt();
                        }
                        app.clearSale();
                        app.showMessage(app.context.transact_success);
                    }
                    else if (resp === "fail") {
                        app.showMessage(app.context.transact_fail);
                    }
                }
            });
            m.modal('hide');
        },
        cancel: function () {
            //do nothing
        },
        okText: "Proceed",
        cancelText: "Cancel"
    });
    app.runLater(500, function () {
        $("#modal_area_button_ok").focus();
    });

};
