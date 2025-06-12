# Fix for "Document PDF - conversion alternative" Error on Map

## Problem
The text "Document PDF - conversion alternative" with an amount of 12,289.54€ was appearing on the reconquest map as a competitor product. This is actually an error message from failed PDF conversions being treated as a product name.

## Root Cause
1. When PDF conversion fails, the server creates a placeholder image with the text "Document PDF - conversion alternative"
2. The OCR prompt instructs Claude to extract this text as product information
3. This error text was being marked as a competitor product and displayed on the map

## Solutions Implemented

### 1. Dashboard Store Filtering (src/store/dashboardStore.ts)

#### a) Filter in `addInvoice` method (lines 225-243)
- Added check for "conversion alternative" in product designation, reference, and description
- Products with this text are excluded from the invoice before storage
- Added logging to track excluded products

#### b) Filter in `getCustomerReconquestLocations` method (lines 362-375)
- Added filter to exclude conversion error products when calculating competitor amounts
- Prevents these errors from appearing on the reconquest map

#### c) Filter in `generateOpportunitiesFromInvoices` method (lines 601-608)
- Added same filtering logic to prevent errors in opportunity generation

#### d) Filter in `extractCompetitorProducts` method (lines 635-658)
- Already had filtering in place for competitor product extraction

## Testing

### 1. Created test script: `test-conversion-filter.mjs`
- Tests that conversion error products are filtered out
- Verifies competitor amounts are calculated correctly
- Confirms error brands don't appear in competitor lists

### 2. Created inspection tool: `inspect-local-storage.html`
- HTML page to inspect localStorage data
- Shows any conversion error products currently stored
- Provides button to clean existing data

## How to Use the Fix

### For New Invoices
The fix will automatically filter out conversion error products when new invoices are added.

### For Existing Data
1. Open `inspect-local-storage.html` in a browser
2. Click "Inspect Storage" to see if there are any conversion errors
3. Click "Clear Conversion Errors" to remove them from stored data
4. Refresh the main application

## Prevention
To prevent this issue in the future:
1. Install Ghostscript for better PDF conversion: `brew install ghostscript`
2. Configure iLovePDF API keys properly
3. The filtering will catch any remaining conversion errors

## Verification
After applying the fix:
- The map should no longer show "Document PDF - conversion alternative" as a product
- The amount 12,289.54€ should not appear as a competitor product
- Customer reconquest locations should only show real competitor products