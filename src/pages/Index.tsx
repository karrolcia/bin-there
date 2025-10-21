import { useState } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return <Map />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-6 fade-up-enter">
          <h1 className="text-6xl md:text-7xl font-medium text-foreground tracking-tight" style={{ animationDelay: '0.1s' }}>
            bin there
          </h1>
          <p className="text-xl md:text-2xl font-normal text-foreground/80 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Every bin is a small step toward a greener world
          </p>
          <p className="text-sm font-light italic text-muted-foreground" style={{ animationDelay: '0.3s' }}>
            Ready to make a difference?
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
