App.prototype.loadCategories = function (id, type, filter) {
    //load categories from the server
    var request = {
        category_type: type,
        filter: filter //product filter
    };
    app.xhr(request,app.dominant_privilege,"product_categories",{
        load: false,
        success: function (data) {
            //if the user is uncategorized or all show all the categories
            var allCats = data.response.data;
            //display the categories
            var cats;
            if (type === "category") {
                cats = allCats["PRODUCT_CATEGORY"];
            }
            else {
                cats = allCats["PRODUCT_SUB_CATEGORY"];
            }
            app.loadCats(cats, 4, id, type, filter);
        }
    });
};

App.prototype.loadCats = function (cats,max,displayArea,type,filter) {
    for (var x = 1; x < cats.length + 1; x++) {
        var name = cats[x - 1];
        var data = app.getRowAndCol(x - 1,max);
        var width = app.getDim()[0]/(max + 0.5);
        var font_size = width/10;
        var heightCat = app.getDim()[1]*0.57;
        var heightSale = app.getDim()[1]*0.33;
        
        $("#product_category_card").css("height",heightCat+"px");
        $("#current_sale_card").css("height",heightSale+"px");
        
        var cont = {font_size : font_size,width : width,name : name,filter : filter, row : data[0], col : data[1] };
        var clickHandler = function(subCategory,category){
            //load the subcategories
            //if type is sub_category set a different click handler
            if(type === "sub_category"){
                app.loadProducts(category,subCategory); 
            }
            else{
                $("#"+displayArea).html("");
                app.loadCategories(displayArea,"sub_category",subCategory);
            }
        };
        app.addCategory(displayArea,max,cont,clickHandler);
    }
};

App.prototype.addCategory = function (displayArea,max,cont,clickHandler){
    var currentRow;
    var rowId = "row_"+cont.row;
    var area = $("#"+displayArea);
    if( (cont.col + max) % max === 0){
       currentRow = $("<tr id="+rowId+">");
       area.append(currentRow);
     }
     else{
        currentRow = $("#"+rowId); 
     }

    var currentItem = $("<td>");
    var contDiv = $("<div class='category_touch btn' style='width:"+cont.width+"px'>"+cont.name+"</div>");;
    contDiv.css("font-size",cont.font_size+"px");
    contDiv.click(function(){
        clickHandler(cont.name,cont.filter);
    });
    currentItem.append(contDiv);
    currentRow.append(currentItem); 
};

App.prototype.getRowAndCol = function(x,max){
    var col = Math.round(Math.abs((Math.floor( (x+1)/max)- (x+1)/max)/(1/max)));
    col = col === 0 ? max : col;
    var row = Math.ceil((x+1)/max);
    col--;
    row--;
    return [row,col];
};

App.prototype.loadProducts = function(category,sub_category){
    var request = {
        category : category,
        sub_category : sub_category
    };
    app.xhr(request,app.dominant_privilege,"load_products",{
        load : false,
        success : function(resp){
            var p = resp.response.data.categorized_products;
            var a = resp.response.data.all_products;
            $("#category_area").html("");
            $("#product_display_area").html("");
            app.ui.table({
                id_to_append: "product_display_area",
                headers: ["Name", "Price","Quantity Available"],
                values: [p.PRODUCT_NAME,p.SP_UNIT_COST, p.PRODUCT_QTY],
                include_nums: true,
                style: "font-size:20px",
                class : "table-striped",
                mobile_collapse: true,
                onRowClick : function(values,event){
                   //put the product in the sale area;
                   var tr = event.currentTarget;
                   var x = parseInt(tr.firstChild.innerHTML);
                   var IDS = $.extend(true, [], p.ID);
                   app.sale({
                        data: values,
                        index: --x,
                        ids: IDS,
                        prod_data : a
                    });
                },
                transform : {
                    1 : function(value){
                        return app.formatMoney(value);
                    },
                    2 : function(value,index){
                        var id = p.ID[index];
                        var parentId = !p.PRODUCT_PARENT[index]  ? "" : p.PRODUCT_PARENT[index];
                        if(parentId.length > 0){
                           value = a.PRODUCT_QTY[a.ID.indexOf(parentId)]; //search the quantity of the parent
                           //product from all stock
                        }
                        return "<span id='stock_"+id+"'>"+value+"</span>";
                    }
                }
            });
        }
    });
};


