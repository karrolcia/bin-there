import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

interface CityInfo {
  slug: string;
  name: string;
  country: string;
  countryName: string;
  totalBins?: number;
}

interface RelatedCitiesProps {
  cities: CityInfo[];
  currentSlug: string;
}

export const RelatedCities = ({ cities, currentSlug }: RelatedCitiesProps) => {
  const filtered = cities.filter(c => c.slug !== currentSlug);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">Nearby Cities</h2>
      <div className="flex flex-wrap gap-3">
        {filtered.map(city => (
          <Link
            key={city.slug}
            to={`/bins/${city.country}/${city.slug}/`}
            className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2.5 text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{city.name}</span>
            {city.totalBins !== undefined && city.totalBins > 0 && (
              <span className="text-muted-foreground text-xs">
                {city.totalBins} bins
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};
