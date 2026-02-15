import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface PrintableInvoiceProps {
  invoice: {
    id: string;
    invoice_number: string;
    companies?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    total_amount: number;
    paid_amount: number;
    balance: number;
    due_date: string;
    status: string;
    created_at: string;
    notes?: string;
    payment_terms?: string;
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    line_total: number;
  }>;
  businessInfo?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    tin?: string;
  };
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoice,
  items = [],
  businessInfo = {
    name: 'COPCCA CRM',
    address: 'Business Address',
    city: 'City',
    country: 'Country',
    phone: '+255 XXX XXX XXX',
    email: 'info@copcca.com',
    tin: '123456789'
  }
}) => {
  const { formatCurrency: formatCurrencyFn } = useCurrency();

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const taxRate = 0.18; // 18% VAT for Tanzania
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <div className="printable-invoice">
      <style>{`
        .printable-invoice {
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f4f4;
          padding: 20px;
        }

        .invoice-box {
          width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #ccc;
          background: #fff;
          box-sizing: border-box;
        }

        .top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          align-items: flex-start;
        }

        .business {
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-line;
        }

        .business strong {
          font-size: 16px;
          color: #4a76c5;
        }

        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #4a76c5;
          text-align: right;
        }

        .invoice-details {
          margin-top: 10px;
        }

        .invoice-details table {
          border: 1px solid #000;
          border-collapse: collapse;
          margin-left: auto;
        }

        .invoice-details th,
        .invoice-details td {
          border: 1px solid #000;
          padding: 6px 12px;
          text-align: left;
          font-size: 12px;
        }

        .invoice-details th {
          background: #d9e1f2;
          font-weight: bold;
        }

        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .main-table th {
          background: #d9e1f2;
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
        }

        .main-table td {
          border: 1px solid #000;
          padding: 8px;
          font-size: 12px;
        }

        .right {
          text-align: right;
        }

        .bill-to {
          margin-top: 20px;
          width: 50%;
        }

        .bill-to table {
          width: 100%;
          border-collapse: collapse;
        }

        .bill-to th,
        .bill-to td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }

        .bill-to th {
          background: #d9e1f2;
          font-weight: bold;
          font-size: 12px;
        }

        .total-row td {
          font-weight: bold;
          font-size: 14px;
          background: #f8f9fa;
        }

        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .payment-info {
          margin-top: 30px;
          padding: 15px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          font-size: 11px;
        }

        .payment-info h4 {
          margin: 0 0 10px 0;
          font-size: 13px;
          font-weight: bold;
        }

        .payment-methods {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .payment-method {
          flex: 1;
          text-align: center;
          padding: 8px;
          border: 1px solid #dee2e6;
          background: white;
          font-size: 11px;
        }

        @media print {
          .printable-invoice {
            background: none;
            padding: 0;
          }
          .invoice-box {
            border: none;
            box-shadow: none;
          }
          @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
          }
        }
      `}</style>

      <div className="invoice-box">
        <div className="top">
          <div className="business">
            <strong>{businessInfo.name}</strong><br />
            {businessInfo.address && `${businessInfo.address}`}<br />
            {(businessInfo.city || businessInfo.country) && `${businessInfo.city || ''}${businessInfo.city && businessInfo.country ? ', ' : ''}${businessInfo.country || ''}`}<br />
            Phone: {businessInfo.phone}<br />
            Email: {businessInfo.email}<br />
            {businessInfo.tin && `TIN: ${businessInfo.tin}`}
          </div>

          <div>
            <div className="invoice-title">INVOICE</div>
            <div className="invoice-details">
              <table>
                <tbody>
                  <tr>
                    <th>Invoice #</th>
                    <td>{invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <th>Due Date</th>
                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bill-to">
          <table>
            <tbody>
              <tr>
                <th>BILL TO</th>
              </tr>
              <tr>
                <td>
                  {invoice.companies?.name || 'Customer Name'}<br />
                  {invoice.companies?.address || 'Customer Address'}<br />
                  {invoice.companies?.phone && `Phone: ${invoice.companies.phone}`}<br />
                  {invoice.companies?.email && `Email: ${invoice.companies.email}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <table className="main-table">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th className="right">QTY</th>
              <th className="right">UNIT PRICE</th>
              <th className="right">DISCOUNT</th>
              <th className="right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.description}</td>
                <td className="right">{item.quantity}</td>
                <td className="right">{formatCurrencyFn(item.unit_price)}</td>
                <td className="right">{formatCurrencyFn(item.discount)}</td>
                <td className="right">{formatCurrencyFn(item.line_total)}</td>
              </tr>
            )) : (
              <tr>
                <td>Service/Products</td>
                <td className="right">1</td>
                <td className="right">{formatCurrencyFn(invoice.total_amount)}</td>
                <td className="right">{formatCurrencyFn(0)}</td>
                <td className="right">{formatCurrencyFn(invoice.total_amount)}</td>
              </tr>
            )}

            {/* Subtotal */}
            <tr>
              <td colSpan={4} className="right"><strong>Subtotal:</strong></td>
              <td className="right">{formatCurrencyFn(subtotal || invoice.total_amount)}</td>
            </tr>

            {/* Tax */}
            <tr>
              <td colSpan={4} className="right">VAT (18%):</td>
              <td className="right">{formatCurrencyFn(taxAmount || (invoice.total_amount * taxRate))}</td>
            </tr>

            {/* Total */}
            <tr className="total-row">
              <td colSpan={4} className="right"><strong>TOTAL:</strong></td>
              <td className="right">{formatCurrencyFn(total || (invoice.total_amount * (1 + taxRate)))}</td>
            </tr>

            {/* Paid Amount */}
            {invoice.paid_amount > 0 && (
              <tr>
                <td colSpan={4} className="right">Paid Amount:</td>
                <td className="right">{formatCurrencyFn(invoice.paid_amount)}</td>
              </tr>
            )}

            {/* Balance Due */}
            {invoice.balance > 0 && (
              <tr className="total-row">
                <td colSpan={4} className="right"><strong>BALANCE DUE:</strong></td>
                <td className="right">{formatCurrencyFn(invoice.balance)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Payment Information */}
        <div className="payment-info">
          <h4>Payment Information</h4>
          <div className="payment-methods">
            <div className="payment-method">
              <strong>M-Pesa:</strong><br />
              Paybill: 123456<br />
              Account: {invoice.invoice_number}
            </div>
            <div className="payment-method">
              <strong>Bank Transfer:</strong><br />
              Account: 1234567890<br />
              Bank: CRDB Bank
            </div>
            <div className="payment-method">
              <strong>Cash Payment:</strong><br />
              Accepted at office<br />
              Mon-Fri, 8AM-5PM
            </div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '11px' }}>
            <strong>Payment Terms:</strong> {invoice.payment_terms || 'Due within 30 days'}<br />
            <strong>Note:</strong> {invoice.notes || 'Thank you for your business!'}
          </p>
        </div>

        <div className="footer">
          Thank you for your business!<br />
          For questions, contact: {businessInfo.email}<br />
          <small>Generated by COPCCA CRM - {new Date().toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;