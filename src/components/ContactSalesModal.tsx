import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Mail, Building, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSalesModal = ({ isOpen, onClose }: ContactSalesModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create email body
    const subject = `Sales Inquiry from ${formData.name}`;
    const body = `
Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Phone: ${formData.phone}

Message:
${formData.message}
    `.trim();

    // Open mailto with pre-filled data
    const mailtoLink = `mailto:sales@copcca.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast.success('Opening your email client...');
    
    // Reset form and close modal
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Sales" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={User}
            required
          />

          <Input
            type="email"
            label="Email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={Mail}
            required
          />

          <Input
            type="text"
            label="Company"
            placeholder="ACME Inc."
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            icon={Building}
            required
          />

          <Input
            type="tel"
            label="Phone"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            icon={Phone}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <MessageSquare className="inline mr-2" size={16} />
            Message
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all min-h-[120px]"
            placeholder="Tell us about your needs..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
          <Button type="submit" className="w-full">
            Send Inquiry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
