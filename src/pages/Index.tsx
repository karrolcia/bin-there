import { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/AuthModal';
import { StatsDisplay } from '@/components/StatsDisplay';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import logo from '@/assets/logo.svg';

const Index = () => {
  const [showMap, setShowMap] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set up auth listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (showMap) {
    return (
      <>
        <StatsDisplay />
        <Map />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col">
        <header className="fixed top-0 right-0 p-6 z-20">
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors fade-up-enter"
            aria-label="Sign in to track your environmental impact"
          >
            Sign in
          </button>
        </header>
        
        <div className="flex-1 flex items-center justify-center pb-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-8 fade-up-enter">
            <img 
              src={logo} 
              alt="bin there" 
              className="h-28 md:h-36 mx-auto" 
              style={{ animationDelay: '0s' }}
            />
          <p className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Find a bin. Walk on happy.
          </p>
        </div>

        <Button
          onClick={() => setShowMap(true)}
          className="pulse-hover bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base font-medium h-auto shadow-lg hover:shadow-xl transition-all duration-300 fade-up-enter"
          style={{ animationDelay: '0.2s' }}
          aria-label="Start finding nearby trash cans"
        >
          Bin It
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
      <Footer />
    </>
  );
};

export default Index;