App.prototype.calculateTotals = function(){
  //calculate subtotals
  //calculate totals
  var subs = $(".subs");
  var qtys = $(".qtys");
  var totalQty = 0;
  var totalSub = 0;
  $.each(subs,function(x){
      var qty = parseInt($(qtys[x]).html());
      var sub = parseFloat($(subs[x]).html().replace(",",""));
      totalQty += qty;
      totalSub += sub;
  });
  $("#total_qty").html(totalQty);
  $("#total_amount").html(app.formatMoney(totalSub));
  app.generateReceipt();
};



App.prototype.commitSale = function () {
    //do more stuff
    var qtysElems = $(".qtys");
    var prodIds = [];
    var qtys = [];
    var prices = []; //this is here for the sake of discounts
    for (var x = 0; x < qtysElems.length; x++) {
        var qtyElem = $(qtysElems[x]);
        var qtyElemId = qtyElem.attr("id");
        var prodId = qtyElemId.substring(4,qtyElemId.length);
        var qty = qtyElem.html().trim() === "" ? 0 : parseInt(qtyElem.html());
        var availStock = parseFloat($("#stock_" + prodId).html());
        var price = app.getSetting("allow_discounts") === "1" 
            ?  $("#price_"+prodId).attr("real_price") 
            : $("#price_"+prodId).html();
        prices.push(parseFloat(price.replace(",","")));
        var trackStock = !app.getSetting("track_stock") ? "1" : app.getSetting("track_stock"); 
        if (qty <= 0) {
            app.showMessage(app.context.invalid_qty);
            qtyElem.css("background","red");
            qtyElem.focus();
            return;
        }
        else if (qty > availStock && trackStock === "1") {
            app.showMessage(app.context.insufficient_stock);
            qtyElem.css("background","red");
            qtyElem.focus();
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
                business_type: app.getSetting("business_type"),
                prices : prices //this is useful for a business having discounts
            };
            //do some stuff like saving to the server
            app.xhr(request, app.dominant_privilege, "transact", {
                load: true,
                success: function (data) {
                    var resp = data.response.data;
                    if (resp.status === "success") {
                        //transaction was successful
                        var rCount = app.getSetting("no_of_receipts");
                        var count = !rCount ? 1 : parseInt(rCount);
                        if (app.platform === "web") {
                            for(var x = 0; x < count; x++){
                                app.printReceipt(resp);
                            }
                        }
                        $("#clear_sale_link").click();
                        app.showMessage(app.context.transact_success);
                    }
                    else if (resp.status === "fail") {
                        app.showMessage(app.context.transact_fail);
                    }
                }
            });
            m.modal('hide');
        },
        cancel: function () {
            //do nothing
        },
        okText: "Commit Sale",
        cancelText: "Cancel"
    });
    app.runLater(300, function () {
        $("#modal_area_button_ok").focus();
    });

};


