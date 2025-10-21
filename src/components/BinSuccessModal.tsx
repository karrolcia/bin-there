import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface BinSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export const BinSuccessModal = ({ open, onClose }: BinSuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="spring-enter bg-gradient-to-b from-white to-green-50/30 border-border/50">
        <div className="text-center space-y-6 py-6">
          <div className="bounce-enter mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={2.5} />
          </div>
          
          <h2 className="text-3xl font-medium text-foreground">
            Nice work!
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
            You just made the world a little greener. Every bin counts. 🌱
          </p>
          
          <p className="text-sm text-muted-foreground italic">
            Together, we're building better habits
          </p>
          
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 h-auto text-base"
          >
            Find Another
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
