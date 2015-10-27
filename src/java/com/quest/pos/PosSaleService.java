
package com.quest.pos;

import com.quest.access.common.UniqueRandom;
import com.quest.access.common.io;
import com.quest.access.common.mysql.Database;
import com.quest.access.control.Server;
import com.quest.access.useraccess.Serviceable;
import com.quest.access.useraccess.services.Message;
import com.quest.access.useraccess.services.annotations.Endpoint;
import com.quest.access.useraccess.services.annotations.WebService;
import com.quest.servlets.ClientWorker;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONException;

/**
 *
 * @author Connie
 */

@WebService(name="pos_sale_service",privileged = "yes",level = 5)
public class PosSaleService implements Serviceable {
    
    private static String POS_DATA = "pos_data";

    private static JSONObject busSettings;

    @Override
    public void service() {
      
    }

    @Override
    public void onPreExecute(Server serv, ClientWorker worker) {
        if(!PosAdminService.isAccessible()){
            worker.setResponseData(Message.FAIL);
            worker.setReason("Application has expired, activate to continue using it");
            serv.messageToClient(worker);
        }
    }

    @Override
    public void onStart(Server serv) {
       Database db = new Database("user_server");
       busSettings = db.query("SELECT * FROM CONF_DATA");
    }
    
    private String getSetting(String key){
        if(busSettings == null) return "0";
        List keys = busSettings.optJSONArray("CONF_KEY").toList();
        List values = busSettings.optJSONArray("CONF_VALUE").toList();
        return values.get(keys.indexOf(key)).toString();
    }
    
    private Object[] quantityPreCondition(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONArray ids = requestData.optJSONArray("product_ids");
        JSONArray qtys = requestData.optJSONArray("product_qtys");
        String busId = requestData.optString("business_id");
        String bType = requestData.optString("business_type");
        String type = requestData.optString("tran_type");
        ArrayList<JSONObject> loadedProdData = new ArrayList();

        for (int x = 0; x < ids.length(); x++) {
            //check if quantities are available and give an error if they
            //are not available
            String prodId = ids.optString(x);
            JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? AND BUSINESS_ID = ?", prodId, busId);
            loadedProdData.add(prodData);
            String parentProduct = prodData.optJSONArray("PRODUCT_PARENT").optString(0);
            Double noOfUnits = qtys.optDouble(x);
            double uSize = prodData.optJSONArray("PRODUCT_UNIT_SIZE").optDouble(0, 1);
            Double unitSize = prodData.optJSONArray("PRODUCT_UNIT_SIZE").optDouble(0, 1) == 0 ? 1 : uSize;
            Double unitsSold = noOfUnits * unitSize;
            double productTotalqty;
            if (parentProduct.isEmpty()) {
                productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optDouble(0);
                //no parent product
            } else {
                JSONObject parentProdData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? AND BUSINESS_ID = ?", parentProduct, busId);
                productTotalqty = parentProdData.optJSONArray("PRODUCT_QTY").optDouble(0);
            }

            if (unitsSold > productTotalqty && type.equals("0") && bType.equals("goods")) {
                try {
                    //send an error message
                    int prodIndex = prodData.optJSONArray("ID").toList().indexOf(prodId);
                    String prodName = prodData.optJSONArray("PRODUCT_NAME").optString(prodIndex);
                    JSONObject response = new JSONObject();
                    response.put("status", Message.FAIL);
                    response.put("reason", "Insufficient stock available for product '" + prodName + "' only " + productTotalqty + " available");
                    worker.setResponseData(response);
                    serv.messageToClient(worker);
                    return new Object[]{Message.FAIL,loadedProdData}; //consider this for services where stock is tracked
                    //not enough stock to process the sale
                } catch (JSONException ex) {
                    Logger.getLogger(PosSaleService.class.getName()).log(Level.SEVERE, null, ex);
                    return null;
                }
            }
        }
        return new Object[]{Message.SUCCESS,loadedProdData};
    }
    
    
    @Endpoint(name="transact",shareMethodWith = {"pos_admin_service","pos_middle_service"})
    public synchronized void transact(Server serv,ClientWorker worker) throws JSONException{
        Object[] quantityPreCondition = quantityPreCondition(serv, worker);
        ArrayList<JSONObject> loadedProdData;
        if(quantityPreCondition[0].equals(Message.FAIL)){
            return; //no need to continue it failed
        }
        else {
            loadedProdData = (ArrayList<JSONObject>) quantityPreCondition[1];
        }
        Object[] transData = doTransact(worker,loadedProdData);
        JSONObject response = new JSONObject();
        if(transData != null){
            response.put("status", transData[0]);
            response.put("reason",transData[1]);
        }
        response.put("server_time", new Date());
        worker.setResponseData(response);
        serv.messageToClient(worker);
    }
    
