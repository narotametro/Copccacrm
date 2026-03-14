# SQL Migrations Checklist

## 📋 Required SQL Files to Run

Run these SQL files **in order** in your Supabase SQL Editor:

---

### 1️⃣ **FIX-STOCK-DEDUCTION-RLS.sql** ✅ FIXED
**Status:** Ready to run (error fixed)  
**Purpose:** Enables stock deduction when ANY user in your company makes a sale  
**What it fixes:** Stock wasn't decreasing because only the product creator could update it

**After running:**
- Make a test sale in Sales Hub
- Stock quantity should decrease automatically
- Check Stock History tab for the deduction entry

---

### 2️⃣ **LINK-SALES-HUB-TO-CRM-CUSTOMERS.sql** ✅ COMPLETED
**Status:** Already run successfully  
**Purpose:** Links Sales Hub customers to CRM Companies  
**What it fixes:** Customer Detail pages showing zero purchases

**Verify it worked:**
```sql
SELECT c.name as company_name, 
       shc.name as sales_customer_name,
       COUNT(sho.id) as order_count,
       SUM(sho.total_amount) as total_revenue
FROM companies c
LEFT JOIN sales_hub_customers shc ON shc.company_id = c.id
LEFT JOIN sales_hub_orders sho ON sho.customer_id = shc.id
WHERE c.name LIKE '%David%'
GROUP BY c.id, c.name, shc.name;
```

**If customer still shows zero purchases:**
- Check that sales were made **with customer selected** (not Walk-in)
- Customer name in CRM must match Sales Hub exactly
- Or email addresses must match

---

### 3️⃣ **ADD-COST-PRICE-TO-PRODUCTS.sql** ⏳ PENDING
**Status:** Not run yet  
**Purpose:** Adds cost_price column to enable COGS and Gross Profit tracking  
**What it enables:** 
- Money OUT (COGS) = Sum of (quantity × cost_price)
- Gross Profit = Total Sales - COGS
- Accurate profit margins per product

**After running:**
1. Go to Sales Hub → Products
2. Edit each product
3. Set accurate **Cost Price** (what you pay supplier)
4. Dashboard Money Flow will show accurate COGS

**Current state:** Dashboard shows TSh0 for COGS because cost_price column doesn't exist yet

---

### 4️⃣ **SET-DEFAULT-CURRENCY-TZS.sql** ✅ COMPLETED
**Status:** Already run successfully  
**Purpose:** Sets Tanzanian Shilling as default currency  
**Result:** All new records use TSh instead of USD

---

### 5️⃣ **ENABLE-ORDER-FILTERS.sql** ✅ COMPLETED
**Status:** Already run successfully  
**Purpose:** Creates categories and brands for Order History filters  
**Result:** 
- 5 categories created (Electronics, Home Appliances, etc.)
- 10 brands created (Samsung, LG, Sony, etc.)

**Next steps:**
1. Go to Sales Hub → Products
2. Edit each product
3. Assign Category and Brand
4. Filters will then work in Order History

---

## 🎯 Priority Order

### **Run NOW (Critical):**
1. ✅ **FIX-STOCK-DEDUCTION-RLS.sql** - Stock deduction not working
2. ⏳ **ADD-COST-PRICE-TO-PRODUCTS.sql** - COGS tracking shows TSh0

### **Already Done:**
3. ✅ LINK-SALES-HUB-TO-CRM-CUSTOMERS.sql
4. ✅ SET-DEFAULT-CURRENCY-TZS.sql
5. ✅ ENABLE-ORDER-FILTERS.sql

---

## 📊 What Each Fix Enables

| SQL File | Fixes | Enables |
|----------|-------|---------|
| FIX-STOCK-DEDUCTION-RLS | Stock not decreasing | Automatic inventory updates on sales |
| LINK-SALES-HUB-TO-CRM | Customers show zero purchases | Purchase history on customer pages |
| ADD-COST-PRICE-TO-PRODUCTS | Money OUT shows TSh0 | COGS tracking, Gross Profit calculation |
| SET-DEFAULT-CURRENCY-TZS | USD default currency | TSh default everywhere |
| ENABLE-ORDER-FILTERS | Empty filter dropdowns | Order filtering by brand/category |

---

## ✅ After Running All SQL:

### Frontend Changes (Already Live):
- ✅ TSh default currency
- ✅ Icons removed from Dashboard
- ✅ No more automatic logouts
- ✅ Order History filters coded and ready

### Manual Steps Remaining:
1. **Assign cost prices to products** (after running ADD-COST-PRICE-TO-PRODUCTS.sql)
2. **Assign categories/brands to products** (for Order History filters to work)
3. **Hard refresh browser** (Ctrl+F5) to see all changes

---

## 🔄 Verify Everything Works

### Test Stock Deduction:
```
1. Go to Sales Hub
2. Note current stock of a product (e.g. TV: 3200)
3. Make a sale of 1 unit
4. Check inventory → should show 3199
5. Check Stock History → should show deduction
```

### Test Customer Purchase Tracking:
```
1. Go to Customers
2. Open David Electronics (or any customer)
3. Should see their order history
4. Should see total purchases amount
5. Should see last purchase date
```

### Test COGS Tracking:
```
1. After running ADD-COST-PRICE-TO-PRODUCTS.sql
2. Edit products and set cost prices
3. Go to Dashboard → Money Flow section
4. Should see Cost of Goods Sold (not TSh0)
5. Should see Gross Profit = Sales - COGS
```

### Test Order History Filters:
```
1. After assigning categories/brands to products
2. Go to Sales Hub → Order History
3. Select a brand (e.g. Samsung)
4. Should filter to only orders with Samsung products
5. Combine filters (Brand + Category) to narrow results
```

---

## 🚨 Common Issues

### "Policy already exists" error
- ✅ **FIXED** - FIX-STOCK-DEDUCTION-RLS.sql now handles this

### Customer still shows zero purchases
- Check that sales were made **with customer selected** (not Walk-in)
- Names must match exactly: "David Electronics" in both CRM and Sales Hub
- Or email addresses must match

### COGS still shows TSh0
- Run ADD-COST-PRICE-TO-PRODUCTS.sql
- Then edit products to set actual cost prices

### Filters still show "All X" only
- Run ENABLE-ORDER-FILTERS.sql (if not done)
- Assign categories/brands to products
- Hard refresh browser

---

## 📝 Summary

**Run these 2 SQL files NOW:**
1. [FIX-STOCK-DEDUCTION-RLS.sql](FIX-STOCK-DEDUCTION-RLS.sql)
2. [ADD-COST-PRICE-TO-PRODUCTS.sql](ADD-COST-PRICE-TO-PRODUCTS.sql)

**Then:**
- Hard refresh browser (Ctrl+F5)
- Make a test sale to verify stock deduction
- Assign cost prices to products
- Assign categories/brands to products

**Everything else is already done!** 🎉
