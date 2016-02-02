
package com.quest.pos;

import com.quest.access.common.UniqueRandom;
import com.quest.access.common.io;
import com.quest.access.common.mysql.Database;
import com.quest.access.control.Server;
import com.quest.access.useraccess.Serviceable;
import com.quest.access.useraccess.services.Message;
import com.quest.access.useraccess.services.OpenDataService;
import com.quest.access.useraccess.services.annotations.Endpoint;
import com.quest.access.useraccess.services.annotations.WebService;
import com.quest.servlets.ClientWorker;
import java.util.ArrayList;
import java.util.Date;
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
       
    }
 
    
    private Object[] quantityPreCondition(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONArray ids = requestData.optJSONArray("product_ids");
        JSONArray qtys = requestData.optJSONArray("product_qtys");
        String bType = requestData.optString("business_type");
        String type = requestData.optString("tran_type");
        ArrayList<JSONObject> loadedProdData = new ArrayList();

        for (int x = 0; x < ids.length(); x++) {
            //check if quantities are available and give an error if they
            //are not available
            String prodId = ids.optString(x);
            JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ?", prodId);
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
                JSONObject parentProdData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ?", parentProduct);
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
        Object[] transData = doTransact(serv,worker);
        JSONObject response = new JSONObject();
        if(transData != null){
            response.put("status", transData[0]);
            response.put("reason",transData[1]);
        }
        response.put("server_time", new Date());
        worker.setResponseData(response);
        serv.messageToClient(worker);
    }
    
    private Object[] doTransact(Server serv,ClientWorker worker){
        JSONObject requestData = worker.getRequestData();
        String type = requestData.optString("tran_type");
        switch (type) {
            case "0":
                Object[] quantityPreCondition = quantityPreCondition(serv, worker);
                if (quantityPreCondition[0].equals(Message.FAIL)) {
                    return quantityPreCondition; //no need to continue it failed
                } else {
                    return decreaseStockTrans(worker,(ArrayList<JSONObject>) quantityPreCondition[1]);
                }
                
            case "1":
                return increaseStockTrans(worker);
        }
        return new Object[]{Message.FAIL, "Unknown transaction type"};
    }
    
    //this occurs during the normal selling process
    private Object[] decreaseStockTrans(ClientWorker worker,ArrayList<JSONObject> loadedProdData){
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        JSONArray ids = requestData.optJSONArray("product_ids");
        JSONArray qtys = requestData.optJSONArray("product_qtys");
        JSONArray prices = requestData.optJSONArray("prices");
        String narration = requestData.optString("narration");
        String tranFlag = requestData.optString("tran_flag");
        String type = requestData.optString("tran_type");
        String userName = worker.getSession().getAttribute("username").toString();
        boolean allowDisc = OpenDataService.getSetting("allow_discounts").equals("1");
        String transId = new UniqueRandom(50).nextMixedRandom();
        for (int x = 0; x < ids.length(); x++) {
            try {
                double price = prices.optDouble(x, 0);
                String prodId = ids.optString(x);
                JSONObject prodData = loadedProdData.get(x);
                double bp = prodData.optJSONArray("BP_UNIT_COST").optDouble(0);
                double realPrice = prodData.optJSONArray("SP_UNIT_COST").optDouble(0);
                double sp = allowDisc ? price : realPrice;//return a different selling price incase of discount
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
                    JSONObject parentProdData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? ", parentProduct);
                    productTotalqty = parentProdData.optJSONArray("PRODUCT_QTY").optDouble(0);
                }

                Double unitsSold = noOfUnits * unitSize;
               // Double newQty = productTotalqty; //reduce the quantity, customer is buying stock
                Double sPrice = sp * noOfUnits;
                Double bPrice = bp * noOfUnits;
                //Double tdiscPrice = discPrice*noOfUnits;
                Double profit = sPrice - bPrice;
                Double newQty = productTotalqty - unitsSold;//reduce the quantity since customer is buying
                narration = narration.equals("") ? "Sale to Customer" : narration;

                db.doInsert("STOCK_DATA", new String[]{transId, prodId, type, bPrice.toString(), sPrice.toString(),
                    unitsSold.toString(), profit.toString(), tranFlag, narration, "!NOW()", userName});

                if (tax > 0) {
                    Double taxValue = (tax / 100) * sPrice;
                    db.doInsert("TAX_DATA", new String[]{transId, userName,prodId, 
                        taxValue.toString(), unitsSold.toString(), type, "!NOW()"});
                }

                if (comm > 0) { //track only if we have a value
                    Double commValue = comm * noOfUnits;
                    db.doInsert("COMMISSION_DATA", new String[]{transId, userName,
                         prodId, commValue.toString(), unitsSold.toString(), type, "!NOW()"});
                }

                Double discount = (realPrice - sp) * noOfUnits;
                if (allowDisc && discount > 0) {
                    db.doInsert("DISCOUNT_DATA", new String[]{transId, userName, 
                        prodId, discount.toString(), unitsSold.toString(), type, "!NOW()"});
                }

                if (parentProduct.isEmpty()) {
                    //no parent product 
                    db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "'"
                            + " WHERE ID='" + prodId + "'");
                } else {
                    db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "'"
                            + " WHERE ID='" + parentProduct + "'");
                }

            } catch (Exception ex) {
                Logger.getLogger(PosSaleService.class.getName()).log(Level.SEVERE, null, ex);
                return new Object[]{Message.FAIL,ex.getMessage()};
            }
        }
        return new Object[]{Message.SUCCESS, transId};
    }
    
    //this occurs during the reversal of a sale
    private Object[] increaseStockTrans(ClientWorker worker){
        //get the previous transaction id and collect all
        //the previous transaction data and reverse that data
        //that is in stock_data,tax_data,comm_data and discount_data
        Database db = new Database(POS_DATA);
        JSONObject requestData = worker.getRequestData();
        String prevTransId = requestData.optString("previous_trans_id");
        String type = requestData.optString("tran_type");
        String narration = requestData.optString("narration");
        String tranFlag = requestData.optString("tran_flag");
        String userName = worker.getSession().getAttribute("username").toString();
        narration = narration.equals("") ? "Reversal of sale" : narration;
        JSONObject stockData = db.query("SELECT * FROM STOCK_DATA WHERE ID = ?",prevTransId);
        JSONObject taxData = db.query("SELECT * FROM TAX_DATA WHERE ID = ?",prevTransId);
        JSONObject commData = db.query("SELECT * FROM COMMISSION_DATA WHERE ID = ?",prevTransId);
        JSONObject discData = db.query("SELECT * FROM DISCOUNT_DATA WHERE ID = ?",prevTransId);
        JSONObject meta = db.query("SELECT * FROM POS_META_DATA WHERE SCOPE='reversed_sales' AND META_ID = '" + prevTransId + "'");
        boolean isReversed = meta.optJSONArray("META_ID").length() > 0;
        if (isReversed) {
            //this sale has been reversed before so return an error
            return new Object[]{Message.FAIL, "Transaction already reversed"};
        }
        
        String newTransId = new UniqueRandom(50).nextMixedRandom();
        for(int x = 0; x < stockData.optJSONArray("ID").length(); x++){
           
            Double bPrice = stockData.optJSONArray("STOCK_COST_BP").optDouble(x);
            Double sPrice = stockData.optJSONArray("STOCK_COST_SP").optDouble(x);
            Double unitsSold = stockData.optJSONArray("STOCK_QTY").optDouble(x);
            Double profit = stockData.optJSONArray("PROFIT").optDouble(x);
            String prodId = stockData.optJSONArray("PRODUCT_ID").optString(x);
            io.out("selling_price : "+sPrice);
            io.out("units_sold : "+unitsSold);
            db.doInsert("STOCK_DATA", new String[]{newTransId, prodId, type, bPrice.toString(), sPrice.toString(),
                unitsSold.toString(), profit.toString(), tranFlag, narration, "!NOW()", userName});

            JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ?", prodId);
            String parentProduct = prodData.optJSONArray("PRODUCT_PARENT").optString(x);

            Double productTotalqty;
            if (parentProduct.isEmpty()) {
                productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optDouble(0);
                //no parent product
            } else {
                JSONObject parentProdData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ?", parentProduct);
                productTotalqty = parentProdData.optJSONArray("PRODUCT_QTY").optDouble(0);
            }

            Double newQty = productTotalqty + unitsSold;
            if (parentProduct.isEmpty()) {
                //no parent product 
                db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "'"
                        + " WHERE ID='" + prodId + "'");
            } else {
                db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "'"
                        + " WHERE ID='" + parentProduct + "'");
            }

            boolean hasTax = !taxData.optJSONArray("ID").optString(x, "_none_").equals("_none_");
            boolean hasComm = !commData.optJSONArray("ID").optString(x, "_none_").equals("_none_");
            boolean hasDisc = !discData.optJSONArray("ID").optString(x, "_none_").equals("_none_");

            if (hasTax) {
                Double taxValue = taxData.optJSONArray("TAX_VALUE").optDouble(x);
                db.doInsert("TAX_DATA", new String[]{newTransId, userName,
                    prodId, taxValue.toString(), unitsSold.toString(), type, "!NOW()"});
            }

            if (hasComm) {
                Double commValue = commData.optJSONArray("COMM_VALUE").optDouble(x);
                db.doInsert("COMMISSION_DATA", new String[]{newTransId, userName,
                     prodId, commValue.toString(), unitsSold.toString(), type, "!NOW()"});
            }

            if (hasDisc) {
                Double discValue = discData.optJSONArray("DISC_VALUE").optDouble(x);
                db.doInsert("DISCOUNT_DATA", new String[]{newTransId, userName,
                    prodId, discValue.toString(), unitsSold.toString(), type, "!NOW()"});
            } 
        }
        
        db.doInsert("POS_META_DATA", new String[]{"reversed_sales", prevTransId, "1", "!NOW()"});
        return new Object[]{Message.SUCCESS, "Transaction reversed successfully"};
    }
}
