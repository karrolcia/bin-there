import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { Footer } from '@/components/Footer';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import citiesData from '../../data/cities.json';
import cityStatsData from '../../data/city-stats.json';
import logo from '@/assets/logo.svg';

interface City {
  slug: string;
  name: string;
  country: string;
  countryName: string;
  lat: number;
  lng: number;
}

interface CityStatsEntry {
  totalBins: number;
  dogBins: number;
  densityPerKm2: number;
  nearbyCities: string[];
}

const cities = citiesData as City[];
const cityStats = cityStatsData as Record<string, CityStatsEntry>;

const CountryBins = () => {
  const { country } = useParams<{ country: string }>();

  const countryCities = useMemo(
    () =>
      cities
        .filter((c) => c.country === country)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [country],
  );

  const countryName = countryCities[0]?.countryName ?? '';

  useSEO({
    title: countryName
      ? `Public Bins in ${countryName} | bin there`
      : 'Country Not Found | bin there',
    description: countryName
      ? `Find public trash cans across ${countryCities.length} cities in ${countryName}. Walking directions to the nearest bin.`
      : 'The country you are looking for was not found.',
    path: `/bins/${country ?? ''}`,
  });

  if (countryCities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <header className="container mx-auto px-6 py-6">
          <Link to="/bins/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Countries
            </Button>
          </Link>
        </header>
        <main className="container mx-auto px-6 py-12 max-w-3xl text-center">
          <img src={logo} alt="bin there" className="h-20 mx-auto mb-6 opacity-50" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Country Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We don't have bin data for this country yet.
          </p>
          <Link to="/bins/">
            <Button>Browse All Countries</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="container mx-auto px-6 py-6">
        <Link to="/bins/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            All Countries
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 fade-up-enter">
          <Link to="/" className="hover:text-foreground transition-colors">
            bin there
          </Link>
          <span>/</span>
          <Link to="/bins/" className="hover:text-foreground transition-colors">
            Bins
          </Link>
          <span>/</span>
          <span className="text-foreground">{countryName}</span>
        </nav>

        <div className="text-center mb-12 fade-up-enter">
          <img src={logo} alt="bin there logo" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Public Bins in {countryName}
          </h1>
          <p className="text-lg text-muted-foreground">
            {countryCities.length} {countryCities.length === 1 ? 'city' : 'cities'} with
            mapped bins
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-up-enter"
          style={{ animationDelay: '0.1s' }}
        >
          {countryCities.map((city) => {
            const stats = cityStats[city.slug];
            return (
              <Link key={city.slug} to={`/bins/${country}/${city.slug}/`}>
                <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <h2 className="text-lg font-semibold text-foreground">{city.name}</h2>
                  </div>
                  {stats ? (
                    <p className="text-sm text-muted-foreground">
                      {stats.totalBins.toLocaleString()} bins
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">View bins</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CountryBins;