App.prototype.generateReceipt = function () {
    var $frame = $("#receipt_area");
    var doc = $frame[0].contentWindow.document;
    var $body = $('body', doc);
    $body.html("<div id='receipt_iframe_area' style='font-size:14px'></div>");
    $("#receipt_area_dummy").html("");
    var recArea = $("#receipt_iframe_area", doc);
    var elems = $(".qtys");
    var totalCost = 0;
    var totalQty = 0;
    var names = [];
    var amounts = [];
    var qtys = [];
    var subs = [];
    $.each(elems, function (elemIndex) {
        var elem = $(elems[elemIndex]);
        var elemId = elem.attr("id");
        var prodId =  elemId.substring(4,elemId.length);
        var name = $("#prod_" + prodId).html();
        var qty = elem.html().trim() === "" ? 0 : parseInt(elem.html());
        var sp = parseFloat($("#price_" + prodId).html().replace(",",""));
        amounts.push(app.formatMoney(sp));
        var cost = sp * qty;
        subs.push(app.formatMoney(cost));
        qtys.push(qty);
        names.push(name);
        totalCost = totalCost + cost;
        totalQty = totalQty + qty;
    });
    
    var recHeaders = ["Product", "Qty", "S/Total"];
    var recValues = [names,qtys, subs];
    recValues[0].push("<b>Totals</b>");
    recValues[1].push("<b>" + totalQty + "</b>");
    recValues[2].push("<b>" + app.formatMoney(totalCost) + "</b>");
    var bName = app.getSetting("business_name");
    var header = "<div><h4>" + bName + "</h4></div>";
    var receiptHeader = !app.getSetting("receipt_header") ? "" : app.getSetting("receipt_header");
    header = header + receiptHeader;
    var receiptFooter = !app.getSetting("receipt_footer") ? "" : app.getSetting("receipt_footer");
    recArea.append(header);
    app.ui.table({
        id_to_append: "receipt_area_dummy",
        headers: recHeaders,
        values: recValues,
        style : "font-size:12px"
    });
    var username = localStorage.getItem("current_user");
    var footer = "<div><span id='time_area'></span><br/><span>Served by: " + username + "</span></div>";
    footer = footer + receiptFooter;
    recArea.append($("#receipt_area_dummy").html());//copy to iframe
    recArea.append(footer);
};

App.prototype.printReceipt = function (resp) {
    var serverTime = resp.server_time.replace("EAT",",");
    var win = document.getElementById("receipt_area").contentWindow;
    win.document.getElementById("time_area").innerHTML = serverTime + "<br>Ref : "+resp.reason.substring(0,4);
    win.focus();// focus on contentWindow is needed on some ie versions
    win.print();
};




App.prototype.todaySales = function (username,category) {
    var request = {
        id: "all",
        user_name: username,
        begin_date: "server_time_begin",
        end_date: "server_time_end",
        report_type: "stock_history",
        product_categories : category
    };
    
    app.fetchItemById({
        database : "pos_data",
        table : "POS_META_DATA",
        column : "*",
        where : function(){
            return "SCOPE='cash_received'";
        },
        success : function(resp){
           var cashReceived = resp.response.data;
            //do nothing until cash received is ready 
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
                                var undo = "<a href='#' onclick='app.undoSale(\"" + resp.ID[index] + "\")' \n\
                        			title='Undo sale'>Undo Sale</a>";
                                var color, span,etype;
                                var amount = parseFloat(resp.STOCK_COST_SP[index]);
                                var qty = parseFloat(resp.STOCK_QTY[index]);
                                if (flag === "sale_to_customer") {
                                    color = "red";
                                    span = "Sale To Customer";
                                    etype = "Stock Decrease";
                                    app.getSetting("enable_undo_sales") === "1" ? undos.push(undo) : undos.push("");
                                    totalQty = totalQty + qty;
                                    totalAmount = totalAmount + amount;
                                }
                                else if (flag === "reversal_of_sale") {
                                    color = "blue";
                                    span = "Customer Returned Stock ";
                                    etype = "Stock Increase";
                                    undos.push("");
                                    totalQty = totalQty - qty;
                                    totalAmount = totalAmount - amount;
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
                                    resp.ID.splice(index, 1);
                                    index--; //we do this to filter out stock increases from sales
                                    continue;
                                }

                                resp.TRAN_TYPE[index] = "<span style='color : " + color + "'>" + etype + "<span>";
                                var time = new Date(resp.CREATED[index]).toLocaleTimeString();
                                resp.CREATED[index] = time;
                                resp.STOCK_COST_SP[index] = "<span style='color : " + color + "'>" + app.formatMoney(amount) + "<span>";
                                resp.STOCK_QTY[index] = "<span style='color : " + color + "'>" + qty + "<span>";
                            }
                            app.ui.table({
                                id_to_append: "paginate_body",
                                headers: ["Ref","Product Name", "Entry Type", "Sale Qty", "Amount Received", "Narration", "Entry Time", "Undo Sale", "Cash Received"],
                                values: [resp.ID,resp.PRODUCT_NAME, resp.TRAN_TYPE, resp.STOCK_QTY, resp.STOCK_COST_SP, resp.NARRATION, resp.CREATED, undos, resp.ID],
                                include_nums: true,
                                style: "",
                                mobile_collapse: true,
                                sortable : true,
                                summarize: {
                                    cols: [0,5],
                                    lengths: [4,80]
                                },
                                transform: {
                                    8: function (value, index) {
                                        if (app.dominant_privilege !== "pos_middle_service")
                                            return;
                                        var received = cashReceived.META_ID.indexOf(value) > -1 ? "Yes" : "No";
                                        var href = $("<a href='#'>" + received + "</a>");
                                        href.click(function () {
                                            var current = this.innerHTML;
                                            if (current === "Yes")
                                                return; //this was added because clients dont want somebody to reverse this
                                            var isReceived = current === "Yes" ? "No" : "Yes";
                                            this.innerHTML = isReceived;
                                            app.xhr({trans_id: value, cash_received: isReceived}, app.dominant_privilege, "note_cash_received", {
                                                load: false
                                            });
                                        });
                                        return href;
                                    }
                                },  
                                onRender: function (tableId) {
                                    $("#" + tableId).append(app.footerRow([
                                        "","","", "Totals", totalQty,app.formatMoney(totalAmount),
                                        "", "", "", ""
                                    ], "font-weight:bold"));
                                }
                            });
                            $("#paginate_body").append(app.colorKey());
                        }
                    });
                }
            });
        }
    }); 
};


