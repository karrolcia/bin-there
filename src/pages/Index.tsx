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
        <div className="space-y-6 fade-up-enter">
          <img 
            src={logo} 
            alt="bin there" 
            className="h-16 md:h-20 mx-auto" 
            style={{ animationDelay: '0.1s' }}
          />
          <p className="text-xl md:text-2xl font-normal text-foreground/80 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            You picked it up. Now bin it like a boss.
          </p>
          <p className="text-sm font-light italic text-muted-foreground" style={{ animationDelay: '0.3s' }}>
            Because nobody likes stepping in surprises
          </p>
        </div>

        <Button
          onClick={() => setShowMap(true)}
          className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium h-auto shadow-lg hover:shadow-xl transition-all duration-300 fade-up-enter"
          style={{ animationDelay: '0.4s' }}
        >
          Start Your Quest
        </Button>
      </div>
    </div>
  );
};

export default Index;
