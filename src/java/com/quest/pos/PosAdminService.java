
package com.quest.pos;

import com.quest.access.common.UniqueRandom;
import com.quest.access.common.io;
import com.quest.access.common.mysql.Database;
import com.quest.access.common.mysql.NonExistentDatabaseException;
import com.quest.access.control.Server;
import com.quest.access.useraccess.Serviceable;
import com.quest.access.useraccess.services.Message;
import com.quest.access.useraccess.services.OpenDataService;
import com.quest.access.useraccess.services.UserService;
import com.quest.access.useraccess.services.annotations.Endpoint;
import com.quest.access.useraccess.services.annotations.Model;
import com.quest.access.useraccess.services.annotations.Models;
import com.quest.access.useraccess.services.annotations.WebService;
import com.quest.access.useraccess.verification.UserAction;
import com.quest.servlets.ClientWorker;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * @author Connie
 */
@WebService(name = "pos_admin_service", level = 10, privileged = "yes")
@Models(models = {
    @Model(
            database = "pos_data", table = "PRODUCT_DATA",
            columns = {
                "ID VARCHAR(10) PRIMARY KEY",
                "PRODUCT_NAME TEXT",
                "PRODUCT_CODE INT",
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
                "MAX_DISCOUNT FLOAT",
                "ACTION_ID TEXT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "STOCK_DATA",
            columns = {
                "ID VARCHAR(50)",
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
                "RESOURCE_NAME TEXT",
                "RESOURCE_TYPE VARCHAR(10)",
                "RESOURCE_AMOUNT FLOAT",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "TAX_DATA",
            columns = {
                "ID VARCHAR(50)",
                "USER_NAME TEXT",
                "PRODUCT_ID TEXT",
                "TAX_VALUE FLOAT",
                "UNITS_SOLD INT",
                "TRAN_TYPE BOOL",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "COMMISSION_DATA",
            columns = {
                "ID VARCHAR(50)",
                "USER_NAME TEXT",
                "PRODUCT_ID TEXT",
                "COMM_VALUE FLOAT",
                "UNITS_SOLD INT",
                "TRAN_TYPE BOOL",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "DISCOUNT_DATA",
            columns = {
                "ID VARCHAR(50)",
                "USER_NAME TEXT",
                "PRODUCT_ID TEXT",
                "DISC_VALUE FLOAT",
                "UNITS_SOLD INT",
                "TRAN_TYPE BOOL",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "SUPPLIER_DATA",
            columns = {
                "ID VARCHAR(10) PRIMARY KEY",
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
                "SUPPLIER_ID VARCHAR(10)",
                "CREATED DATETIME"
            }),
    @Model(
            database = "pos_data", table = "SUPPLIER_ACCOUNT",
            columns = {
                "SUPPLIER_ID VARCHAR(10)",
                "PRODUCT_ID VARCHAR(10)",
                "PAYMENT_MODE TEXT",
                "TRANS_AMOUNT FLOAT",
                "TRAN_TYPE BOOL",
                "UNITS FLOAT",
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
            }),
      @Model(
            database = "pos_data", table = "POS_META_DATA",
            columns = {
                "SCOPE TEXT",
                "META_ID TEXT",
                "META_VALUE TEXT",
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
            Database db = new Database("user_server");
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
        serv.addSafeTable("user_server", "USERS", "USER_NAME,USER_ID");
        serv.addSafeTable("pos_data", "PRODUCT_DATA", "*");
        serv.addSafeTable("pos_data", "SUPPLIER_DATA", "*");
        serv.addSafeTable("pos_data", "EXPENSE_DATA", "RESOURCE_NAME");
        serv.addSafeTable("pos_data", "POS_META_DATA", "*");
        //check that app is activated
        validateActivation(serv);
    }

    @Endpoint(name = "add_resource")
    public void addResource(Server serv, ClientWorker worker) throws Exception {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String type = requestData.optString("resource_type");
        String name = requestData.optString("resource_name");
        String amount = requestData.optString("resource_amount");
        UserAction action = new UserAction(worker, "ADD RESOURCE " + name + " TYPE " + type);
        db.doInsert("EXPENSE_DATA", new String[]{action.getActionID(), name, type, amount, "!NOW()"});
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "update_product")
    public void updateProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
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
        String bType = requestData.optString("business_type");
        String pProduct = requestData.optString("product_parent");
        String unitSize = requestData.optString("product_unit_size");
        String maxDiscount = requestData.optString("max_discount","0");
        productQty = pProduct.trim().length() > 0 ? "0" : productQty;
        String userName = worker.getSession().getAttribute("username").toString();
        //check that we are not duplicating products
        boolean exists = db.ifValueExists(new String[]{productName}, "PRODUCT_DATA", new String[]{"PRODUCT_NAME"});
        if (exists && !oldProductName.equals(productName)) {
            worker.setResponseData("FAIL");
            worker.setReason("Product " + productName + " already exists");
            serv.messageToClient(worker);
        } else {
            try {
                UserAction action = new UserAction(worker, "UPDATE PRODUCT " + productName);
                JSONObject productData = db.query("SELECT BP_UNIT_COST,PRODUCT_QTY FROM PRODUCT_DATA WHERE ID=?", prodId);
                Double storedProductQty = Double.parseDouble(productData.optJSONArray("PRODUCT_QTY").optString(0));
                Double newProductQty = Double.parseDouble(productQty);
                Database.executeQuery("UPDATE PRODUCT_DATA SET PRODUCT_NAME=?, "
                        + "PRODUCT_QTY=?, PRODUCT_CATEGORY = ?,PRODUCT_SUB_CATEGORY = ?,PRODUCT_PARENT = ?, PRODUCT_UNIT_SIZE = ?, BP_UNIT_COST=?, "
                        + "SP_UNIT_COST=?, PRODUCT_REMIND_LIMIT=?, "
                        + "PRODUCT_EXPIRY_DATE=?,PRODUCT_NARRATION=?,TAX = ?, COMMISSION = ?, MAX_DISCOUNT = ? WHERE ID= ? ", db,
                        productName, productQty, productCat,productSubCat, pProduct,unitSize,
                        productBp, productSp, productRlimit, productEdate, productNarr, tax, comm,maxDiscount, prodId);
                if (storedProductQty > newProductQty) {
                    //reduction in stock
                    Double theQty = storedProductQty - newProductQty;
                    addStock(prodId, theQty.toString(), productBp, productSp, 0, productNarr, "stock_out", bType, db, userName);
                } else if (newProductQty > storedProductQty) {
                    //increase in stock
                    Double theQty = newProductQty - storedProductQty;
                    addStock(prodId, theQty.toString(), productBp, productSp, 1, productNarr, "stock_in", bType, db, userName);
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

    private void addStock(String prodId, String stockQty, String bPrice, String sPrice, Integer type, String narr, String tranFlag, String bType, Database db, String userName) {
        Double qty = Double.parseDouble(stockQty);
        Double price = Double.parseDouble(bPrice);
        Double price1 = Double.parseDouble(sPrice);
        Double costBp = qty * price;
        Double costSp = qty * price1;
        String transId = new UniqueRandom(50).nextMixedRandom();
        //specify profit also
        if (narr.equals("")) {
            if (type == 1) {
                narr = "New Stock"; //increase
            } else if (type == 0) {
                narr = "Old Stock Disposed"; //reduction 
            }
        }
        if (bType.equals("goods")) {
            db.doInsert("STOCK_DATA", new String[]{transId, prodId, type.toString(), costBp.toString(), costSp.toString(), stockQty, "0", tranFlag, narr, "!NOW()", userName});
        }

    }

    @Endpoint(name = "supplier_and_product")
    public void supplierAndProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject request = worker.getRequestData();
        String actionType = request.optString("action_type");
        String supId = request.optString("supplier_id");
        String prodId = request.optString("product_id");
        Object resp = null;
        if (actionType.equals("delete")) {
            db.query("DELETE FROM PRODUCT_SUPPLIER_DATA WHERE SUPPLIER_ID = ? ", supId);
            resp = Message.SUCCESS;
        } else if (actionType.equals("create")) {
            boolean exists = db.ifValueExists(new String[]{prodId, supId}, "PRODUCT_SUPPLIER_DATA",
                    new String[]{"PRODUCT_ID", "SUPPLIER_ID"});
            if (exists) {
                worker.setResponseData(Message.FAIL);
                worker.setReason("This supplier already exists");
                serv.messageToClient(worker);
                return;
            }

            db.doInsert("PRODUCT_SUPPLIER_DATA", new String[]{prodId, supId, "!NOW()"});
            resp = Message.SUCCESS;
        } else if (actionType.equals("fetch_all")) {
            //this is a relationship thing
            //i hate relationships
            //get the name of the supplier and account
            resp = db.query("SELECT SUPPLIER_ID,SUPPLIER_NAME FROM SUPPLIER_DATA,PRODUCT_SUPPLIER_DATA WHERE "
                    + "PRODUCT_SUPPLIER_DATA.SUPPLIER_ID = SUPPLIER_DATA.ID AND "
                    + "PRODUCT_ID = ?  ORDER BY SUPPLIER_NAME ASC", prodId);
        }

        worker.setResponseData(resp);
        serv.messageToClient(worker);

    }

    @Endpoint(name = "supplier_account_transact")
    public void supplierAccount(Server serv, ClientWorker worker) throws Exception {
        Database db = new Database(POS_DATA);
        JSONObject request = worker.getRequestData();
        String supId = request.optString("supplier_id");
        String prodId = request.optString("product_id");
        String transAmount = request.optString("amount");
        String units = request.optString("units_received");
        String sp = request.optString("sp_per_unit");
        String entryType = request.optString("entry_type");
        String narr = request.optString("narration");
        String bType = request.optString("business_type");
        String payMode = request.optString("payment_mode");
        String userName = worker.getSession().getAttribute("username").toString();
        JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ?", prodId);
        double productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optDouble(0);
        double newQty = productTotalqty;
        double theUnits = Double.parseDouble(units);
        Double cost = bType.equals("goods") ? Double.parseDouble(sp) * theUnits : Double.parseDouble(transAmount);
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
                newQty = productTotalqty - Double.parseDouble(units);
            }
        }
        
        String tranFlag = entryType.equals("1") ? "stock_in" : "stock_out";
        //stuff from suppliers, credit your account, debit suppliers account
        db.doInsert("SUPPLIER_ACCOUNT", new String[]{supId, prodId,payMode,transAmount, entryType, units, narr, userName, "!NOW()"});
        db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "' WHERE ID='" + prodId + "'");
        //note this as a stock movement
        String transId = new UniqueRandom(50).nextMixedRandom();
        db.doInsert("STOCK_DATA", new String[]{transId, prodId, entryType, transAmount, cost.toString(), units, "0", tranFlag, narr, "!NOW()", userName});
        //stock in is an expense on our side so put a 0
        //stock out is a revenue or refund

        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "supplier_action")
    public void supplierAction(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
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
        String supId = request.optString("supplier_id");

        boolean exists = db.ifValueExists(new String[]{name}, "SUPPLIER_DATA", new String[]{"SUPPLIER_NAME"});
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
                db.doInsert("SUPPLIER_DATA", new String[]{supId, name, country, city,
                    pAddress, pNumber, email, web, cName, cPhone, "!NOW()"});

            } else if (actionType.equals("update")) {
                Database.executeQuery("UPDATE SUPPLIER_DATA SET SUPPLIER_NAME=?, "
                        + "COUNTRY=?, CITY=?, POSTAL_ADDRESS=?, "
                        + "PHONE_NUMBER=?,EMAIL_ADDRESS=?, WEBSITE=?, "
                        + "CONTACT_PERSON_NAME=?,CONTACT_PERSON_PHONE = ? WHERE ID = ?", db,
                        name, country, city,
                        pAddress, pNumber, email, web, cName, cPhone, supId);
            } else if (actionType.equals("delete")) {
                db.query("DELETE FROM SUPPLIER_DATA WHERE ID = ?", supId);
            }
        }
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }
    
    

    @Endpoint(name = "create_product")
    public synchronized void createProduct(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
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
        String bType = requestData.optString("business_type");
        String pProduct = requestData.optString("product_parent");
        String unitSize = requestData.optString("product_unit_size");
        String maxDiscount = requestData.optString("max_discount","0");
        productQty = pProduct.trim().length() > 0 ? "0" : productQty;
        String userName = worker.getSession().getAttribute("username").toString();
        //check whether the product exists
        boolean exists = db.ifValueExists(new String[]{productName}, "PRODUCT_DATA", new String[]{ "PRODUCT_NAME"});
        Integer count = db.query("select COUNT(*) AS COUNT FROM PRODUCT_DATA").optJSONArray("COUNT").optInt(0);
        count++;
        if (exists) {
            worker.setResponseData("FAIL");
            worker.setReason("Product " + productName + " already exists");
            serv.messageToClient(worker);
        } else {
            try {
                //well create the product
                String prodId = new UniqueRandom(10).nextMixedRandom();
                UserAction action = new UserAction(worker, "CREATED PRODUCT " + productName);
                db.doInsert("PRODUCT_DATA", new String[]{prodId, productName,count.toString(), productQty, productCat,productSubCat,
                    pProduct,unitSize,productBp, productSp, productRlimit,
                    productEdate, productNarr, tax, comm,maxDiscount, action.getActionID(), "!NOW()"});
                
                
                addStock(prodId, productQty, productBp, productSp, 1, productNarr, "stock_in", bType, db, userName);
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
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String id = requestData.optString("id");
        db.query()
                .delete()
                .from("PRODUCT_DATA")
                .where("ID='" + id + "'")
                .execute();
        worker.setResponseData("SUCCESS");
        serv.messageToClient(worker);
    }

    @Endpoint(name = "all_products", shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void allProducts(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String cat = requestData.optString("category");
        JSONObject data;
        if(cat != null && !cat.isEmpty() && !cat.equals("all")){
            data = db.query("SELECT * FROM PRODUCT_DATA WHERE PRODUCT_CATEGORY=? ORDER BY PRODUCT_NAME ASC",cat);
        }
        else {
            data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .order("PRODUCT_NAME ASC")
                .execute();
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }
    
    private void updateProductQty(ClientWorker worker,String prodId){
        JSONObject request  = worker.getRequestData();
        String bType = request.optString("business_type");
        String productQty = request.optString("new_value");
        String userName = worker.getSession().getAttribute("username").toString();
        Database db = new Database(POS_DATA);
        JSONObject productData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID=?", prodId);
        Double storedProductQty = Double.parseDouble(productData.optJSONArray("PRODUCT_QTY").optString(0));
        String productBp = productData.optJSONArray("BP_UNIT_COST").optString(0);
        String productSp = productData.optJSONArray("SP_UNIT_COST").optString(0);
        Double newProductQty = Double.parseDouble(productQty);
        if (storedProductQty > newProductQty) {
            //reduction in stock
            Double theQty = storedProductQty - newProductQty;
            addStock(prodId, theQty.toString(), productBp, productSp, 0, "", "stock_out", bType, db, userName);
            db.query("UPDATE PRODUCT_DATA SET PRODUCT_QTY = '"+newProductQty+"' WHERE ID ='"+prodId+"'");
        } else if (newProductQty > storedProductQty) {
            //increase in stock
            Double theQty = newProductQty - storedProductQty;
            addStock(prodId, theQty.toString(), productBp, productSp, 1, "", "stock_in", bType, db, userName);
            db.query("UPDATE PRODUCT_DATA SET PRODUCT_QTY = '"+newProductQty+"' WHERE ID ='"+prodId+"'");
        }
    }
    
    @Endpoint(name="save_grid_edit")
    public void saveGridEdit(Server serv, ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String column = requestData.optString("column").trim();
        String id = requestData.optString("id");
        String newValue = requestData.optString("new_value");
        if(column.equals("PRODUCT_QTY")){
            updateProductQty(worker, id);
        }
        else {
            db.query()
                    .update("PRODUCT_DATA")
                    .set("" + column + "='" + newValue + "'")
                    .where("ID='" + id + "'")
                    .execute();
        }
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "all_suppliers",shareMethodWith = {"pos_middle_service"})
    public void allSuppliers(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONObject data = db.query()
                .select("*")
                .from("SUPPLIER_DATA")
                .order("SUPPLIER_NAME ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }



    @Endpoint(name = "auto_complete", shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void autoComplete(Server serv, ClientWorker worker) {
        try {
            JSONObject requestData = worker.getRequestData();
            String database = requestData.optString("database");
            String table = requestData.optString("table");
            String column = requestData.optString("column");
            int limit = requestData.optInt("limit");
            String orderBy = requestData.optString("orderby");
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
            Database theDb = new Database(database);
            JSONObject data = theDb.query(builder.toString());
            worker.setResponseData(data);
            serv.messageToClient(worker);
        } catch (Exception ex) {
            Logger.getLogger(PosAdminService.class.getName()).log(Level.SEVERE, null, ex);
            worker.setResponseData("FAIL");
            serv.messageToClient(worker);
        }

    }

    @Endpoint(name = "stock_history", shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void openHistory(Server serv, ClientWorker worker) throws JSONException {
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
        } else if (action.equals("discount_history")) {
            discountHistory(serv, worker);
        } else if(action.equals("sales_volume")){
            salesVolume(serv, worker);
        }
        else if(action.equals("resource_history")){
            resourceHistory(serv, worker);
        }
    }

    private void supplierHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String supId = requestData.optString("supplier_id");

        String extraSql = userName.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.USER_NAME = '" + userName + "'";
        String extraSql1 = supId.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.SUPPLIER_ID = '" + supId + "'";
        String extraSql2 = prodId.equals("all") ? "" : " AND SUPPLIER_ACCOUNT.PRODUCT_ID = '" + prodId + "'";

        String sql = "SELECT SUPPLIER_NAME, PRODUCT_NAME,PAYMENT_MODE,TRANS_AMOUNT,TRAN_TYPE,UNITS,NARRATION,SUPPLIER_ACCOUNT.USER_NAME,"
                + " SUPPLIER_ACCOUNT.CREATED FROM SUPPLIER_DATA, PRODUCT_DATA, SUPPLIER_ACCOUNT WHERE "
                + " SUPPLIER_ACCOUNT.CREATED >= ? AND SUPPLIER_ACCOUNT.CREATED <= ? AND SUPPLIER_ACCOUNT.PRODUCT_ID = PRODUCT_DATA.ID"
                + " AND SUPPLIER_ACCOUNT.SUPPLIER_ID = SUPPLIER_DATA.ID ";
        sql = sql + extraSql + extraSql1 + extraSql2;

        JSONObject data = db.query(sql, beginDate, endDate);
        worker.setResponseData(data);
        serv.messageToClient(worker);

    }

    private void commissionHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String extraSql = userName.equals("all") ? "" : "AND COMMISSION_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        String allSql = "SELECT COMMISSION_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,TRAN_TYPE,COMMISSION_DATA.CREATED "
                + "FROM PRODUCT_DATA,COMMISSION_DATA WHERE PRODUCT_DATA.ID = COMMISSION_DATA.PRODUCT_ID AND "
                + " COMMISSION_DATA.CREATED >= ? AND COMMISSION_DATA.CREATED <= ? "
                + extraSql + " ORDER BY COMMISSION_DATA.CREATED DESC";

        String specificSql = "SELECT COMMISSION_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,TRAN_TYPE,COMMISSION_DATA.CREATED "
                + "FROM PRODUCT_DATA,COMMISSION_DATA WHERE PRODUCT_DATA.ID = COMMISSION_DATA.PRODUCT_ID AND "
                + " COMMISSION_DATA.PRODUCT_ID = ? AND COMMISSION_DATA.CREATED >= ? AND COMMISSION_DATA.CREATED <= ? "
                + extraSql + " ORDER BY COMMISSION_DATA.CREATED DESC";

        if (prodId.equals("all")) {
            data = db.query(allSql, beginDate, endDate);
        } else {
            data = db.query(specificSql, prodId, beginDate, endDate);
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }
    
    
    private void resourceHistory(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String resourceType = requestData.optString("resource_type");
        //what we need
        String extra = resourceType.isEmpty() ? "" : " AND RESOURCE_TYPE = '"+resourceType+"'";
        String sql = "SELECT * FROM EXPENSE_DATA WHERE CREATED >= ? AND CREATED <= ? "+extra+" ORDER BY CREATED DESC";
        JSONObject data = db.query(sql,beginDate, endDate);
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    private void taxHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String extraSql = userName.equals("all") ? "" : "AND TAX_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        String allSql = "SELECT TAX_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,TAX_VALUE,TRAN_TYPE,TAX_DATA.CREATED "
                + "FROM PRODUCT_DATA,TAX_DATA WHERE PRODUCT_DATA.ID = TAX_DATA.PRODUCT_ID AND "
                + " TAX_DATA.CREATED >= ? AND TAX_DATA.CREATED <= ? "
                + extraSql + " ORDER BY TAX_DATA.CREATED DESC";

        String specificSql = "SELECT TAX_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,COMM_VALUE,TRAN_TYPE,TAX_DATA.CREATED "
                + "FROM PRODUCT_DATA,TAX_DATA WHERE PRODUCT_DATA.ID = TAX_DATA.PRODUCT_ID AND "
                + " TAX_DATA.PRODUCT_ID = ? AND TAX_DATA.CREATED >= ? AND "
                + " TAX_DATA.CREATED <= ? " + extraSql + " ORDER BY TAX_DATA.CREATED DESC";

        if (prodId.equals("all")) {
            data = db.query(allSql, beginDate, endDate);
        } else {
            data = db.query(specificSql, prodId, beginDate, endDate);
        }

        worker.setResponseData(data);
        serv.messageToClient(worker);

    }
    
    private void salesVolume(Server serv, ClientWorker worker) throws JSONException{
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String extraSql = userName.equals("all") ? "" : "AND STOCK_DATA.USER_NAME = '" + userName + "'";
        String allSql = "SELECT STOCK_DATA.ID AS TRANS_ID,PRODUCT_DATA.ID AS ID,PRODUCT_NAME,STOCK_COST_BP,TRAN_FLAG, "
                + " STOCK_COST_SP FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID "
                + " AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ?  "+extraSql+"";
        
        String specificSql = "SELECT STOCK_DATA.ID AS TRANS_ID,PRODUCT_DATA.ID AS ID,PRODUCT_NAME,STOCK_COST_BP, TRAN_FLAG, "
                + " STOCK_COST_SP FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID AND "
                + " STOCK_DATA.PRODUCT_ID = ? AND STOCK_DATA.CREATED >= ? "
                + " AND STOCK_DATA.CREATED <= ?  "+extraSql+"";
        JSONObject data;
        if(prodId.equals("all")){
            data = db.query(allSql, beginDate, endDate);
        }
        else {
            data = db.query(specificSql, prodId, beginDate, endDate);   
        }
        JSONObject response = new JSONObject();
        JSONArray names = data.optJSONArray("PRODUCT_NAME");
        JSONArray ids = data.optJSONArray("ID");
        JSONArray costSp = data.optJSONArray("STOCK_COST_SP");
        JSONArray costBp = data.optJSONArray("STOCK_COST_BP");
        JSONArray flags = data.optJSONArray("TRAN_FLAG");
        if(prodId.equals("all")){ 
            HashMap<String,Integer> units = new HashMap();
            HashMap<String,String> namez = new HashMap();
            HashMap<String,String> idz = new HashMap();
            HashMap<String,Double> sp = new HashMap();
            HashMap<String,Double> bp = new HashMap();
            for(int x = 0 ; x < ids.length(); x++){
                String id = ids.optString(x);
                String flag = flags.optString(x);
                if(units.get(id) == null){
                    int count = 0;
                    Double spCost = 0.0;
                    Double bpCost = 0.0;
                    if (flag.equals("sale_to_customer")) {
                        count++;
                        bpCost = costBp.optDouble(x); 
                        spCost = costSp.optDouble(x);
                    } else if (flag.equals("reversal_of_sale")) {
                        count--;
                        bpCost = -costBp.optDouble(x); 
                        spCost = -costSp.optDouble(x);
                    }
                    units.put(id, count);
                    namez.put(id, names.optString(x));
                    idz.put(id, id);
                    sp.put(id,spCost);
                    bp.put(id,bpCost);
                }
                else {
                    int count = units.get(id);
                    Double spCost = sp.get(id);
                    Double bpCost = bp.get(id);
                    if (flag.equals("sale_to_customer")) {
                        spCost = spCost + costSp.optDouble(x);
                        bpCost = bpCost + costBp.optDouble(x);
                        count++;
                    } else if (flag.equals("reversal_of_sale")) {
                        spCost = spCost - costSp.optDouble(x);
                        bpCost = bpCost - costBp.optDouble(x);
                        count--;
                    }
                    units.put(id,count);
                    namez.put(id, names.optString(x));
                    idz.put(id,id);
                    sp.put(id, spCost);
                    bp.put(id, bpCost);
                }
            }
            response.put("ids",new JSONArray(idz.values()));
            response.put("units",new JSONArray(units.values()));
            response.put("names", new JSONArray(namez.values()));
            response.put("cost_sp", new JSONArray(sp.values()));
            response.put("cost_bp", new JSONArray(bp.values()));
        }
        else {
            response.put("ids", new JSONArray().put(ids.optString(0)));
            response.put("units", new JSONArray().put(ids.length()));
            response.put("names", new JSONArray().put(names.optString(0))); 
            Double sp = ids.length() * costSp.optDouble(0);
            Double bp = ids.length() * costBp.optDouble(0);
            response.put("cost_sp",new JSONArray().put(sp));
            response.put("cost_bp", new JSONArray().put(bp));
        }
        worker.setResponseData(response);
        serv.messageToClient(worker);
    }
    
    
    private void discountHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        String endDate = requestData.optString("end_date");
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String extraSql = userName.equals("all") ? "" : "AND DISCOUNT_DATA.USER_NAME = '" + userName + "'";
        JSONObject data;
        //what we need
        String allSql = "SELECT DISCOUNT_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,DISC_VALUE,TRAN_TYPE,DISCOUNT_DATA.CREATED "
                + "FROM PRODUCT_DATA,DISCOUNT_DATA WHERE PRODUCT_DATA.ID = DISCOUNT_DATA.PRODUCT_ID AND "
                + " DISCOUNT_DATA.CREATED >= ? AND DISCOUNT_DATA.CREATED <= ? "
                + extraSql + " ORDER BY DISCOUNT_DATA.CREATED DESC";

        String specificSql = "SELECT DISCOUNT_DATA.ID,USER_NAME,PRODUCT_DATA.PRODUCT_NAME,UNITS_SOLD,DISC_VALUE,TRAN_TYPE,DISCOUNT_DATA.CREATED "
                + "FROM PRODUCT_DATA,DISCOUNT_DATA WHERE PRODUCT_DATA.ID = DISCOUNT_DATA.PRODUCT_ID AND "
                + " DISCOUNT_DATA.PRODUCT_ID = ? AND DISCOUNT_DATA.CREATED >= ? AND "
                + " DISCOUNT_DATA.CREATED <= ? " + extraSql + " ORDER BY DISCOUNT_DATA.CREATED DESC";

        if (prodId.equals("all")) {
            data = db.query(allSql, beginDate, endDate);
        } else {
            data = db.query(specificSql, prodId, beginDate, endDate);
        }

        worker.setResponseData(data);
        serv.messageToClient(worker);

    }
    
    
    private static String getTodayBeginDate(){
        return getDate()+" 00:00:00";
    }
    
    private  String getTodayEndDate(){
        return getDate()+" 23:59:59";
    }
        
   
    private void stockHistory(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("begin_date");
        beginDate = beginDate.equals("server_time_begin") ? getTodayBeginDate() : beginDate;
        String endDate = requestData.optString("end_date");
        endDate = endDate.equals("server_time_end") ? getTodayEndDate() : endDate;
        String prodId = requestData.optString("id");
        String userName = requestData.optString("user_name");
        String category = requestData.optString("product_categories");
        String extraSql = userName.equals("all") ? "" : " AND STOCK_DATA.USER_NAME = '" + userName + "' ";
        String extraSql1 = category.equals("all") ? "" : " AND PRODUCT_DATA.PRODUCT_CATEGORY = '" + category + "' ";
        String allExtraSql = extraSql + extraSql1;
        JSONObject data;
        //what we need
        //stock_id, stock name,stock_bp, stock_sp,stock_qty, profit,type,narr,date,initiator
        String allSql = "SELECT STOCK_DATA.ID,PRODUCT_ID,STOCK_COST_BP,STOCK_COST_SP,STOCK_QTY, TRAN_FLAG, "
                + "TRAN_TYPE,PROFIT,STOCK_DATA.NARRATION,STOCK_DATA.CREATED,PRODUCT_DATA.PRODUCT_NAME, USER_NAME  "
                + "FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID "
                + " AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? " + allExtraSql + " ORDER BY STOCK_DATA.CREATED DESC";

        String specificSql = "SELECT STOCK_DATA.ID,PRODUCT_ID,STOCK_COST_BP,STOCK_COST_SP,STOCK_QTY, TRAN_FLAG, "
                + "TRAN_TYPE,PROFIT,STOCK_DATA.NARRATION,STOCK_DATA.CREATED, PRODUCT_DATA.PRODUCT_NAME, USER_NAME  "
                + "FROM STOCK_DATA,PRODUCT_DATA WHERE PRODUCT_DATA.ID = STOCK_DATA.PRODUCT_ID "
                + " AND STOCK_DATA.PRODUCT_ID = ? AND STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? " + allExtraSql + " ORDER BY STOCK_DATA.CREATED DESC";
        if (prodId.equals("all")) {
            data = db.query(allSql, beginDate, endDate);
        } else {
            data = db.query(specificSql, prodId, beginDate, endDate);
        }
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    private JSONObject getAccountBalance(ClientWorker worker, String table, String column,String resourceName) throws JSONException {
        //get the amount of taxes or commissions earned for the specified period
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date") + ":00";
        String endDate = requestData.optString("end_date") + ":59";
        Database db = new Database(POS_DATA);
        JSONObject data = db.query("SELECT " + column + " FROM " + table + " WHERE "
                + " CREATED >= ? AND CREATED <= ?", beginDate, endDate);
        JSONArray col = data.optJSONArray(column);
        double total = 0;
        for (int x = 0; x < col.length(); x++) {
            double value = col.optDouble(x, 0);
            total += value;
        }
        JSONObject obj = new JSONObject();
        obj.put("ID", new UniqueRandom(60).nextMixedRandom());
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
        String endDate = requestData.optString("end_date") + " 59";
        JSONObject expData = db.query("SELECT * FROM EXPENSE_DATA WHERE CREATED >= ? AND CREATED <= ? ", beginDate, endDate);
        //commissions and taxes are in built expenses
      
        boolean hasTax = OpenDataService.getSetting("add_tax").equals("1");
        boolean hasComm = OpenDataService.getSetting("add_comm").equals("1");
        boolean hasDisc = OpenDataService.getSetting("add_discounts").equals("1");
        
        JSONObject comm = getAccountBalance(worker, "COMMISSION_DATA", "COMM_VALUE","Commissions Paid");
        JSONObject tax = getAccountBalance(worker, "TAX_DATA", "TAX_VALUE","Taxes");
        JSONObject disc = getAccountBalance(worker, "DISCOUNT_DATA", "DISC_VALUE","Discounts Allowed");
        
        if (hasTax) {
            expData = mapToJSONArrays(expData, tax);
        }

        if (hasComm) {
            expData = mapToJSONArrays(expData, comm);
        }
        
        if(hasDisc){
            expData = mapToJSONArrays(expData, disc);
        }

        return expData;
    }

    @Endpoint(name = "profit_and_loss")
    public void profitAndLoss(Server serv, ClientWorker worker) throws JSONException {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date") + "00:00:00";
        String endDate = requestData.optString("end_date") + "23:59:59";
        String bType = requestData.optString("business_type");
        String allSql = "SELECT STOCK_COST_BP,STOCK_COST_SP,TRAN_FLAG FROM STOCK_DATA WHERE"
                + " STOCK_DATA.CREATED >= ? AND STOCK_DATA.CREATED <= ? ";
        Float costOfGoodsBought = 0F;
        Float costOfGoodsSold = 0F;
        Float costOfSales = 0F;
        JSONObject data = db.query(allSql, beginDate, endDate);

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

        JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA");
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
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String beginDate = requestData.optString("start_date"); 
        String endDate = requestData.optString("end_date");
        JSONObject data = db.query("SELECT " + column + ", " + filterCol + " FROM " + table + " WHERE "
                + " CREATED >= ? AND CREATED <= ?", beginDate, endDate);
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

    @Endpoint(name = "stock_expiry", shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void stockExpiry(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONObject data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .where("PRODUCT_EXPIRY_DATE < NOW()")
                .order("PRODUCT_EXPIRY_DATE ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    @Endpoint(name = "stock_low", shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void stockLow(Server serv, ClientWorker worker) {
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONObject data = db.query()
                .select("*")
                .from("PRODUCT_DATA")
                .where("PRODUCT_QTY <= PRODUCT_REMIND_LIMIT")
                .order("PRODUCT_QTY ASC")
                .execute();
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }

    
    @Endpoint(name="product_categories",shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void loadCategories(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
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
    
    @Endpoint(name="load_products",shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void loadProducts(Server serv,ClientWorker worker) throws JSONException{
        Database db = new Database(POS_DATA);
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
    
    
    @Endpoint(name="fetch_item_by_id",shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void fetchItemById(Server serv,ClientWorker worker){
        JSONObject requestData = worker.getRequestData();
        String database = requestData.optString("database");
        String table = requestData.optString("table");
        String column = requestData.optString("column");
        String where = requestData.optString("where");
        boolean isSafe = serv.isTableSafe(database, table, column);
        Database db = new Database(database);
        if(isSafe){
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
        Database db = new Database(POS_DATA);
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
    
    @Endpoint(name="fetch_categories",shareMethodWith = {"pos_sale_service","pos_middle_service"})
    public void fetchCategories(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String username = requestData.optString("username");
        JSONObject data = db.query("SELECT * FROM USER_CATEGORIES WHERE USER_NAME = ?",username);
        worker.setResponseData(data);
        serv.messageToClient(worker);
    }
    
    @Endpoint(name="note_cash_received",shareMethodWith = {"pos_middle_service"})
    public void noteCashReceived(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String received = requestData.optString("cash_received");
        String transId = requestData.optString("trans_id");
        switch (received) {
            case "Yes":
                db.doInsert("POS_META_DATA",new String[]{"cash_received",transId,received,"!NOW()"});
                break;
            case "No":
                db.query("DELETE FROM POS_META_DATA WHERE SCOPE='cash_received' AND META_ID='"+transId+"'");
                break;
        }
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }
    
    @Endpoint(name = "graph_data")
    public void graphData(Server serv, ClientWorker worker) throws JSONException {
        JSONObject requestData = worker.getRequestData();
        JSONArray prodIds = requestData.optJSONArray("prod_ids");
        JSONArray cats = requestData.optJSONArray("categories");
        worker.setPropagateResponse(false);
        HashMap<String,JSONObject> previousValues = null;
        for(int x = 0; x < cats.length(); x++){
            String cat = cats.optString(x);
            String prodId = prodIds.optString(x);
            JSONObject request = new JSONObject();
            request.put("begin_date", requestData.optString("begin_date"));
            request.put("end_date", requestData.optString("end_date"));
            request.put("id", prodId);
            request.put("user_name", "all");
            request.put("product_categories", "all");
            worker.setRequestData(request);
            if (cat.equals("sales")) {
                stockHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response,"STOCK_COST_SP",cat,previousValues,
                        new String[]{"TRAN_FLAG","sale_to_customer","reversal_of_sale"});
                io.out(previousValues);
            } else if (cat.equals("cost of goods")) {
                stockHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "STOCK_COST_BP", cat, previousValues,
                        new String[]{"TRAN_FLAG", "sale_to_customer", "reversal_of_sale"});
            } else if (cat.equals("margin")) {
                stockHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "PROFIT", cat, previousValues,
                        new String[]{"TRAN_FLAG", "sale_to_customer", "reversal_of_sale"});
            } else if (cat.equals("taxes")) {
                taxHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "TAX_VALUE", cat, previousValues,
                        new String[]{"TRAN_TYPE", "0", "1"});
            } else if (cat.equals("discounts")) {
                discountHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "DISC_VALUE", cat, previousValues,
                        new String[]{"TRAN_TYPE", "0", "1"});
            } else if (cat.equals("commissions")) {
                commissionHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "COMM_VALUE", cat, previousValues,
                        new String[]{"TRAN_TYPE", "0", "1"});
            }
            else if (cat.equals("expenses")) {
                resourceHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "RESOURCE_AMOUNT", cat, previousValues,
                        new String[]{"RESOURCE_TYPE", "expense", "1"});
            }
            else if (cat.equals("incomes")) {
                resourceHistory(serv, worker);
                JSONObject response = (JSONObject) worker.getResponseData();
                previousValues = generateGraphData(response, "RESOURCE_AMOUNT", cat, previousValues,
                        new String[]{"RESOURCE_TYPE", "income", "1"});
            }
        }
        JSONArray all = new JSONArray(previousValues.values());
        worker.setPropagateResponse(true);
        worker.setResponseData(all);
        serv.messageToClient(worker);
    }
    
    private HashMap<String, JSONObject> generateGraphData(JSONObject data, String dbColumn,
            String category,HashMap<String,JSONObject> previousValues, String[] flags) throws JSONException {
        JSONArray costSps = data.optJSONArray(dbColumn);
        JSONArray types = data.optJSONArray(flags[0]);
        
        JSONArray dates = data.optJSONArray("CREATED");
        HashMap<String, JSONObject> values = previousValues == null ? new HashMap() : previousValues;
        for (int x = 0; x < types.length(); x++) {
            String type = types.optString(x);
            String date = dates.optString(x);
            date = date.substring(0, date.indexOf(" "));
            Double costSp = costSps.optDouble(x);
            JSONObject obj = new JSONObject();
            if (values.get(date) == null) {
                Double sp = null;
                if (flags[1].equals(type)) {
                    sp = costSp;
                } else if (flags[2].equals(type)) {
                    sp = -costSp;
                }
                obj.put("date", date);
                obj.put(category, sp);
                values.put(date, obj);
            } else {
                Double newValue = null;
                if (flags[1].equals(type)) {
                    newValue = values.get(date).optDouble(category,0) + costSp;
                } else if (flags[2].equals(type)) {
                    newValue = values.get(date).optDouble(category,0) - costSp;
                }
                if(newValue != null)
                    values.get(date).put(category, newValue);
            }
        }
        return values;
    }
    
    @Endpoint(name = "all_users", shareMethodWith = {"pos_sale_service", "pos_middle_service"})
    public void allUsers(Server serv, ClientWorker worker) throws NonExistentDatabaseException {
        UserService us = new UserService();
        worker.setPropagateResponse(false);
        us.allUsers(serv, worker);
        worker.setPropagateResponse(true);
        worker.setResponseData(worker.getResponseData());
        serv.messageToClient(worker);
    }
    
    private static String getDate() {
        Calendar cal = Calendar.getInstance();
        int year = cal.get(Calendar.YEAR);
        Integer month = cal.get(Calendar.MONTH) + 1;
        Integer day = cal.get(Calendar.DATE);
        String themonth = month < 10 ? "0" + month : month.toString();
        String theday = day < 10 ? "0" + day : day.toString();
        return year + "-" + themonth + "-" + theday;
    }
    
    public static void main(String [] args){
        //2016-02-01
        io.out(getTodayBeginDate());
    }

}