App.prototype.loadSaleSearch = function(){
    var heightSale = app.getDim()[1] * 0.83;
    $("#product_category_card").css("overflow", "inherit");
    $("#current_sale_card").css("height", heightSale + "px");
    var html = "<div class='input-group' style='margin-top:5px'>" +
            "<div id='error_space_sale' class='error' ></div>" +
            "<input type='text' class='form-control' id='item_code' placeholder='Code'>"+
            "<input type='text' class='form-control' id='search_products' placeholder='Search Products' style='height:70px;width:90%;font-size:30px'>" +
            "<div class='input-group-addon search' id='search_link'>" +
            "<img src='img/search.png' alt='Search Products' style='width:40px'></div> </div>";
    $("#product_category_card").html(html);
    $("#search_link").click(function(){
        app.allProducts(app.pages.sale);
    });
    $("#search_products").bind('keyup', 'return', function () {
        if($("#search_products").val().trim().length === 0 ){
            app.commitSale();
            $("#search_products").focus();
        }
    });
    $("#item_code").bind('keyup', 'return', function () {
        if ($("#item_code").val().trim().length === 0) {
            app.commitSale();
            $("#item_code").focus();
        }
        else {
            app.saleByCode();
        }
    });
    
    $(document).bind('keyup', 'shift+k', function () {
         $("#item_code").focus();
    });
    
    $(document).bind('keyup', 'shift+p', function () {
         $("#search_products").focus();
    });
    
    $(document).bind('keyup', 'shift+c', function () {
         app.clearSale();
    });
    $("#item_code").bind('keyup', 'shift+c', function () {
         app.clearSale();
    });
    $("#search_products").bind('keyup', 'shift+c', function () {
         app.clearSale();
    });
    app.setUpAuto(app.context.product.fields.search_products);  
};

