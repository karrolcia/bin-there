import { useState } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { StatsDisplay } from '@/components/StatsDisplay';
import { LogIn } from 'lucide-react';
import logo from '@/assets/logo.svg';

const Index = () => {
  const [showMap, setShowMap] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (showMap) {
    return (
      <>
        <StatsDisplay />
        <Map />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-8 fade-up-enter">
          <img 
            src={logo} 
            alt="bin there" 
            className="h-28 md:h-36 mx-auto" 
            style={{ animationDelay: '0s' }}
          />
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Find a bin. Walk on happy.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground" style={{ animationDelay: '0.2s' }}>
              Simple. Fast. Clean.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={() => setShowMap(true)}
            className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium h-auto shadow-lg hover:shadow-xl transition-all duration-300 fade-up-enter"
            style={{ animationDelay: '0.3s' }}
          >
            Bin It
          </Button>
          
          <Button
            onClick={() => setShowAuthModal(true)}
            variant="outline"
            className="fade-up-enter flex items-center gap-2"
            style={{ animationDelay: '0.4s' }}
          >
            <LogIn className="w-4 h-4" />
            Sign In to Track Impact
          </Button>
        </div>
      </div>
      
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setShowMap(true);
        }}
      />
    </div>
  );
};

export default Index;
