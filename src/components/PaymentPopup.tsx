import React from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaymentPopupProps {
  companyName: string;
  daysOverdue: number;
  amount: number;
  onClose?: () => void;
}

export const PaymentPopup: React.FC<PaymentPopupProps> = ({
  companyName,
  daysOverdue,
  amount,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-4 border-red-500 animate-pulse-slow">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Payment Required!</h2>
                <p className="text-sm text-white/90">Subscription Expired</p>
              </div>
            </div>
            {!onClose && (
              <div className="p-2 bg-white/20 rounded-full">
                <X size={20} className="opacity-50" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-lg text-slate-700 mb-2">
              Dear <strong>{companyName}</strong>,
            </p>
            <p className="text-slate-600">
              Your COPCCA CRM subscription has expired and is currently{' '}
              <strong className="text-red-600">{daysOverdue} days overdue</strong>.
            </p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700 mb-2">Outstanding Amount</p>
            <p className="text-4xl font-bold text-red-600">₦{(amount / 1000).toFixed(0)}K</p>
            <p className="text-xs text-red-600 mt-1">Per Month</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p>All user access is restricted</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p>Data will be deleted after 30 days</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p>Contact admin to restore access</p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              icon={CreditCard}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => {
                window.location.href = 'mailto:billing@copcca.com?subject=Payment for ' + companyName;
              }}
            >
              Contact Billing Team
            </Button>
            <p className="text-xs text-center text-slate-500">
              Email: <a href="mailto:billing@copcca.com" className="text-primary-600 hover:underline">billing@copcca.com</a>
              <br />
              Phone: +234 800 COPCCA CRM
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 rounded-b-2xl border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            This popup cannot be closed until payment is confirmed by admin.
          </p>
        </div>
      </div>
    </div>
  );
};
