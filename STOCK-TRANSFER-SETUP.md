# Stock Transfer System - Database Setup Guide

## Overview
The stock transfer system allows users to transfer inventory between locations (warehouse to POS, warehouse to warehouse, POS to POS) with automatic stock level updates, delivery note printing, and transfer history tracking.

## ⚠️ Important: Database Setup Required

The stock transfer system requires a **unified locations table**. Execute these SQL files in your Supabase SQL Editor **in this exact order**:

### Step 1: Create Unified Locations Table
**File:** `database-create-locations-table.sql`

This migration:
- ✅ Creates the new `locations` table with both POS and inventory types
- ✅ Automatically migrates existing data from `pos_locations` and `inventory_locations`
- ✅ Sets up RLS policies for multi-tenant security
- ✅ Adds proper indexes for performance
- ✅ Preserves all existing location data

Execute in Supabase SQL Editor:
```sql
-- Copy and paste the entire contents of database-create-locations-table.sql
```

### Step 2: Create Stock Transfer Tables
**File:** `database-stock-transfers.sql`

This migration:
- ✅ Creates `stock_transfers` table with auto-generated transfer numbers
- ✅ Creates `stock_transfer_items` table for line items
- ✅ Adds triggers for auto-numbering (ST-2026-0001 format)
- ✅ Adds triggers for automatic stock level updates on completion
- ✅ Creates `get_transfer_stats()` function for analytics
- ✅ Sets up complete RLS policies

Execute in Supabase SQL Editor:
```sql
-- Copy and paste the entire contents of database-stock-transfers.sql
```

## What Changed in the Application

### Settings Page (Locations Management)
- **Before:** Queried separate `pos_locations` and `inventory_locations` tables, then merged results
- **After:** Queries single unified `locations` table with type filtering
- **Benefits:** Simpler code, better performance, easier to maintain

### Stock Transfers Component
- Uses unified `locations` table for dropdown selection
- Enforces subscription plan limits (START: 1/1, GROW: 2/2, PRO: unlimited)
- Requires remarks field for transfer reasoning
- Tracks transfer day, date, and time with full timestamps
- Automatic stock updates when transfer is marked as "completed"

## Features Included

### Transfer Creation
- Select source and destination locations from all available locations
- Add multiple products with quantities
- Required remarks field for documentation
- Optional expected delivery date
- Validates plan limits before allowing creation

### Transfer Workflow
1. **Pending** - Transfer created but not yet approved
2. **In Transit** - Approved by user (stores approved_by and approved_at)
3. **Completed** - Received (stores received_by and received_at, updates stock levels)
4. **Cancelled** - Transfer cancelled

### Automatic Stock Updates
When a transfer is marked as "completed":
- ✅ Stock deducted from source location
- ✅ Stock added to destination location
- ✅ Records created in `stock_history` table
- ✅ Transaction uses `FOR UPDATE` lock to prevent race conditions

### Delivery Note Printing
Professional printable delivery note includes:
- Transfer number and status
- Day of week and full date/time
- From/To location details
- Items table with SKU, quantity, unit of measure
- Remarks section (highlighted)
- Signature boxes for sender, receiver, and driver
- Timestamp when note was generated

### Transfer History
- View all transfers in chronological order
- Filter by status with color-coded badges
- Each transfer shows:
  - Day of week (e.g., "Monday")
  - Full date and time
  - Source → Destination locations
  - Remarks (highlighted in blue)
  - Notes (if any)
  - Current status

## Subscription Plan Limits

The system enforces these limits based on active subscription:

| Plan | POS Locations | Inventory Locations |
|------|--------------|---------------------|
| START | 1 | 1 |
| GROW | 2 | 2 |
| PRO | Unlimited | Unlimited |

**Legacy plan names also supported:**
- `starter` → `start`
- `professional` → `pro`
- `enterprise` → `pro`

## Database Schema Summary

### `locations` table
```sql
- id (uuid, primary key)
- company_id (uuid, foreign key)
- name (varchar 255)
- type ('pos' or 'inventory')
- address (text)
- city (varchar 100)
- status ('active' or 'inactive')
- created_by (uuid)
- created_at, updated_at (timestamptz)
```

### `stock_transfers` table
```sql
- id (uuid, primary key)
- company_id (uuid, foreign key)
- transfer_number (varchar 50, auto-generated)
- from_location_id (uuid, foreign key)
- to_location_id (uuid, foreign key)
- status ('pending', 'in_transit', 'completed', 'cancelled')
- transfer_date (timestamptz)
- expected_delivery_date (timestamptz, optional)
- actual_delivery_date (timestamptz, auto-set on completion)
- notes (text)
- remarks (text, required)
- transfer_day (varchar 20, day of week)
- created_by (uuid, foreign key)
- approved_by (uuid, foreign key)
- approved_at (timestamptz)
- received_by (uuid, foreign key)
- received_at (timestamptz)
- created_at, updated_at (timestamptz)
```

### `stock_transfer_items` table
```sql
- id (uuid, primary key)
- transfer_id (uuid, foreign key)
- product_id (uuid, foreign key)
- quantity_requested (numeric)
- quantity_sent (numeric)
- quantity_received (numeric)
- product_name (varchar 255, snapshot)
- product_sku (varchar 100, snapshot)
- unit_of_measure (varchar 50)
- notes (text)
- created_at (timestamptz)
```

## Testing Checklist

After running the migrations:

1. ✅ Navigate to Settings → Locations
   - Verify all existing locations are visible
   - Try adding a new location (should work with unified table)

2. ✅ Navigate to Sales Hub → Stock Transfers
   - Create a new transfer between two locations
   - Add products and quantities
   - Enter remarks (required field)
   - Save the transfer

3. ✅ Test Transfer Workflow
   - Mark transfer as "In Transit"
   - Mark transfer as "Completed"
   - Verify stock levels updated correctly

4. ✅ Print Delivery Note
   - Click "Print" button on any transfer
   - Verify all information displays correctly
   - Check that remarks are highlighted

5. ✅ Test Plan Limits
   - Try creating transfers when at location limit
   - Should show error message with upgrade prompt

## Troubleshooting

### Error: "relation 'locations' does not exist"
**Solution:** Execute `database-create-locations-table.sql` first before running `database-stock-transfers.sql`

### Locations not showing up
**Solution:** Check that locations have `status = 'active'` in the database

### Stock not updating on completion
**Solution:** Verify that:
- `stock_levels` table exists
- `stock_history` table exists
- The trigger `trigger_update_stock_on_transfer` is active

### Transfer numbers not auto-generating
**Solution:** Check that the trigger `trigger_generate_transfer_number` is active

## Migration Safety

The `database-create-locations-table.sql` migration is **safe to run on existing databases**:
- Uses `CREATE TABLE IF NOT EXISTS` - won't fail if table already exists
- Migrates data with `ON CONFLICT DO NOTHING` - won't duplicate data
- Doesn't drop or modify existing tables
- Preserves all IDs and relationships

## Support

If you encounter issues:
1. Check Supabase SQL Editor error messages
2. Verify all migrations ran successfully
3. Check that RLS policies are enabled
4. Review the browser console for client-side errors

## Files Reference

- `database-create-locations-table.sql` - Unified locations table migration
- `database-stock-transfers.sql` - Stock transfer system tables and triggers
- `src/components/inventory/StockTransfers.tsx` - React component
- `src/pages/SalesHub.tsx` - Integration into Sales Hub
- `src/pages/Settings.tsx` - Updated to use unified locations table
