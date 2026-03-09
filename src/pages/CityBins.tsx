import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { Footer } from '@/components/Footer';
import { ArrowLeft, MapPin, Trash2, Dog, BarChart3 } from 'lucide-react';
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

function buildFaqItems(cityName: string, stats: CityStatsEntry | undefined) {
  const totalBins = stats?.totalBins ?? 0;
  return [
    {
      question: `How many public bins are there in ${cityName}?`,
      answer: totalBins > 0
        ? `We have mapped ${totalBins.toLocaleString()} public bins in ${cityName}. This includes general waste bins${stats?.dogBins && stats.dogBins > 0 ? ` and ${stats.dogBins.toLocaleString()} dog waste bins` : ''}. The map is updated regularly from OpenStreetMap data.`
        : `We are currently collecting bin data for ${cityName}. Open the map to see the latest available bins in the area.`,
    },
    {
      question: `How do I find the nearest bin in ${cityName}?`,
      answer: `Open the bin there map centered on ${cityName} and tap "Find Nearest Bin." The app uses your GPS location to calculate walking directions to the closest public trash can.`,
    },
    {
      question: `Are dog waste bins available in ${cityName}?`,
      answer: stats?.dogBins && stats.dogBins > 0
        ? `Yes, ${cityName} has ${stats.dogBins.toLocaleString()} dedicated dog waste bins mapped on bin there. These are shown alongside general waste bins on the map.`
        : `Dog waste bins in ${cityName} are mapped when available in OpenStreetMap data. Open the map to check the latest coverage.`,
    },
  ];
}

const CityBins = () => {
  const { country, city } = useParams<{ country: string; city: string }>();

  const cityData = useMemo(
    () => cities.find((c) => c.country === country && c.slug === city),
    [country, city],
  );

  const stats = city ? cityStats[city] : undefined;

  const faqItems = useMemo(
    () => buildFaqItems(cityData?.name ?? '', stats),
    [cityData?.name, stats],
  );

  const nearbyCityData = useMemo(() => {
    if (!stats?.nearbyCities) return [];
    return stats.nearbyCities
      .map((slug) => cities.find((c) => c.slug === slug))
      .filter((c): c is City => c !== undefined)
      .slice(0, 6);
  }, [stats]);

  const jsonLd = useMemo(() => {
    if (!cityData) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'bin there',
            item: 'https://binthere.online/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Bins',
            item: 'https://binthere.online/bins/',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: cityData.countryName,
            item: `https://binthere.online/bins/${country}/`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: cityData.name,
            item: `https://binthere.online/bins/${country}/${city}/`,
          },
        ],
      },
    ];
  }, [cityData, faqItems, country, city]);

  useSEO({
    title: cityData
      ? `Public Bins in ${cityData.name}, ${cityData.countryName} | bin there`
      : 'City Not Found | bin there',
    description: cityData && stats
      ? `Find ${stats.totalBins.toLocaleString()} public trash cans in ${cityData.name}. Walking directions to the nearest bin.`
      : cityData
        ? `Find public trash cans in ${cityData.name}. Walking directions to the nearest bin.`
        : 'The city you are looking for was not found.',
    path: `/bins/${country ?? ''}/${city ?? ''}`,
    jsonLd: jsonLd as Record<string, unknown>[],
  });

  if (!cityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <header className="container mx-auto px-6 py-6">
          <Link to={country ? `/bins/${country}/` : '/bins/'}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </header>
        <main className="container mx-auto px-6 py-12 max-w-3xl text-center">
          <img src={logo} alt="bin there" className="h-20 mx-auto mb-6 opacity-50" />
          <h1 className="text-4xl font-bold text-foreground mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We don't have bin data for this city yet.
          </p>
          <Link to="/bins/">
            <Button>Browse All Cities</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="container mx-auto px-6 py-6">
        <Link to={`/bins/${country}/`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {cityData.countryName}
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl">
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
          <Link to={`/bins/${country}/`} className="hover:text-foreground transition-colors">
            {cityData.countryName}
          </Link>
          <span>/</span>
          <span className="text-foreground">{cityData.name}</span>
        </nav>

        {/* H1 */}
        <div className="text-center mb-10 fade-up-enter">
          <img src={logo} alt="bin there logo" className="h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Public Bins in {cityData.name}
          </h1>
        </div>

        {/* Answer capsule */}
        <section
          className="bg-card border border-border rounded-lg p-8 mb-8 fade-up-enter"
          style={{ animationDelay: '0.1s' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Where can I throw away trash in {cityData.name}?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {stats && stats.totalBins > 0 ? (
              <>
                {cityData.name} has {stats.totalBins.toLocaleString()} public bins mapped on
                bin there.{' '}
                {stats.dogBins > 0 &&
                  `This includes ${stats.dogBins.toLocaleString()} dedicated dog waste bins. `}
                Use the map below to find the nearest bin and get walking directions from your
                current location.
              </>
            ) : (
              <>
                Find public trash cans in {cityData.name} using the bin there map. Get
                walking directions to the nearest bin from your current location.
              </>
            )}
          </p>
        </section>

        {/* Stats grid */}
        {stats && stats.totalBins > 0 && (
          <div
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 fade-up-enter"
            style={{ animationDelay: '0.15s' }}
          >
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Trash2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {stats.totalBins.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Bins</div>
            </div>

            {stats.dogBins > 0 && (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <Dog className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.dogBins.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Dog Waste Bins</div>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {stats.densityPerKm2.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Bins per km&sup2;</div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="text-center mb-12 fade-up-enter"
          style={{ animationDelay: '0.2s' }}
        >
          <Link to={`/?lat=${cityData.lat}&lng=${cityData.lng}`}>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <MapPin className="w-5 h-5 mr-2" />
              Open Map in {cityData.name}
            </Button>
          </Link>
        </div>

        {/* FAQ section */}
        <section
          className="mb-12 fade-up-enter"
          style={{ animationDelay: '0.25s' }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {item.question}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related cities */}
        {nearbyCityData.length > 0 && (
          <section
            className="mb-12 fade-up-enter"
            style={{ animationDelay: '0.3s' }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Nearby Cities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {nearbyCityData.map((nearbyCity) => (
                <Link
                  key={nearbyCity.slug}
                  to={`/bins/${nearbyCity.country}/${nearbyCity.slug}/`}
                >
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all text-center">
                    <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="font-medium text-foreground text-sm">
                      {nearbyCity.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {nearbyCity.countryName}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer links */}
        <div
          className="text-center text-sm text-muted-foreground space-x-4 pb-8 fade-up-enter"
          style={{ animationDelay: '0.35s' }}
        >
          <Link to="/bins/" className="hover:text-foreground transition-colors">
            All Countries
          </Link>
          <span>·</span>
          <Link to={`/bins/${country}/`} className="hover:text-foreground transition-colors">
            {cityData.countryName}
          </Link>
          <span>·</span>
          <Link to="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CityBins;
