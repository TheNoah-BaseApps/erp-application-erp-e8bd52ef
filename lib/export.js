export async function exportToCSV(data, filename) {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
}

export async function exportToPDF(data, filename, title) {
  try {
    // This is a placeholder for PDF export functionality
    // In production, you would use a library like jsPDF
    console.log('PDF export not yet implemented', { data, filename, title });
    
    // For now, we'll export as CSV
    return exportToCSV(data, filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
}

export function prepareProductsForExport(products) {
  return products.map(product => ({
    'Product Code': product.product_code || '',
    'Product Name': product.product_name || '',
    'Category': product.product_category || '',
    'Brand': product.brand || '',
    'Unit': product.unit || '',
    'Current Stock': product.current_stock || 0,
    'Critical Stock Level': product.critical_stock_level || 0,
    'Unit Cost': product.unit_cost || 0,
    'Selling Price': product.selling_price || 0,
    'Status': product.status || '',
    'Created At': product.created_at ? new Date(product.created_at).toLocaleDateString() : ''
  }));
}

export function prepareCustomersForExport(customers) {
  return customers.map(customer => ({
    'Customer Code': customer.customer_code || '',
    'Customer Name': customer.customer_name || '',
    'Contact Person': customer.contact_person || '',
    'Email': customer.email || '',
    'Telephone': customer.telephone_number || '',
    'City/District': customer.city_or_district || '',
    'Country': customer.country || '',
    'Current Balance': customer.current_balance || 0,
    'Balance Risk Limit': customer.balance_risk_limit || 0,
    'Payment Terms (Days)': customer.payment_terms_limit || 0,
    'Status': customer.status || '',
    'Created At': customer.created_at ? new Date(customer.created_at).toLocaleDateString() : ''
  }));
}

export function prepareInventoryForExport(transactions) {
  return transactions.map(transaction => ({
    'Transaction Date': transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString() : '',
    'Product Code': transaction.product_code || '',
    'Product Name': transaction.product_name || '',
    'Transaction Type': transaction.transaction_type || '',
    'Quantity': transaction.quantity || 0,
    'Reference Number': transaction.reference_number || '',
    'Notes': transaction.notes || '',
    'Created At': transaction.created_at ? new Date(transaction.created_at).toLocaleString() : ''
  }));
}

export function prepareCustomerTransactionsForExport(transactions) {
  return transactions.map(transaction => ({
    'Transaction Date': transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString() : '',
    'Customer Code': transaction.customer_code || '',
    'Customer Name': transaction.customer_name || '',
    'Transaction Type': transaction.transaction_type || '',
    'Amount': transaction.amount || 0,
    'Reference Number': transaction.reference_number || '',
    'Notes': transaction.notes || '',
    'Created At': transaction.created_at ? new Date(transaction.created_at).toLocaleString() : ''
  }));
}