/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.quest.pos;

import com.quest.access.common.UniqueRandom;
import com.quest.access.common.io;
import com.quest.access.common.mysql.Database;
import com.quest.access.common.mysql.NonExistentDatabaseException;
import com.quest.access.control.Server;
import com.quest.access.useraccess.Serviceable;
import com.quest.access.useraccess.services.Message;
import com.quest.access.useraccess.services.annotations.Endpoint;
import com.quest.access.useraccess.services.annotations.Model;
import com.quest.access.useraccess.services.annotations.Models;
import com.quest.access.useraccess.services.annotations.WebService;
import com.quest.access.useraccess.verification.UserAction;
import com.quest.servlets.ClientWorker;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Date;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * @author Connie
 */
@WebService(name = "pos_admin_service", level = 10, privileged = "yes")
@Models(models = {
    @Model(
            database = "pos_data", table = "PRODUCT_DATA",
            columns = {"ID VARCHAR(10) PRIMARY KEY",
                "BUSINESS_ID VARCHAR(20)",
                "PRODUCT_NAME TEXT",
                "PRODUCT_QTY FLOAT",
                "PRODUCT_CATEGORY TEXT",
                "PRODUCT_SUB_CATEGORY TEXT",
                "PRODUCT_PARENT VARCHAR(10)",
                "PRODUCT_UNIT_SIZE FLOAT",
                "BP_UNIT_COST FLOAT",
                "SP_UNIT_COST FLOAT",
                "PRODUCT_REMIND_LIMIT INT",
                "PRODUCT_EXPIRY_DATE DATE",
                "PRODUCT_NARRATION TEXT",
                "TAX FLOAT",
                "COMMISSION FLOAT",
                "ACTION_ID TEXT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "STOCK_DATA",
            columns = {
                "BUSINESS_ID VARCHAR(20)",
                "PRODUCT_ID VARCHAR(10)",
                "TRAN_TYPE BOOL",
                "STOCK_COST_BP FLOAT",
                "STOCK_COST_SP FLOAT",
                "STOCK_QTY FLOAT",
                "PROFIT FLOAT",
                "TRAN_FLAG TEXT",
                "NARRATION TEXT",
                "CREATED DATETIME",
                "USER_NAME TEXT"
            }),
    @Model(
            database = "pos_data", table = "EXPENSE_DATA",
            columns = {"ID VARCHAR(60) PRIMARY KEY",
                "BUSINESS_ID VARCHAR(20)",
                "RESOURCE_NAME TEXT",
                "RESOURCE_TYPE VARCHAR(10)",
                "RESOURCE_AMOUNT FLOAT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "TAX_DATA",
            columns = {"USER_NAME TEXT",
                "BUSINESS_ID VARCHAR(20)",
                "PRODUCT_ID TEXT",
                "TAX_VALUE FLOAT",
                "UNITS_SOLD INT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "COMMISSION_DATA",
            columns = {"USER_NAME TEXT",
                "BUSINESS_ID VARCHAR(20)",
                "PRODUCT_ID TEXT",
                "COMM_VALUE FLOAT",
                "UNITS_SOLD INT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "SUPPLIER_DATA",
            columns = {"ID VARCHAR(10) PRIMARY KEY",
                "BUSINESS_ID VARCHAR(20)",
                "SUPPLIER_NAME TEXT",
                "COUNTRY TEXT",
                "CITY TEXT",
                "POSTAL_ADDRESS TEXT",
                "PHONE_NUMBER TEXT",
                "EMAIL_ADDRESS TEXT",
                "WEBSITE TEXT",
                "CONTACT_PERSON_NAME TEXT",
                "CONTACT_PERSON_PHONE TEXT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "PRODUCT_SUPPLIER_DATA",
            columns = {"PRODUCT_ID VARCHAR(10)",
                "BUSINESS_ID VARCHAR(20)",
                "SUPPLIER_ID VARCHAR(10)",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "SUPPLIER_ACCOUNT",
            columns = {
                "SUPPLIER_ID VARCHAR(10)",
                "BUSINESS_ID VARCHAR(20)",
                "PRODUCT_ID VARCHAR(10)",
                "TRANS_AMOUNT FLOAT",
                "TRAN_TYPE BOOL",
                "UNITS INT",
                "NARRATION TEXT",
                "USER_NAME TEXT",
                "CREATED DATETIME"
            }),
      @Model(
            database = "pos_data", table = "USER_CATEGORIES",
            columns = {
                "USER_NAME TEXT",
                "CATEGORY TEXT",
                "CREATED DATETIME"
            })

}
)
public class PosAdminService implements Serviceable {

    private static String POS_DATA = "pos_data";

    private static boolean isAccessible = true;

    @Override
    public void service() {

    }

    @Override
    public void onPreExecute(Server serv, ClientWorker worker) {
        if (!isAccessible) {
            worker.setResponseData(Message.FAIL);
            worker.setReason("Application has expired, activate to continue using it");
            serv.messageToClient(worker);
        }
    }

    public static boolean isAccessible() {
        return isAccessible;
    }

    private void validateActivation(Server serv) {
        try {
            Database db = new Database("user_server", null);
            JSONObject data = db.query("SELECT * FROM ACTIVATION_DATA");
            String key = data.optJSONArray("ACTIVATION_KEY").optString(0);
            String name = data.optJSONArray("BUSINESS_NAME").optString(0);
            Activation ac = new Activation();
            JSONObject request = new JSONObject();
            request.put("business_name", name);
            request.put("activation_key", key);
            ClientWorker worker = new ClientWorker("activate_product", "pos_admin_service", request, null, null, null);
            worker.setPropagateResponse(false);
            ac.validateKey(serv, worker);
            Object response = worker.getResponseData();
            io.log(response, Level.SEVERE, this.getClass());
            if (response.equals("fail")) {
                isAccessible = false;
            } else {
                JSONObject resp = (JSONObject) response;
                String expiry = resp.optString("expiry");
                Long exp = Long.parseLong(expiry);
                if (exp < System.currentTimeMillis()) {
                    isAccessible = false;
                }
            }
        } catch (JSONException ex) {
            Logger.getLogger(PosAdminService.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void onStart(Server serv) {
        serv.addSafeTable("user_server", "BUSINESS_USERS", "USER_NAME,ID");
        serv.addSafeTable("pos_data", "PRODUCT_DATA", "*");
        serv.addSafeTable("pos_data", "SUPPLIER_DATA", "*");
        serv.addSafeTable("pos_data", "EXPENSE_DATA", "RESOURCE_NAME");
        //check that app is activated
        validateActivation(serv);
        
        //initialise settings
        String defaultInterface = serv.getConfig().getInitParameter("default-user-interface");
        io.out("this is the default interface: "+defaultInterface);
        Database db = new Database("user_server", null);
        boolean exists = db.ifValueExists("user_interface", "CONF_DATA", "CONF_KEY");
        if(exists) {
            db.query("UPDATE CONF_DATA SET CONF_VALUE='"+defaultInterface+"' WHERE CONF_KEY='user_interface'");
        }
        else {
            db.doInsert("CONF_DATA", new String[]{"user_interface",defaultInterface});
        }
    }

    @Endpoint(name = "add_resource")
    public void addResource(Server serv, ClientWorker worker) throws Exception {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String type = requestData.optString("resource_type");
        String name = requestData.optString("resource_name");
        String busId = requestData.optString("business_id");
        String amount = requestData.optString("resource_amount");
        UserAction action = new UserAction(worker, "ADD RESOURCE " + name + " TYPE " + type);
        db.doInsert("EXPENSE_DATA", new String[]{action.getActionID(), busId, name, type, amount, "!NOW()"});
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "update_product")
    public void updateProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String prodId = requestData.optString("id");
        String productName = requestData.optString("product_name");
        String oldProductName = requestData.optString("old_product_name");
        String productQty = requestData.optString("product_quantity");
        String productCat = requestData.optString("product_category");
        String productSubCat = requestData.optString("product_sub_category");
        String productBp = requestData.optString("product_bp_unit_cost");
        String productSp = requestData.optString("product_sp_unit_cost");
        String productRlimit = requestData.optString("product_reminder_limit");
        String productEdate = requestData.optString("product_expiry_date");
        String productNarr = requestData.optString("product_narration");
        String tax = requestData.optString("tax", "0");
        String comm = requestData.optString("commission", "0");
        String busId = requestData.optString("business_id");
        String bType = requestData.optString("business_type");
        String pProduct = requestData.optString("product_parent");
        String unitSize = requestData.optString("product_unit_size");
        productQty = pProduct.trim().length() > 0 ? "0" : productQty;
        String userName = worker.getSession().getAttribute("username").toString();
        //check that we are not duplicating products
        boolean exists = db.ifValueExists(new String[]{busId, productName}, "PRODUCT_DATA", new String[]{"BUSINESS_ID", "PRODUCT_NAME"});
        if (exists && !oldProductName.equals(productName)) {
            worker.setResponseData("FAIL");
            worker.setReason("Product " + productName + " already exists");
            serv.messageToClient(worker);
        } else {
            try {
                UserAction action = new UserAction(worker, "UPDATE PRODUCT " + productName);
                JSONObject productData = db.query("SELECT BP_UNIT_COST,PRODUCT_QTY FROM PRODUCT_DATA WHERE ID=?", prodId);
                Integer storedProductQty = Integer.parseInt(productData.optJSONArray("PRODUCT_QTY").optString(0));
                Integer newProductQty = Integer.parseInt(productQty);
                Database.executeQuery("UPDATE PRODUCT_DATA SET PRODUCT_NAME=?, "
                        + "PRODUCT_QTY=?, PRODUCT_CATEGORY = ?,PRODUCT_SUB_CATEGORY = ?,PRODUCT_PARENT = ?, PRODUCT_UNIT_SIZE = ?, BP_UNIT_COST=?, "
                        + "SP_UNIT_COST=?, PRODUCT_REMIND_LIMIT=?, "
                        + "PRODUCT_EXPIRY_DATE=?,PRODUCT_NARRATION=?,TAX = ?, COMMISSION = ? WHERE ID= ? AND BUSINESS_ID = ? ", db,
                        productName, productQty, productCat,productSubCat, pProduct,unitSize,
                        productBp, productSp, productRlimit, productEdate, productNarr, tax, comm, prodId, busId);
                if (storedProductQty > newProductQty) {
                    //reduction in stock
                    Integer theQty = storedProductQty - newProductQty;
                    addStock(prodId, busId, theQty.toString(), productBp, productSp, 0, productNarr, "stock_out", bType, db, userName);
                } else if (newProductQty > storedProductQty) {
                    //increase in stock
                    Integer theQty = newProductQty - storedProductQty;
                    addStock(prodId, busId, theQty.toString(), productBp, productSp, 1, productNarr, "stock_in", bType, db, userName);
                }
                action.saveAction();
                worker.setResponseData("SUCCESS");
                serv.messageToClient(worker);
            } catch (Exception ex) {
                Logger.getLogger(PosAdminService.class.getName()).log(Level.SEVERE, null, ex);
                worker.setResponseData("FAIL");
                serv.messageToClient(worker);
            }
        }

    }

    private void addStock(String prodId, String busId, String stockQty, String bPrice, String sPrice, Integer type, String narr, String tranFlag, String bType, Database db, String userName) {
        Integer qty = Integer.parseInt(stockQty);
        Float price = Float.parseFloat(bPrice);
        Float price1 = Float.parseFloat(sPrice);
        Float costBp = qty * price;
        Float costSp = qty * price1;
        //specify profit also
        if (narr.equals("")) {
            if (type == 1) {
                narr = "New Stock"; //increase
            } else if (type == 0) {
                narr = "Old Stock Disposed"; //reduction 
            }
        }
        if (bType.equals("goods")) {
            db.doInsert("STOCK_DATA", new String[]{busId, prodId, type.toString(), costBp.toString(), costSp.toString(), stockQty, "0", tranFlag, narr, "!NOW()", userName});
        }

    }

    @Endpoint(name = "supplier_and_product")
    public void supplierAndProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject request = worker.getRequestData();
        String actionType = request.optString("action_type");
        String busId = request.optString("business_id");
        String supId = request.optString("supplier_id");
        String prodId = request.optString("product_id");
        Object resp = null;
        if (actionType.equals("delete")) {
            db.query("DELETE FROM PRODUCT_SUPPLIER_DATA WHERE BUSINESS_ID = ? AND SUPPLIER_ID = ? ", busId, supId);
            resp = Message.SUCCESS;
        } else if (actionType.equals("create")) {
            boolean exists = db.ifValueExists(new String[]{prodId, busId, supId}, "PRODUCT_SUPPLIER_DATA",
                    new String[]{"PRODUCT_ID", "BUSINESS_ID", "SUPPLIER_ID"});
            if (exists) {
                worker.setResponseData(Message.FAIL);
                worker.setReason("This supplier already exists");
                serv.messageToClient(worker);
                return;
            }

            db.doInsert("PRODUCT_SUPPLIER_DATA", new String[]{prodId, busId, supId, "!NOW()"});
            resp = Message.SUCCESS;
        } else if (actionType.equals("fetch_all")) {
            //this is a relationship thing
            //i hate relationships
            //get the name of the supplier and account
            resp = db.query("SELECT SUPPLIER_ID,SUPPLIER_NAME FROM SUPPLIER_DATA,PRODUCT_SUPPLIER_DATA WHERE "
                    + "PRODUCT_SUPPLIER_DATA.SUPPLIER_ID = SUPPLIER_DATA.ID AND "
                    + "PRODUCT_ID = ? AND PRODUCT_SUPPLIER_DATA.BUSINESS_ID = ? ORDER BY SUPPLIER_NAME ASC", prodId, busId);
        }

        worker.setResponseData(resp);
        serv.messageToClient(worker);

    }

    @Endpoint(name = "supplier_account_transact")
    public void supplierAccount(Server serv, ClientWorker worker) throws Exception {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject request = worker.getRequestData();
        String supId = request.optString("supplier_id");
        String prodId = request.optString("product_id");
        String busId = request.optString("business_id");
        String transAmount = request.optString("amount");
        String units = request.optString("units_received");
        String sp = request.optString("sp_per_unit");
        String entryType = request.optString("entry_type");
        String narr = request.optString("narration");
        String bType = request.optString("business_type");
        String userName = worker.getSession().getAttribute("username").toString();
        JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? AND BUSINESS_ID = ?", prodId, busId);
        int productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optInt(0);
        int newQty = productTotalqty;
        int theUnits = Integer.parseInt(units);
        Float cost = bType.equals("goods") ? Float.parseFloat(sp) * theUnits : Float.parseFloat(transAmount);
        if (entryType.equals("1")) {
            //this is stock in
            newQty = productTotalqty + theUnits; //increase the quantity, we are receiving stock
        } else if (entryType.equals("0")) {
            //this is stock out
            if (theUnits > productTotalqty) {
                //we cannot return more than we have
                worker.setResponseData(Message.FAIL);
                worker.setReason("You cannot return more stock than you have to supplier");
                serv.messageToClient(worker);
                return;
            } else {
                newQty = productTotalqty - Integer.parseInt(units);
            }
        }
        String tranFlag = entryType.equals("1") ? "stock_in" : "stock_out";
        //stuff from suppliers, credit your account, debit suppliers account
        db.doInsert("SUPPLIER_ACCOUNT", new String[]{supId, busId, prodId, transAmount, entryType, units, narr, userName, "!NOW()"});
        db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "' WHERE ID='" + prodId + "' AND BUSINESS_ID='" + busId + "'");
        //note this as a stock movement
        db.doInsert("STOCK_DATA", new String[]{busId, prodId, entryType, transAmount, cost.toString(), units, "0", tranFlag, narr, "!NOW()", userName});
        //stock in is an expense on our side so put a 0
        //stock out is a revenue or refund

        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "supplier_action")
    public void supplierAction(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject request = worker.getRequestData();
        String name = request.optString("supplier_name");
        String country = request.optString("country");
        String city = request.optString("city");
        String pAddress = request.optString("postal_address");
        String pNumber = request.optString("phone_number");
        String email = request.optString("email_address");
        String web = request.optString("company_website");
        String cName = request.optString("contact_person_name");
        String cPhone = request.optString("contact_person_phone");
        String oldSupplierName = request.optString("old_supplier_name");

        String actionType = request.optString("action_type");
        String currentBusId = request.optString("business_id");
        String supId = request.optString("supplier_id");

        boolean exists = db.ifValueExists(new String[]{name, currentBusId}, "SUPPLIER_DATA", new String[]{"SUPPLIER_NAME", "BUSINESS_ID"});
        if (exists && actionType.equals("create")) {
            worker.setResponseData(Message.FAIL);
            worker.setReason("Supplier " + name + " already exists");
            serv.messageToClient(worker);
            return;
        } else if (exists && !oldSupplierName.equals(name) && actionType.equals("update")) {
            worker.setResponseData(Message.FAIL);
            worker.setReason("Supplier " + name + " already exists");
            serv.messageToClient(worker);
            return;
        } else {
            if (actionType.equals("create")) {
                UniqueRandom rand = new UniqueRandom(10);
                supId = rand.nextMixedRandom();
                db.doInsert("SUPPLIER_DATA", new String[]{supId, currentBusId, name, country, city,
                    pAddress, pNumber, email, web, cName, cPhone, "!NOW()"});

            } else if (actionType.equals("update")) {
                Database.executeQuery("UPDATE SUPPLIER_DATA SET SUPPLIER_NAME=?, "
                        + "COUNTRY=?, CITY=?, POSTAL_ADDRESS=?, "
                        + "PHONE_NUMBER=?,EMAIL_ADDRESS=?, WEBSITE=?, "
                        + "CONTACT_PERSON_NAME=?,CONTACT_PERSON_PHONE = ? WHERE ID = ?  AND BUSINESS_ID = ?", db,
                        name, country, city,
                        pAddress, pNumber, email, web, cName, cPhone, supId, currentBusId);
            } else if (actionType.equals("delete")) {
                db.query("DELETE FROM SUPPLIER_DATA WHERE ID = ?", supId);
            }
        }
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "create_product")
    public synchronized void createProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String productName = requestData.optString("product_name");
        String productQty = requestData.optString("product_quantity");
        String productCat = requestData.optString("product_category");
        String productSubCat = requestData.optString("product_sub_category");
        String productBp = requestData.optString("product_bp_unit_cost");
        String productSp = requestData.optString("product_sp_unit_cost");
        String productRlimit = requestData.optString("product_reminder_limit");
        String productEdate = requestData.optString("product_expiry_date");
        String productNarr = requestData.optString("product_narration");
        String tax = requestData.optString("tax", "0");
        String comm = requestData.optString("commission", "0");
        String busId = requestData.optString("business_id");
        String bType = requestData.optString("business_type");
        String pProduct = requestData.optString("product_parent");
        String unitSize = requestData.optString("product_unit_size");
        productQty = pProduct.trim().length() > 0 ? "0" : productQty;
        String userName = worker.getSession().getAttribute("username").toString();
        //check whether the product exists
        boolean exists = db.ifValueExists(new String[]{busId, productName}, "PRODUCT_DATA", new String[]{"BUSINESS_ID", "PRODUCT_NAME"});
        if (exists) {
            worker.setResponseData("FAIL");
            worker.setReason("Product " + productName + " already exists");
            serv.messageToClient(worker);
        } else {
            try {
                //well create the product
                String prodId = new UniqueRandom(10).nextMixedRandom();
                UserAction action = new UserAction(worker, "CREATED PRODUCT " + productName);
                db.doInsert("PRODUCT_DATA", new String[]{prodId, busId, productName, productQty, productCat,productSubCat,
                    pProduct,unitSize,productBp, productSp, productRlimit,
                    productEdate, productNarr, tax, comm, action.getActionID(), "!NOW()"});
                
                
                addStock(prodId, busId, productQty, productBp, productSp, 1, productNarr, "stock_in", bType, db, userName);
                
                action.saveAction();
                worker.setResponseData("SUCCESS");
                serv.messageToClient(worker);
            } catch (Exception ex) {
                Logger.getLogger(PosAdminService.class.getName()).log(Level.SEVERE, null, ex);
                worker.setResponseData("FAIL");
                serv.messageToClient(worker);
            }
        }

    }

    @Endpoint(name = "delete_product")
    public void deleteProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String id = requestData.optString("id");
        String busId = requestData.optString("business_id");
        db.query()
                .delete()
                .from("PRODUCT_DATA")
                .where("ID='" + id + "' AND BUSINESS_ID = '" + busId + "'")
                .execute();
        worker.setResponseData("SUCCESS");
        serv.messageToClient(worker);
    }

    @Endpoint(name = "all_products", shareMethodWith = {"pos_sale_service"})
    public void allProducts(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String cat = requestData.optString("category");
        String busId = requestData.optString("business_id");
        JSONObject data;
        if(cat != null && !cat.isEmpty() && !cat.equals("all")){
            data = db.query("SELECT * FROM PRODUCT_DATA WHERE PRODUCT_CATEGORY=? ORDER BY PRODUCT_NAME ASC",cat);
        }
        else {
            data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .where("BUSINESS_ID='" + busId + "'")
                .order("PRODUCT_NAME ASC")
                .execute();
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "all_suppliers")
    public void allSuppliers(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        JSONObject data = db.query()
                .select("*")
                .from("SUPPLIER_DATA")
                .where("BUSINESS_ID='" + busId + "'")
                .order("SUPPLIER_NAME ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "all_users", shareMethodWith = {"pos_sale_service"})
    public void allUsers(Server serv, ClientWorker worker) throws NonExistentDatabaseException {
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        Database users = new Database("user_server", worker.getSession());
        JSONObject data = users.query("SELECT USER_NAME FROM BUSINESS_USERS WHERE BUSINESS_ID='" + busId + "'");
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "auto_complete", shareMethodWith = {"pos_sale_service"})
    public void autoComplete(Server serv, ClientWorker worker) {
        try {
            JSONObject requestData = worker.getRequestData();
            String database = requestData.optString("database");
            String table = requestData.optString("table");
            String column = requestData.optString("column");
            int limit = requestData.optInt("limit");
            String orderBy = requestData.optString("orderby");
            String busId = requestData.optString("business_id");
            String where = requestData.optString("where");
            boolean isSafe = serv.isTableSafe(database, table, column);
            if (!isSafe) {
                worker.setReason("Access denied: specified query not allowed");
                worker.setResponseData("FAIL");
                serv.messageToClient(worker);
                return;
            }
            StringBuilder builder = new StringBuilder();
            builder.append("SELECT ")
                    .append(column) //columns
                    .append(" FROM ")
                    .append(table) //tables
                    .append(" WHERE ")
                    .append(where) // where product_name like 'm%'                 
                    .append(" ORDER BY ")
                    .append(orderBy)
                    .append(" LIMIT ")
                    .append(limit);
            //System.out.println(builder.toString());
            Database theDb = new Database(database, worker.getSession());
            JSONObject data = theDb.query(builder.toString());
            worker.setResponseData(data);
            serv.messageToClient(worker);
        } catch (Exception ex) {
            Logger.getLogger(PosAdminService.class.getName()).log(Level.SEVERE, null, ex);
            worker.setResponseData("FAIL");
            serv.messageToClient(worker);
        }

    }

    @Endpoint(name = "stock_history", shareMethodWith = {"pos_sale_service"})
    public void openStockHistory(Server serv, ClientWorker worker) {
        JSONObject requestData = worker.getRequestData();
        String action = requestData.optString("report_type");
        if (action.equals("stock_history")) {
            stockHistory(serv, worker);
        } else if (action.equals("commission_history")) {
            commissionHistory(serv, worker);
        } else if (action.equals("tax_history")) {
            taxHistory(serv, worker);
        } else if (action.equals("supplier_history")) {
            supplierHistory(serv, worker);
        }
    }

    private void supplierHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date") + " :00";
        String endDate = requestData.optString("end_date") + " :59";
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String busId = requestData.optString("business_id");
        String supId = requestData.optString("supplier_id");

        String extraSql = userName.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.USER_NAME = '" + userName + "'";
        String extraSql1 = supId.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.SUPPLIER_ID = '" + supId + "'";
        String extraSql2 = prodId.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.PRODUCT_ID = '" + prodId + "'";

        String sql = "SELECT SUPPLIER_NAME, PRODUCT_NAME,TRANS_AMOUNT,TRAN_TYPE,UNITS,NARRATION,SUPPLIER_ACCOUNT.USER_NAME,"
                + " SUPPLIER_ACCOUNT.CREATED FROM SUPPLIER_DATA, PRODUCT_DATA, SUPPLIER_ACCOUNT WHERE "
                + " SUPPLIER_ACCOUNT.CREATED >= ? AND SUPPLIER_ACCOUNT.CREATED <= ? AND SUPPLIER_ACCOUNT.PRODUCT_ID = PRODUCT_DATA.ID"
                + " AND SUPPLIER_ACCOUNT.SUPPLIER_ID = SUPPLIER_DATA.ID AND SUPPLIER_ACCOUNT.BUSINESS_ID = ? ";
        sql = sql + extraSql + extraSql1 + extraSql2;

        JSONObject data = db.query(sql, beginDate, endDate, busId);
        worker.setResponseData(data);
        serv.messageToClient(worker);

    }

    private void commissionHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date") + ":00";
        String endDate = requestData.optString("end_date") + ":59";
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String busId = requestData.optString("business_id");
        String extraSql = userName.equals("all") ? "" : "AND COMMISSION_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        String allSql = "SELECT USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,COMMISSION_DATA.CREATED "
                + "FROM PRODUCT_DATA,COMMISSION_DATA WHERE PRODUCT_DATA.ID = COMMISSION_DATA.PRODUCT_ID AND "
                + "COMMISSION_DATA.BUSINESS_ID = ? AND COMMISSION_DATA.CREATED >= ? AND COMMISSION_DATA.CREATED <= ? "
                + extraSql + " ORDER BY COMMISSION_DATA.CREATED DESC";

        String specificSql = "SELECT USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,COMMISSION_DATA.CREATED "
                + "FROM PRODUCT_DATA,COMMISSION_DATA WHERE PRODUCT_DATA.ID = COMMISSION_DATA.PRODUCT_ID AND "
                + "COMMISSION_DATA.BUSINESS_ID = ? AND COMMISSION_DATA.PRODUCT_ID = ? AND COMMISSION_DATA.CREATED >= ? AND COMMISSION_DATA.CREATED <= ? "
                + extraSql + " ORDER BY COMMISSION_DATA.CREATED DESC";

        if (prodId.equals("all")) {
            data = db.query(allSql, busId, beginDate, endDate);
        } else {
            data = db.query(specificSql, busId, prodId, beginDate, endDate);
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    private void taxHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date") + ":00";
        String endDate = requestData.optString("end_date") + ":59";
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String busId = requestData.optString("business_id");
        String extraSql = userName.equals("all") ? "" : "AND TAX_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        String allSql = "SELECT USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,TAX_VALUE,TAX_DATA.CREATED "
                + "FROM PRODUCT_DATA,TAX_DATA WHERE PRODUCT_DATA.ID = TAX_DATA.PRODUCT_ID AND "
                + "TAX_DATA.BUSINESS_ID = ? AND TAX_DATA.CREATED >= ? AND TAX_DATA.CREATED <= ? "
                + extraSql + " ORDER BY TAX_DATA.CREATED DESC";

        String specificSql = "SELECT USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,TAX_DATA.CREATED "
                + "FROM PRODUCT_DATA,TAX_DATA WHERE PRODUCT_DATA.ID = TAX_DATA.PRODUCT_ID AND "
                + "TAX_DATA.BUSINESS_ID = ? AND TAX_DATA.PRODUCT_ID = ? AND TAX_DATA.CREATED >= ? AND "
                + " TAX_DATA.CREATED <= ? " + extraSql + " ORDER BY TAX_DATA.CREATED DESC";

        if (prodId.equals("all")) {
            data = db.query(allSql, busId, beginDate, endDate);
        } else {
            data = db.query(specificSql, busId, prodId, beginDate, endDate);
        }

        worker.setResponseData(data);
        serv.messageToClient(worker);

    }

    private void stockHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date") + ":00";
        String endDate = requestData.optString("end_date") + ":59";
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String busId = requestData.optString("business_id");
        String extraSql = userName.equals("all") ? "" : "AND STOCK_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        //stock_id, stock name,stock_bp, stock_sp,stock_qty, profit,type,narr,date,initiator
        String allSql = "SELECT PRODUCT_ID,STOCK_COST_BP,STOCK_COST_SP,STOCK_QTY, TRAN_FLAG, "
                + "TRAN_TYPE,PROFIT,STOCK_DATA.NARRATION,STOCK_DATA.CREATED,PRODUCT_DATA.PRODUCT_NAME, USER_NAME  "
                + "FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID AND "
                + "STOCK_DATA.BUSINESS_ID = ? AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? " + extraSql + " ORDER BY STOCK_DATA.CREATED DESC";

        String specificSql = "SELECT PRODUCT_ID,STOCK_COST_BP,STOCK_COST_SP,STOCK_QTY, TRAN_FLAG, "
                + "TRAN_TYPE,PROFIT,STOCK_DATA.NARRATION,STOCK_DATA.CREATED, PRODUCT_DATA.PRODUCT_NAME, USER_NAME  "
                + "FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID AND STOCK_DATA.BUSINESS_ID = ? "
                + " AND STOCK_DATA.PRODUCT_ID = ? AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? " + extraSql + " ORDER BY STOCK_DATA.CREATED DESC";
        if (prodId.equals("all")) {
            data = db.query(allSql, busId, beginDate, endDate);
        } else {
            data = db.query(specificSql, busId, prodId, beginDate, endDate);
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    private JSONObject getAccountBalance(ClientWorker worker, String table, String column) throws JSONException {
        //get the amount of taxes or commissions earned for the specified period
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date") + ":00";
        String busId = requestData.optString("business_id");
        String endDate = requestData.optString("end_date") + ":59";
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject data = db.query("SELECT " + column + " FROM " + table + " WHERE "
                + "BUSINESS_ID = ? AND CREATED >= ? AND CREATED <= ?", busId, beginDate, endDate);
        JSONArray col = data.optJSONArray(column);
        double total = 0;
        for (int x = 0; x < col.length(); x++) {
            double value = col.optDouble(x, 0);
            total += value;
        }
        String resourceName = "auto expense";
        if (table.equals("COMMISSION_DATA")) {
            resourceName = "Commissions";
        } else if (table.equals("TAX_DATA")) {
            resourceName = "Taxes";
        }
        JSONObject obj = new JSONObject();
        obj.put("ID", new UniqueRandom(60).nextMixedRandom());
        obj.put("BUSINESS_ID", busId);
        obj.put("RESOURCE_NAME", resourceName);
        obj.put("RESOURCE_TYPE", "expense");
        obj.put("RESOURCE_AMOUNT", total);
        obj.put("CREATED", new Date());
        return obj;
    }

    private JSONObject mapToJSONArrays(JSONObject mapTo, JSONObject toMap) {
        Iterator<String> iter = toMap.keys();
        while (iter.hasNext()) {
            String key = iter.next();
            Object value = toMap.opt(key);
            mapTo.optJSONArray(key).put(value);
        }
        return mapTo;
    }

    private JSONObject generateExpensesAndIncomes(Database db, ClientWorker worker) throws JSONException {
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date") + " 00";
        String busId = requestData.optString("business_id");
        String endDate = requestData.optString("end_date") + " 59";
        JSONObject expData = db.query("SELECT * FROM EXPENSE_DATA WHERE BUSINESS_ID = ? AND CREATED >= ? AND CREATED <= ? ", busId, beginDate, endDate);
        //commissions and taxes are in built expenses
        Database db1 = new Database("user_server",worker.getSession());
        JSONObject settings = db1.query("SELECT * FROM CONF_DATA");
        io.out(settings);
        int commIndex = settings.optJSONArray("CONF_KEY").toList().indexOf("add_comm");
        int taxIndex = settings.optJSONArray("CONF_KEY").toList().indexOf("add_tax");

        String hasTax = taxIndex == -1 ? "0" : settings.optJSONArray("CONF_VALUE").toList().get(taxIndex).toString();
        String hasComm = commIndex == -1 ? "0" : settings.optJSONArray("CONF_VALUE").toList().get(commIndex).toString();

        JSONObject comm = getAccountBalance(worker, "COMMISSION_DATA", "COMM_VALUE");
        JSONObject tax = getAccountBalance(worker, "TAX_DATA", "TAX_VALUE");

        if (hasTax.equals("1")) {
            expData = mapToJSONArrays(expData, tax);
        }

        if (hasComm.equals("1")) {
            expData = mapToJSONArrays(expData, comm);
        }

        return expData;
    }

    @Endpoint(name = "profit_and_loss")
    public void profitAndLoss(Server serv, ClientWorker worker) throws JSONException {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date") + "00:00:00";
        String busId = requestData.optString("business_id");
        String endDate = requestData.optString("end_date") + "23:59:59";
        String bType = requestData.optString("business_type");
        String allSql = "SELECT STOCK_COST_BP,STOCK_COST_SP,TRAN_FLAG FROM STOCK_DATA WHERE"
                + " STOCK_DATA.BUSINESS_ID = ? AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? ";
        Float costOfGoodsBought = 0F;
        Float costOfGoodsSold = 0F;
        Float costOfSales = 0F;
        JSONObject data = db.query(allSql, busId, beginDate, endDate);

        JSONObject expData = generateExpensesAndIncomes(db, worker);

        JSONArray goods = data.optJSONArray("STOCK_COST_BP");
        JSONArray sales = data.optJSONArray("STOCK_COST_SP");
        JSONArray flags = data.optJSONArray("TRAN_FLAG");
        //opening stock, cost of goods, closing stock
        //cost of sales

        for (int x = 0; x < goods.length(); x++) {
            Float amountBP = Float.parseFloat(goods.optString(x));
            Float amountSP = Float.parseFloat(sales.optString(x));
            String flag = flags.optString(x);
            //flags can be stock_in, reversal_of_sale, old_stock_disposed
            float dummy = flag.equals("stock_in") ? costOfGoodsBought = costOfGoodsBought + amountBP : 0; //goods we bought
            dummy = flag.equals("stock_out") ? costOfGoodsBought = costOfGoodsBought - amountBP : 0; //goods we bought
            dummy = flag.equals("sale_to_customer") ? costOfGoodsSold = costOfGoodsSold + amountBP : 0; //goods we bought
            dummy = flag.equals("sale_to_customer") ? costOfSales = costOfSales + amountSP : 0; //goods we sold
        }

        JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE BUSINESS_ID = ?", busId);
        JSONArray qtys = prodData.optJSONArray("PRODUCT_QTY");
        JSONArray priceBPs = prodData.optJSONArray("BP_UNIT_COST");
        Double closingStock = 0d;
        Double openingStock = 0d;
        if (bType.equals("goods")) {
            for (int x = 0; x < qtys.length(); x++) {
                int qty = qtys.optInt(x);
                Double priceBP = priceBPs.optDouble(x);
                closingStock += qty * priceBP;
            }
            openingStock = closingStock + costOfGoodsSold - costOfGoodsBought;
        } else if (bType.equals("services")) {
            openingStock = 0d;
        }
       
        //from product data extract

        JSONObject response = new JSONObject();
        response.put("resource_data", expData);
        response.put("cost_of_goods_sold_sp", costOfSales); //sales
        response.put("cost_of_goods_sold_bp", costOfGoodsSold);
        response.put("cost_of_goods_bought_bp", costOfGoodsBought); //purchases
        response.put("closing_stock", closingStock);
        response.put("opening_stock", openingStock);
        worker.setResponseData(response);
        serv.messageToClient(worker);
        //we have the data here, we need cost of sales, cost of goods,goods unsold expenses and incomes
    }

    private double getAccountBalance(ClientWorker worker, String table, String column, String filterCol, String posFilter, String negFilter) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        String beginDate = requestData.optString("start_date"); 
        String endDate = requestData.optString("end_date");
        JSONObject data = db.query("SELECT " + column + ", " + filterCol + " FROM " + table + " WHERE "
                + "BUSINESS_ID = ? AND CREATED >= ? AND CREATED <= ?", busId, beginDate, endDate);
        JSONArray col = data.optJSONArray(column);
        JSONArray filters = data.optJSONArray(filterCol);
        double total = 0;
        for (int x = 0; x < col.length(); x++) {
            double value = col.optDouble(x, 0);
            String currFilter = filters.optString(x);
            if (currFilter.equals(posFilter)) {
                total = total + value;
            }
            if (currFilter.equals(negFilter)) {
                total = total - value;
            }
        }
        return total;
    }

    @Endpoint(name = "stock_expiry", shareMethodWith = {"pos_sale_service"})
    public void stockExpiry(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        JSONObject data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .where("PRODUCT_EXPIRY_DATE < NOW() AND BUSINESS_ID = '" + busId + "'")
                .order("PRODUCT_EXPIRY_DATE ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "stock_low", shareMethodWith = {"pos_sale_service"})
    public void stockLow(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        JSONObject data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .where("PRODUCT_QTY <= PRODUCT_REMIND_LIMIT AND BUSINESS_ID = '" + busId + "'")
                .order("PRODUCT_QTY ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "delete_business")
    public void deleteBusinessData(Server serv, ClientWorker worker) throws NonExistentDatabaseException {
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String busId = requestData.optString("business_id");
        Database users = new Database("user_server", worker.getSession());
        JSONObject data = users.query("SELECT BUSINESS_OWNER FROM BUSINESS_DATA");
        int businesses = data.optJSONArray("BUSINESS_OWNER").length();
        if (businesses < 2) {
            worker.setResponseData(Message.FAIL);
            worker.setReason("You cannot delete the only business you have");
            serv.messageToClient(worker);
            return;
        }
        //delete all data associated with this business
        db.query("DELETE FROM EXPENSE_DATA WHERE BUSINESS_ID=?", busId);
        db.query("DELETE FROM STOCK_DATA WHERE BUSINESS_ID=?", busId);
        db.query("DELETE FROM PRODUCT_DATA WHERE BUSINESS_ID=?", busId);
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }
    
    @Endpoint(name="product_categories",shareMethodWith = {"pos_sale_service"})
    public void loadCategories(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String catType = requestData.optString("category_type");
        String filter = requestData.optString("filter");
        JSONObject data = new JSONObject();
        if(catType.equals("category")){
            data = db.query("SELECT DISTINCT PRODUCT_CATEGORY FROM PRODUCT_DATA ORDER BY PRODUCT_CATEGORY ASC");
        }
        else if(catType.equals("sub_category")){
           data = db.query("SELECT DISTINCT PRODUCT_SUB_CATEGORY FROM PRODUCT_DATA WHERE PRODUCT_CATEGORY = ? ORDER BY PRODUCT_SUB_CATEGORY ASC",filter); 
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }
    
    @Endpoint(name="load_products",shareMethodWith = {"pos_sale_service"})
    public void loadProducts(Server serv,ClientWorker worker) throws JSONException{
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String cat = requestData.optString("category");
        String subCat = requestData.optString("sub_category");
        JSONObject data = db.query("SELECT * FROM PRODUCT_DATA WHERE PRODUCT_CATEGORY = ? AND PRODUCT_SUB_CATEGORY = ? ORDER BY PRODUCT_NAME ASC",cat,subCat);
        JSONObject allProds = db.query("SELECT * FROM PRODUCT_DATA");
        JSONObject all = new JSONObject();
        all.put("categorized_products", data);
        all.put("all_products", allProds);
        worker.setResponseData(all);
        serv.messageToClient(worker);
    }
    
    
    @Endpoint(name="fetch_item_by_id")
    public void fetchItemById(Server serv,ClientWorker worker){
        JSONObject requestData = worker.getRequestData();
        String database = requestData.optString("database");
        String table = requestData.optString("table");
        String column = requestData.optString("column");
        String where = requestData.optString("where");
        boolean isSafe = serv.isTableSafe(database, table, column);
        Database db = new Database(database, worker.getSession());
        if(isSafe){
            io.out("SELECT "+column+" FROM "+table+" WHERE "+where+" ");
            JSONObject data = db.query("SELECT "+column+" FROM "+table+" WHERE "+where+" ");
            worker.setResponseData(data);
            serv.messageToClient(worker);
        }
        else {
           worker.setResponseData(Message.FAIL);
           worker.setReason("Specified query is not allowed");
           serv.messageToClient(worker);
        }
    }
    
    @Endpoint(name="add_category")
    public void addCategory(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String cat = requestData.optString("category");
        String username = requestData.optString("username");
        boolean exists = db.ifValueExists(new String[]{username,cat},"USER_CATEGORIES", new String[]{"USER_NAME","CATEGORY"});
        if(exists){
           worker.setResponseData(Message.FAIL);
           worker.setReason("Category already exists");
           serv.messageToClient(worker);
        }
        else {
            if(cat.equals("all")){
               db.query("DELETE FROM USER_CATEGORIES WHERE USER_NAME = ?",username);
            }
            else {
              db.query("DELETE FROM USER_CATEGORIES WHERE USER_NAME = ? AND CATEGORY='all'",username);  
            }
            db.doInsert("USER_CATEGORIES",new String[]{username,cat,"!NOW()"});
            worker.setResponseData(Message.SUCCESS);
            serv.messageToClient(worker);
        }
        
    }
    
    @Endpoint(name="fetch_categories",shareMethodWith = {"pos_sale_service"})
    public void fetchCategories(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        String username = requestData.optString("username");
        JSONObject data = db.query("SELECT * FROM USER_CATEGORIES WHERE USER_NAME = ?",username);
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

}
