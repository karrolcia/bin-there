import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.svg';

interface BinSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export const BinSuccessModal = ({ open, onClose }: BinSuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="spring-enter bg-card border-border">
        <div className="text-center space-y-6 py-6">
          <img src={logo} alt="bin there" className="h-12 mx-auto" />
          
          <div className="bounce-enter mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-success" strokeWidth={2.5} />
          </div>
          
          <DialogTitle className="text-2xl font-medium text-foreground">
            Nice work!
          </DialogTitle>
          
          <DialogDescription className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Clean streets. Happy neighbors. You did that.
          </DialogDescription>
          
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 h-auto text-base"
          >
            Find Another Bin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
