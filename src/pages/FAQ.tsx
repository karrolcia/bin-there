import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Smartphone, Database, Globe, Heart } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logo from '@/assets/logo.svg';

const FAQ = () => {
  useEffect(() => {
    document.title = "FAQ - bin there";
    
    // Add FAQPage structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I find the nearest trash can?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply click the 'Bin It' button on the homepage. The app will request your location and show all nearby trash cans on an interactive map. Click 'Find Nearest Bin' to get walking directions to the closest one."
          }
        },
        {
          "@type": "Question",
          "name": "Is bin there free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! bin there is completely free to use. No subscription, no hidden fees, no ads. We believe responsible waste disposal should be accessible to everyone."
          }
        },
        {
          "@type": "Question",
          "name": "How accurate are bin locations?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Bin locations are sourced from OpenStreetMap and verified by our community. We use GPS coordinates accurate to within a few meters. If you find an incorrect location, you can report it through the app."
          }
        },
        {
          "@type": "Question",
          "name": "Can I add new bins to the map?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! When you're using the app, you can contribute by marking bins you find. Your contributions help make bin there more useful for everyone in your community."
          }
        },
        {
          "@type": "Question",
          "name": "Does the app work offline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The map requires an internet connection to load bin locations and calculate routes. However, once loaded, you can navigate to bins even with poor connectivity. We recommend loading the map while you have good signal."
          }
        },
        {
          "@type": "Question",
          "name": "Which cities does bin there cover?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "bin there works globally wherever OpenStreetMap has trash can data. Coverage is best in urban areas where the community has mapped public waste bins. Coverage improves as more users contribute."
          }
        }
      ]
    });
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

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

      <main className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="text-center mb-12 fade-up-enter">
          <img 
            src={logo} 
            alt="bin there logo" 
            className="h-20 mx-auto mb-6" 
          />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about finding bins
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4 fade-up-enter" style={{ animationDelay: '0.1s' }}>
          <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">How do I find the nearest trash can?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              Simply click the <strong>"Bin It"</strong> button on the homepage. The app will request your location and show all nearby trash cans on an interactive map. Click <strong>"Find Nearest Bin"</strong> to get walking directions to the closest one.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">Is bin there free to use?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              Yes! bin there is completely free to use. No subscription, no hidden fees, no ads. We believe responsible waste disposal should be accessible to everyone.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">How accurate are bin locations?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              Bin locations are sourced from <strong>OpenStreetMap</strong> and verified by our community. We use GPS coordinates accurate to within a few meters. If you find an incorrect location, you can report it through the app.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">Can I add new bins to the map?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              Yes! When you're using the app, you can contribute by marking bins you find. Your contributions help make bin there more useful for everyone in your community.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">Does the app work offline?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              The map requires an internet connection to load bin locations and calculate routes. However, once loaded, you can navigate to bins even with poor connectivity. We recommend loading the map while you have good signal.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="font-semibold">Which cities does bin there cover?</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pt-2 pb-4">
              bin there works <strong>globally</strong> wherever OpenStreetMap has trash can data. Coverage is best in urban areas where the community has mapped public waste bins. Coverage improves as more users contribute.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 text-center p-8 bg-card border border-border rounded-lg fade-up-enter" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Try the app and see how simple it is!
          </p>
          <Link to="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
