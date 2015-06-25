/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.quest.pos;

import com.quest.access.common.mysql.Database;
import com.quest.access.control.Server;
import com.quest.access.useraccess.Serviceable;
import com.quest.access.useraccess.services.Message;
import com.quest.access.useraccess.services.annotations.Endpoint;
import com.quest.access.useraccess.services.annotations.WebService;
import com.quest.servlets.ClientWorker;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.logging.Level;
import java.util.logging.Logger;

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
    
    @Endpoint(name="transact",shareMethodWith = {"pos_admin_service"})
    public synchronized void transact(Server serv,ClientWorker worker){
        Database db = new Database(POS_DATA, worker.getSession());
        JSONObject requestData = worker.getRequestData();
        JSONArray ids = requestData.optJSONArray("product_ids");
        JSONArray qtys = requestData.optJSONArray("product_qtys");
        String narration = requestData.optString("narration");
        String busId = requestData.optString("business_id");
        String bType = requestData.optString("business_type");
        String type = requestData.optString("tran_type");
        String tranFlag = requestData.optString("tran_flag");
        String userName = worker.getSession().getAttribute("username").toString();
        for (int x = 0; x < ids.length(); x++) {
            try {
                String prodId = ids.optString(x);
                JSONObject prodData = db.query("SELECT * FROM PRODUCT_DATA WHERE ID = ? AND BUSINESS_ID = ?", prodId,busId);
                double bp = prodData.optJSONArray("BP_UNIT_COST").optDouble(0);
                double sp = prodData.optJSONArray("SP_UNIT_COST").optDouble(0);
                double tax = prodData.optJSONArray("TAX").optDouble(0);
                double comm = prodData.optJSONArray("COMMISSION").optDouble(0);
                String currentQty = qtys.optString(x);
                
                int productTotalqty = prodData.optJSONArray("PRODUCT_QTY").optInt(0);
                int newQty = productTotalqty - Integer.parseInt(currentQty); //reduce the quantity, customer is buying stock
                Double cost = sp * Integer.parseInt(currentQty);
                Double bPrice = bp * Integer.parseInt(currentQty);
                Double profit = cost - bPrice;
                if (Integer.parseInt(currentQty) > productTotalqty && type.equals("0") && bType.equals("goods")) {
                    continue; //consider this for services where stock is tracked
                    //not enough stock to process the sale
                } 
                else if (type.equals("0")) {
                    narration = narration.equals("") ? "Sale to Customer" : narration;
                    db.doInsert("STOCK_DATA", new String[]{busId, prodId, type, bPrice.toString(), cost.toString(), currentQty, profit.toString(),tranFlag, narration, "!NOW()",userName});
                    //add tax and commissions
                    if(tax > 0) {
                        Double taxValue = (tax / 100) * cost;
                        db.doInsert("TAX_DATA", new String[]{userName, busId, prodId, taxValue.toString(),currentQty, "!NOW()"});
                    }

                    if(comm > 0) { //track only if we have a value
                        Double commValue = (comm / 100) * cost;
                        db.doInsert("COMMISSION_DATA", new String[]{userName, busId, prodId, commValue.toString(),currentQty, "!NOW()"});
                    }
                }
                else if (type.equals("1")) {
                    newQty = productTotalqty + Integer.parseInt(currentQty); //increase the quantity if customer is returning stock
                    narration = narration.equals("") ? "Reversal of sale" : narration;
                    profit = -profit;
                    db.doInsert("STOCK_DATA", new String[]{busId, prodId, type, bPrice.toString(), cost.toString(), currentQty, profit.toString(),tranFlag, narration, "!NOW()",userName});
                }
                db.execute("UPDATE PRODUCT_DATA SET PRODUCT_QTY='" + newQty + "' WHERE ID='" + prodId + "' AND BUSINESS_ID='"+busId+"'");
            } catch (Exception ex) {
                Logger.getLogger(PosSaleService.class.getName()).log(Level.SEVERE, null, ex);
                ex.printStackTrace();
            }
        }
       
        worker.setResponseData(Message.SUCCESS);
        serv.messageToClient(worker);
    }
    
}