    private Object[] doTransact(ClientWorker worker,ArrayList<JSONObject> loadedProdData){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONArray ids = requestData.optJSONArray("product_ids");
        JSONArray qtys = requestData.optJSONArray("product_qtys");
        JSONArray discPrices = requestData.optJSONArray("discount_prices");
        String narration = requestData.optString("narration");
        String busId = requestData.optString("business_id");
        String bType = requestData.optString("business_type");
        String type = requestData.optString("tran_type");
        String tranFlag = requestData.optString("tran_flag");
        String userName = worker.getSession().getAttribute("username").toString();
        boolean allowDisc = getSetting("allow_discounts").equals("1");
        for (int x = 0; x < ids.length(); x++) {
            try {
                double discPrice = discPrices.optDouble(x);
                String prodId = ids.optString(x);
                String transId = new UniqueRandom(50).nextMixedRandom();
                JSONObject prodData = loadedProdData.get(x);
                double bp = prodData.optJSONArray("BP_UNIT_COST").optDouble(0);
                double realPrice = prodData.optJSONArray("SP_UNIT_COST").optDouble(0);
                double sp = allowDisc ? discPrice : realPrice;//return a different selling price incase of discount
                double tax = prodData.optJSONArray("TAX").optDouble(0);
                double comm = prodData.optJSONArray("COMMISSION").optDouble(0);
                //take care of shared products, deduct from the correct stock
                String parentProduct = prodData.optJSONArray("PRODUCT_PARENT").optString(0);
                double uSize = prodData.optJSONArray("PRODUCT_UNIT_SIZE").optDouble(0, 1);
                Double unitSize = prodData.optJSONArray("PRODUCT_UNIT_SIZE").optDouble(0, 1) == 0 ? 1 : uSize;
                //get the parent product available qty
                double productTotalqty;
                Double noOfUnits = qtys.optDouble(x);
                if (parentProduct.isEmpty()) {
                    productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optDouble(0);
                    //no parent product
                } else {
                    JSONObject parentProdData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? AND BUSINESS_ID = ?", parentProduct, busId);
                    productTotalqty = parentProdData.optJSONArray("PRODUCT_QTY").optDouble(0);
                }

                Double unitsSold = noOfUnits * unitSize;
                Double newQty = productTotalqty; //reduce the quantity, customer is buying stock
                Double cost = sp * noOfUnits;
                Double bPrice = bp * noOfUnits;
                Double tdiscPrice = discPrice*noOfUnits;
                Double profit = cost - bPrice;
                if (unitsSold > productTotalqty && type.equals("0") && bType.equals("goods")) {
                    continue; //consider this for services where stock is tracked
                    //not enough stock to process the sale
                } else if (type.equals("0")) {
                    newQty = productTotalqty - unitsSold;//reduce the quantity since customer is buying
                    narration = narration.equals("") ? "Sale to Customer" : narration;
                
                } else if (type.equals("1")) {
                    
                    String prevTransId = requestData.optString("previous_trans_id");
                    JSONObject data = db.query("SELECT * FROM POS_META_DATA WHERE SCOPE='reversed_sales' AND META_ID = '"+prevTransId+"'");
                    if(data.optJSONArray("META_ID").length() > 0 ){
                        //this sale has been reversed before so return an error
                        return new Object[]{Message.FAIL,"Transaction already reversed"};
                    }
                    
                    newQty = productTotalqty + noOfUnits; //increase the quantity if customer is returning stock
                    narration = narration.equals("") ? "Reversal of sale" : narration;
                    db.doInsert("POS_META_DATA",new String[]{"reversed_sales",prevTransId,"1","!NOW()"});
                    //profit = -profit;
                    //reverse tax,commission and discount too
                }
                
                db.doInsert("STOCK_DATA", new String[]{transId, busId, prodId, type, bPrice.toString(), cost.toString(),
                    unitsSold.toString(), profit.toString(), tranFlag, narration, "!NOW()", userName});
                
                if (tax > 0) {
                    Double taxValue = (tax / 100) * cost;
                    db.doInsert("TAX_DATA", new String[]{transId, userName, busId, prodId, taxValue.toString(), unitsSold.toString(), type, "!NOW()"});
                }

                if (comm > 0) { //track only if we have a value
                    Double commValue = comm * noOfUnits;
                    db.doInsert("COMMISSION_DATA", new String[]{transId, userName, busId, prodId, commValue.toString(), unitsSold.toString(), type, "!NOW()"});
                }

                if (allowDisc) {
                    Double discount = (realPrice - discPrice)*noOfUnits;
                    db.doInsert("DISCOUNT_DATA", new String[]{transId, userName, busId, prodId, discount.toString(), unitsSold.toString(), type, "!NOW()"});
                }
                
                if (parentProduct.isEmpty()) {
                    //no parent product 
                    db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "' WHERE ID='" + prodId + "' AND BUSINESS_ID='" + busId + "'");
                } else {
                    db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "' WHERE ID='" + parentProduct + "' AND BUSINESS_ID='" + busId + "'");
                }
                
            } catch (Exception ex) {
                Logger.getLogger(PosSaleService.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
        return new Object[]{Message.SUCCESS,"Transaction verified"};
    }
    
   
    
    
    //a sale updates stock_data,tax_data,comm_data and product_data
    
}
