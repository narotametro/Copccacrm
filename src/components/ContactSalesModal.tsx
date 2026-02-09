import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Mail } from 'lucide-react';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSalesModal = ({ isOpen, onClose }: ContactSalesModalProps) => {
  const handleContactSales = () => {
    window.location.href = 'mailto:sales@copcca.com';
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Sales" size="sm">
      <div className="text-center py-6">
        <Mail className="mx-auto mb-4 text-primary-500" size={48} />
        <p className="text-slate-600 mb-6">
          Ready to take your business to the next level? Get in touch with our sales team.
        </p>
        <Button onClick={handleContactSales} className="w-full">
          sales@copcca.com
        </Button>
      </div>
    </Modal>
  );
};