App.prototype.sale = function(options){
    $("#commit_link").css("visibility", "visible");
    $("#total_qty").css("visibility", "visible");
    $("#total_amount").css("visibility", "visible");
    $("#clear_sale_link").css("visibility", "visible");
    var values;
    var productCache;
    var userInterface = app.getSetting("user_interface");
    if(userInterface === "touch"){
        productCache = options.prod_data;
        values =   [options.data[0], 
                    [1], 
                    options.data[1], 
                    options.data[1], 
                    options.ids];
    }
    else if(userInterface === "desktop"){
        productCache = options.data;
        values = [ options.data.PRODUCT_NAME,
                   [1],
                   options.data.SP_UNIT_COST, 
                   options.data.SP_UNIT_COST,
                   options.ids];
    }
    console.log(productCache)
    var saleArea = $("#sale_summary");
    var currentId = options.ids[options.index];
    
    function appendItem(){
        saleArea = $("#sale_summary");
        var price = values[2][options.index];
        var prodSpan = "<span id='prod_" + currentId + "'>" + values[0][options.index] + "</span>";//product name
        var qtySpan = "<span id=qty_" + currentId + " class='qtys'>1</span>";//quantity
        var priceSpan = "<span id=price_" + currentId + " real_price="+price+">" + app.formatMoney(price) + "</span>";//price
        var subSpan = "<span id=sub_" + currentId + " class='subs'>" + app.formatMoney(price) + "</span>";//subtotal
        var img = $("<img src='img/cancel.png' style='height:30px;background:red'>"); //remove icon
        var edit = $("<img src='img/edit.png' style='height:30px;background:lightblue' prod_id="+currentId+">"); //edit icon
        var tr = $("<tr>");
        img.click(function () {
            img.parent().parent().remove();
            app.calculateTotals();
        });
        edit.click(function(){
            var prodId = $(this).attr("prod_id");
            var currQty = parseInt($("#qty_"+prodId).html());
            var currPrice = parseFloat($("#price_"+prodId).html().replace(",",""))*currQty;
            //invoke the price editing function for discounts
            //display the maximum discount
            var maxDiscount = productCache.MAX_DISCOUNT[productCache.ID.indexOf(prodId)]*currQty || 0;
            var html ="<input type='number' style='font-size:20px;height:50px' id='discounted_price' value='"+currPrice+"' class='form-control' \n\
                placeholder='Discounted price'><br><span style='font-size:16px'>Maximum Discount : "+app.formatMoney(maxDiscount)+"</span>\n\
                <br><br><span id='discount_info' style='font-size:16px;color:red'></span>";
            var m = app.ui.modal(html,"Discount",{
                okText : "Accept",
                cancelText : "Cancel",
                ok : function(){
                    //change the prices appropriately, the price and subtotal and force a price
                    //recalculate
                    var newPrice = parseFloat($("#discounted_price").val());
                    var currSubTotal = parseFloat($("#sub_"+prodId).html().replace(",",""));
                    var newSubtotal = currSubTotal - currPrice + newPrice;
                    var discPrice = newPrice/currQty;
                    $("#price_"+prodId).html(app.formatMoney(discPrice));
                    $("#price_"+prodId).attr("real_price",discPrice);
                    $("#sub_"+prodId).html(app.formatMoney(newSubtotal));
                    app.calculateTotals();
                    m.modal('hide');
                }
            });
            $("#discounted_price").keyup(function(){
                //incase the person changes the price tell them about the maximum discount
                var newPrice = parseFloat($("#discounted_price").val().replace(",","")) || 0;
                if(newPrice < (currPrice - maxDiscount)){
                    //you have gone below the allowed discount
                    $("#discount_info").html("You have exceeded the allowed discount!");
                    $("#modal_area_button_ok").css("visibility","hidden");
                }
                else if(newPrice > currPrice){
                    $("#discount_info").html("The price set is higher than the allowed price!");
                    $("#modal_area_button_ok").css("visibility","hidden");
                }
                else {
                    $("#discount_info").html("Discount offered : "+app.formatMoney((currPrice - newPrice)));
                    $("#modal_area_button_ok").css("visibility","visible");
                }
            });
        });

        tr.append("<td>" + prodSpan + "</td><td>" + qtySpan + "</td><td>" + priceSpan + "</td><td>" + subSpan + "</td>");
        var td = $("<td>");
        td.append(img);
        
        var td1 = $("<td>");
        td1.append(edit);
        tr.append(td);
        app.getSetting("allow_discounts") === "1" ? tr.append(td1) : null;//append the edit function only if discounts are allowed
        saleArea.append(tr);
    }
    
    if (!saleArea[0]) {
        app.ui.table({
            id: "sale_summary",
            id_to_append: "current_sale_card",
            headers: ["Name", "Quantity", "Price", "Subtotal", "Remove","Edit"],
            values: [[],[],[],[],[],[]],
            include_nums: false,
            style: "font-size:20px",
            class: "table-striped",
            mobile_collapse: true
        });
        appendItem();
    }
    else {
        var prod = $("#prod_" + currentId);
        if (!prod[0]) {
            appendItem();
        }
        else {
            //increase the quantity
            var currQty = parseInt($("#qty_" + currentId).html());
            currQty++;
            $("#qty_" + currentId).html(currQty);
            var spUnit = values[2][options.index];
            var subTotal = parseFloat(spUnit.replace(",", "")) * currQty;
            $("#sub_" + currentId).html(app.formatMoney(subTotal));
        }
    }
    app.calculateTotals();
};


