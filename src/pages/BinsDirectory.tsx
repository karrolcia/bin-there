import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import citiesData from '../../data/cities.json';
import logo from '@/assets/logo.svg';

interface City {
  slug: string;
  name: string;
  country: string;
  countryName: string;
  lat: number;
  lng: number;
}

const cities = citiesData as City[];

const BinsDirectory = () => {
  const countries = useMemo(() => {
    const grouped: Record<string, { countryName: string; count: number }> = {};
    for (const city of cities) {
      if (!grouped[city.country]) {
        grouped[city.country] = { countryName: city.countryName, count: 0 };
      }
      grouped[city.country].count++;
    }
    return Object.entries(grouped)
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, []);

  useSEO({
    title: 'Find Public Bins Worldwide | bin there',
    description:
      'Browse public trash cans and waste bins across cities worldwide. Find the nearest bin in your city with walking directions.',
    path: '/bins',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="container mx-auto px-6 py-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12 fade-up-enter">
          <img src={logo} alt="bin there logo" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Find Public Bins Worldwide
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse {cities.length} cities across {countries.length} countries
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up-enter"
          style={{ animationDelay: '0.1s' }}
        >
          {countries.map((country) => (
            <Link key={country.slug} to={`/bins/${country.slug}/`}>
              <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {country.countryName}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {country.count} {country.count === 1 ? 'city' : 'cities'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BinsDirectory;
