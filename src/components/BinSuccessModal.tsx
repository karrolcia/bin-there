import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Flame, Trash2 } from 'lucide-react';
import logo from '@/assets/logo.svg';

interface BinSuccessModalProps {
  open: boolean;
  onClose: () => void;
  totalBins?: number;
  streakDays?: number;
}

export const BinSuccessModal = ({ open, onClose, totalBins, streakDays }: BinSuccessModalProps) => {
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
          
          {totalBins !== undefined && totalBins > 0 && (
            <div className="flex items-center justify-center gap-6 py-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Trash2 className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">{totalBins} bin{totalBins !== 1 ? 's' : ''}</span>
              </div>
              
              {streakDays !== undefined && streakDays > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-foreground">{streakDays} day{streakDays !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
          
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