App.prototype.saleByCode = function(){
    var code = $("#item_code").val().trim();
    app.fetchItemById({
        database: "pos_data",
        table: "PRODUCT_DATA",
        column: "*",
        where: function () {
            return "PRODUCT_CODE='"+code+"'";
        },
        success: function (resp) {
            var data = resp.response.data;
            if(data.ID.length === 0){
                app.briefShow({
                    title : "Invalid Code",
                    content : "The specified code does not match any product",
                    delay : 1000
                });
                return;
            }
            app.sale({
                data: data,
                index: 0,
                ids: data.ID
            });
            $("#item_code").val("");
            $("#item_code").focus();
        }
    });
};


App.prototype.clearSale = function(){
    $("#category_area").html("");
    $("#product_display_area").html("");
    $("#current_sale_card").html("");
    $("#commit_link").css("visibility", "hidden");
    $("#total_qty").css("visibility", "hidden");
    $("#total_amount").css("visibility", "hidden");
    $("#clear_sale_link").css("visibility", "hidden");
    $("#total_qty").html("0");
    $("#total_amount").html("0.00");
    app.getSetting("user_interface") === "desktop" ? app.loadSaleSearch() : app.loadCategories("category_area", "category");  
};


App.prototype.quantityPicker = function (options) {
    var html = "<div class = 'input-group' >" +
            "<input type = 'number' class = 'form-control' id = 'select_quantity' placeholder = 'Quantity' style='height : 60px;font-size:20px' value=1 >" +
            "<div class = 'input-group-addon' style='padding:0px'>" +
            "<div class='toggle-button' style='background-color:green' id='increase_qty'> + </div>" +
            "<div class='toggle-button' style='background-color:red' id='decrease_qty'> - </div>" +
            "</div>" +
            "</div>";
    var m = app.ui.modal(html, "Quantity", {
        okText: "Done",
        ok: function () {
            var qty = parseInt($("#select_quantity").val());
            qty = qty <= 0 || !qty ? 1 : qty;
            for (var x = 0; x < qty; x++) {
                app.sale({
                    data: options.data,
                    index: options.index,
                    ids: options.data.ID
                });
            }
            app.runLater(100, function () {
                $("#search_products").val("");
                $("#search_products").focus();
            });
            m.modal('hide');
        }
    });

    app.runLater(200, function () {
        $("#modal_area_button_ok").focus();
    });

    $("#increase_qty").click(function () {
        var qty = parseInt($("#select_quantity").val());
        qty++;
        $("#select_quantity").val(qty);
    });
    $("#decrease_qty").click(function () {
        var qty = parseInt($("#select_quantity").val());
        qty = qty <= 0 ? 1 : qty - 1;
        $("#select_quantity").val(qty);
    });
};