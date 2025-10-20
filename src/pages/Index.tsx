import { useState } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import dogHero from '@/assets/dog-hero.png';

const Index = () => {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              bin there 🐕
            </h1>
            <Button variant="outline" onClick={() => setShowMap(false)}>
              Back to Home
            </Button>
          </div>
          <Map />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-8">
          {/* Logo */}
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            bin there 🐕
          </h1>
          
          {/* Hero Image */}
          <div className="flex justify-center">
            <img 
              src={dogHero} 
              alt="Happy dog with poop bag" 
              className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-lg"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Never Walk Around with a Poop Bag Again
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Find the nearest trash can instantly. Because your walk should be enjoyable, 
              not a search mission! 🎯
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button
              onClick={() => setShowMap(true)}
              size="lg"
              className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-accent-foreground shadow-lg text-xl px-12 py-8 h-auto rounded-2xl transform transition-all hover:scale-105"
            >
              🚨 Poop Emergency!
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="font-semibold text-lg mb-2">Find Nearest Bin</h3>
              <p className="text-muted-foreground text-sm">
                Instantly locate the closest trash can to your location
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="font-semibold text-lg mb-2">Walking Route</h3>
              <p className="text-muted-foreground text-sm">
                Get the best walking path with distance estimation
              </p>
            </div>
            <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Quick & Easy</h3>
              <p className="text-muted-foreground text-sm">
                One tap to solve your poop emergency situation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
