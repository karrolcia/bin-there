import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import logo from "@/assets/logo.svg";

const Privacy = () => {
  useSEO({
    title: "Privacy Policy - bin there",
    description: "bin there has no accounts and keeps no personal data on its server. Here is exactly what happens with your location and usage data.",
    path: "/privacy"
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <img src={logo} alt="bin there" className="h-12" />
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: November 13, 2026</p>
        </div>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">The short version</h2>
            <p className="mb-4">
              bin there has no accounts and keeps no personal data on its own server. Your bin count and streak are stored only in your browser. We don't sell anything to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What happens with your location</h2>
            <p className="mb-4">
              If you allow it, your browser shares your location with the app so it can find bins near you. It is used in your browser and sent only to the map services that need it to answer your request (see "Services we use" below). bin there's own server never receives or stores your location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What our server stores</h2>
            <p className="mb-4">
              When you tap "Binned It!", we add one to a public counter for that bin. We store the bin's OpenStreetMap ID, its position and name, and how often it has been used. Nothing about you is stored with it: no account, no IP address, no location of yours, no device details.
            </p>
            <p>
              To stop abuse, the server briefly remembers your IP address in memory (for at most 6 hours) so the same person can't count one bin over and over or flood the service. It is never written to disk and is forgotten when the server restarts. We don't keep access logs of visits to binthere.online.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What stays in your browser</h2>
            <p>
              Your total bins and streak are saved in your browser's local storage on your device. We can't see them. Clearing your browser data deletes them, and they don't follow you to other devices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Services we use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Hetzner (hosting, EU)</h3>
                <p>The website and the bin counter run on a server at Hetzner in the EU.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Mapbox (map and walking directions)</h3>
                <p>Your browser loads map images from Mapbox and asks Mapbox for walking directions, which sends your position and the bin's position to Mapbox. Mapbox handles this under its own privacy policy.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">OpenStreetMap (bin locations and reports)</h3>
                <p>Your browser asks the OpenStreetMap Overpass service for bins around the area you're looking at. If you report a problem with a bin, your report is posted as a public, anonymous note on OpenStreetMap at the bin's location, including any comment you add, so please don't include personal details.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">PostHog (anonymous usage statistics, EU)</h3>
                <p>We use PostHog's EU cloud to understand how the app is used, for example how often people search or mark a bin as used. We don't send your location to PostHog, and we don't create personal profiles.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Stripe (donations)</h3>
                <p>If you choose to donate, you do so on Stripe's own page, under Stripe's privacy policy. We don't receive your card details.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your rights</h2>
            <p className="mb-4">
              Under the GDPR you have the right to access, correct, delete and export personal data about you, and to object to its use. Because our server stores nothing that identifies you, there is usually nothing for us to look up or delete. Your stats are in your own browser and you can delete them yourself. For anything held by the services above, you can also contact them directly.
            </p>
            <p>
              Questions or requests: info@binthere.online
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Children</h2>
            <p>
              bin there doesn't ask for or store personal information, from children or anyone else.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to this policy</h2>
            <p>
              If how we handle data changes, we'll update this page and the date at the top.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact</h2>
            <p className="font-medium">
              Email: info@binthere.online
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
