import { useState } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.svg';

const Index = () => {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return <Map />;
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

        <Button
          onClick={() => setShowMap(true)}
          className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium h-auto shadow-lg hover:shadow-xl transition-all duration-300 fade-up-enter"
          style={{ animationDelay: '0.3s' }}
        >
          Bin It
        </Button>
      </div>
    </div>
  );
};

export default Index;
