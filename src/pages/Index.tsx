import { useState } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return <Map />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-semibold text-foreground tracking-tight">
            bin there
          </h1>
          <p className="text-xl md:text-2xl font-light text-muted-foreground">
            Find the nearest trash can
          </p>
        </div>

        <Button
          onClick={() => setShowMap(true)}
          className="bg-foreground hover:bg-foreground/90 text-background px-8 py-6 text-base font-medium h-auto"
        >
          Bin It
        </Button>
      </div>
    </div>
  );
};

export default Index;
