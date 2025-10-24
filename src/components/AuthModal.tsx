import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { trackAuthEvent } from '@/utils/activityTracker';
import logo from '@/assets/logo.svg';

// Validation schema with strong password requirements
const authSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255, 'Email too long'),
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .max(72, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal = ({ open, onClose, onSuccess }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const result = authSchema.safeParse({ email, password });
      
      if (!result.success) {
        const firstError = result.error.errors[0];
        toast({
          variant: "destructive",
          title: "Invalid input",
          description: firstError.message,
        });
        setLoading(false);
        return;
      }

      const validatedData = result.data;

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You're all set. Start binning!",
        });
        
        // Track signup
        trackAuthEvent('signup');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Ready to make a difference?",
        });
        
        // Track login
        trackAuthEvent('login');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      // Log specific error for debugging but show generic message to user
      console.error(isSignUp ? 'Sign up error:' : 'Sign in error:', error.message, error.code);
      
      // Generic error messages to prevent account enumeration
      let clientMessage = 'Invalid email or password. Please check your credentials and try again.';
      
      if (isSignUp) {
        clientMessage = 'Unable to create account. Please try again or contact support if the problem persists.';
      }
      
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: clientMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="spring-enter bg-card border-border max-w-md">
        <div className="space-y-6 py-4">
          <img src={logo} alt="bin there" className="h-10 mx-auto" />
          
          <DialogTitle className="text-2xl font-medium text-center text-foreground">
            {isSignUp ? 'Join the Movement' : 'Welcome Back'}
          </DialogTitle>
          
          <DialogDescription className="text-center text-muted-foreground">
            {isSignUp 
              ? 'Track your impact. Build your streak. Keep streets clean.' 
              : 'Sign in to see your stats and continue your streak.'}
          </DialogDescription>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                At least 10 characters with uppercase, number, and special character
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
