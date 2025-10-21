import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Trash2 } from 'lucide-react';

interface UserStats {
  totalBins: number;
  streakDays: number;
}

export const StatsDisplay = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchStats();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStats();
      } else {
        setStats(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!user || !stats) return null;

  return (
    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg z-10">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{stats.totalBins}</span>
        </div>
        
        {stats.streakDays > 0 && (
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-foreground">{stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};
