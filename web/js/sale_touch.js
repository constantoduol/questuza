App.prototype.loadCategories = function(id,type,filter){
    //load categories from the server
    var request = {
        category_type : type,
        filter : filter, //product filter
        username : localStorage.getItem("current_user")
    };
    app.xhr(request,"pos_sale_service,pos_sale_service","product_categories,fetch_categories",{
        load : false,
        success : function(data){
            //if the user is uncategorized or all show all the categories
            var userCats = data.response.pos_sale_service_fetch_categories.data.CATEGORY;
            var allCats = data.response.pos_sale_service_product_categories.data;
            //display the categories
            var cats;
            if(type === "category"){
                if(userCats && userCats.length > 0 && userCats.indexOf("all") === -1){
                   cats = userCats; 
                }
                else {
                   cats = allCats["PRODUCT_CATEGORY"];
                }
            }
            else {
                cats = allCats["PRODUCT_SUB_CATEGORY"];
            }
            console.log(cats);
            app.loadCats(cats,8,id,type,filter);
        }
    });
};

App.prototype.loadCats = function (cats,max,displayArea,type,filter) {
    for (var x = 1; x < cats.length + 1; x++) {
        var name = cats[x - 1];
        var data = app.getRowAndCol(x - 1,max);
        var width = (app.getDim()[0]/10);
        var font_size = width/4;
        var heightCat = app.getDim()[1]*0.60;
        var heightSale = app.getDim()[1]*0.3;
        $("#product_category_card").css("height",heightCat+"px");
        $("#current_sale_card").css("height",heightSale+"px");
        var cont = {font_size : font_size,width: width,name : name,filter : filter, row : data[0], col : data[1] };
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
    var contDiv = $("<div class='category_touch'>"+cont.name+"</div>");
    contDiv.css("width",cont.width+"px");
    contDiv.css("height",cont.width+"px");
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
            var p = resp.response.data;
            //show the relevant buttons
            $("#commit_link").css("visibility", "visible");
            $("#total_qty").css("visibility", "visible");
            $("#total_amount").css("visibility", "visible");
            $("#clear_sale_link").css("visibility", "visible");
            $("#category_area").html("");
            $("#product_display_area").html("");
            var img = "<img src='img/cancel.png' style='height:30px;background:red'>";
            app.ui.table({
                id_to_append: "product_display_area",
                headers: ["Name", "Price","Quantity Available"],
                values: [p.PRODUCT_NAME,p.SP_UNIT_COST, p.PRODUCT_QTY],
                include_nums: true,
                style: "font-size:20px",
                class : "table-striped",
                mobile_collapse: true,
                onRowClick : function(values,event){
                   //put the product in the sale area
                   var tr = event.currentTarget;
                   var x = parseInt(tr.firstChild.innerHTML);
                   x--;
                   var saleArea = $("#sale_summary");
                   var IDS = $.extend(true, [], p.ID);
                   if(!saleArea[0]){
                        app.ui.table({
                            id: "sale_summary",
                            id_to_append: "current_sale_card",
                            headers: ["Name", "Quantity","Price", "Subtotal","Remove"],
                            values: [[values[0][x]],[1],[values[1][x]], [values[1][x]],[IDS[x]]],
                            include_nums: false,
                            style: "font-size:20px",
                            class: "table-striped",
                            mobile_collapse: true,
                            transform: {
                                0: function(value){
                                    return "<span id=prod_"+IDS[x]+">"+value+"</span>";
                                },
                                1 : function(value){;
                                    return "<span id=qty_"+IDS[x]+" class='qtys'>"+value+"</span>";
                                },
                                2 : function(value){
                                    return "<span id=price_"+IDS[x]+">"+app.formatMoney(value)+"</span>";
                                },
                                3: function (value) {
                                    return "<span id=sub_"+IDS[x]+" class='subs'>"+app.formatMoney(value)+"</span>";
                                },
                                4 : function(){
                                    var img = $("<img src='img/cancel.png' style='height:30px;background:red'>");
                                    img.click(function(){
                                        img.parent().parent().remove();
                                        app.calculateTotals();
                                    });
                                    return img;
                                }
                            }
                        }); 
                   }
                   else {
                      var id = p.ID[x];
                      var prod = $("#prod_"+id);
                      if(!prod[0]) {
                          var prodSpan = "<span id='prod_"+id+"'>"+values[0][x]+"</span>";
                          var qtySpan = "<span id=qty_"+id+" class='qtys'>1</span>";
                          var priceSpan = "<span id=price_"+id+">"+app.formatMoney(values[1][x])+"</span>";
                          var subSpan = "<span id=sub_"+id+" class='subs'>"+app.formatMoney(values[1][x])+"</span>";
                          var img = $("<img src='img/cancel.png' style='height:30px;background:red'>");
                          var tr = $("<tr>");
                          img.click(function(){
                              img.parent().parent().remove();
                              app.calculateTotals();
                          });
                          tr.append("<td>"+prodSpan+"</td><td>"+qtySpan+"</td><td>"+priceSpan+"</td><td>"+subSpan+"</td>");
                          var td = $("<td>");
                          td.append(img);
                          tr.append(td);
                          saleArea.append(tr);
                          
                      }
                      else {
                        var currQty = parseInt($("#qty_"+id).html());
                        currQty++;
                        $("#qty_"+id).html(currQty);
                        var subTotal = parseFloat(p.SP_UNIT_COST[x].replace(",",""))*currQty;
                        $("#sub_"+id).html(app.formatMoney(subTotal));
                        
                      }
                   }
                   app.calculateTotals();
                },
                transform : {
                    1 : function(value){
                        return app.formatMoney(value);
                    },
                    2 : function(value,index){
                        var id = p.ID[index];
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
    for (var x = 0; x < qtysElems.length; x++) {
        var qtyElem = $(qtysElems[x]);
        var qtyElemId = qtyElem.attr("id");
        var prodId = qtyElemId.substring(4,qtyElemId.length);
        var qty = qtyElem.html().trim() === "" ? 0 : parseInt(qtyElem.html());
        var availStock = parseInt($("#stock_" + prodId).html());
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
                business_type: app.appData.formData.login_touch.current_user.business_type
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
                            app.printReceipt();
                        }
                        $("#clear_sale_link").click();
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
    $body.html("<div id='receipt_iframe_area'></div>");
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
    
    var recHeaders = ["Product", "Price", "Qty", "S/Total"];
    var recValues = [names, amounts, qtys, subs];
    recValues[0].push("<b>Totals</b>");
    recValues[1].push("");
    recValues[2].push("<b>" + totalQty + "</b>");
    recValues[3].push("<b>" + app.formatMoney(totalCost) + "</b>");
    var bName = localStorage.getItem("business_name");
    var header = "<div><h3>" + bName + "</h3></div>";
    var receiptHeader = localStorage.getItem("receipt_header");
    header = header + receiptHeader;
    var receiptFooter = localStorage.getItem("receipt_footer");
    recArea.append(header);
    app.ui.table({
        id_to_append: "receipt_area_dummy",
        headers: recHeaders,
        values: recValues
    });
    var username = localStorage.getItem("current_user");
    var footer = "<div><span>Date : " + new Date().toLocaleString() + "</span><br/><span>Served by: " + username + "</span></div>";
    footer = footer + receiptFooter;
    recArea.append($("#receipt_area_dummy").html());//copy to iframe
    recArea.append(footer);
};

App.prototype.printReceipt = function () {
    var win = document.getElementById("receipt_area").contentWindow;
    win.focus();// focus on contentWindow is needed on some ie versions
    win.print();
};




App.prototype.todaySales = function () {
    var date = app.getDate();
    var request = {
        id: "all",
        user_name: app.appData.formData.login_touch.current_user.name,
        begin_date: date,
        end_date: date,
        report_type: "stock_history"
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
                onload_handler: app.pages.sale_touch,
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

App.prototype.generateReceiptHeaders = function(){
    var header = "<div><span>P.O Box 637-00618 RUARAKA</span><br><span>Tel : 0726720983</div>";
    var footer = "THIS IS NOT A FINAL RECEIPT";
    localStorage.setItem("receipt_header",header);
    localStorage.setItem("receipt_footer",footer);
};