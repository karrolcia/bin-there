import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Smartphone, Database, Globe, Heart } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from '@/hooks/useSEO';
import logo from '@/assets/logo.svg';

const faqData = [
  {
    question: "How do I find the nearest trash can?",
    answer: "Simply click the 'Bin It' button on the homepage. The app will request your location and show all nearby trash cans on an interactive map. Click 'Find Nearest Bin' to get walking directions to the closest one."
  },
  {
    question: "Is bin there free to use?",
    answer: "Yes! bin there is completely free to use. No subscription, no hidden fees, no ads. We believe responsible waste disposal should be accessible to everyone."
  },
  {
    question: "How accurate are bin locations?",
    answer: "Bin locations are sourced from OpenStreetMap and verified by our community. We use GPS coordinates accurate to within a few meters. If you find an incorrect location, you can report it through the app."
  },
  {
    question: "Can I add new bins to the map?",
    answer: "Yes! When you're using the app, you can contribute by marking bins you find. Your contributions help make bin there more useful for everyone in your community."
  },
  {
    question: "Does the app work offline?",
    answer: "The map requires an internet connection to load bin locations and calculate routes. However, once loaded, you can navigate to bins even with poor connectivity. We recommend loading the map while you have good signal."
  },
  {
    question: "Which cities does bin there cover?",
    answer: "bin there works globally wherever OpenStreetMap has trash can data. Coverage is best in urban areas where the community has mapped public waste bins. Coverage improves as more users contribute."
  }
];

const faqIcons = [MapPin, Heart, Database, Users, Smartphone, Globe];

const FAQ = () => {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": answer
      }
    }))
  }), []);

  useSEO({
    title: "FAQ - bin there",
    description: "Get answers to common questions about bin there. Learn how to find nearby trash cans, track your impact, and use our bin locator app effectively.",
    path: "/faq",
    jsonLd
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
          {faqData.map((item, index) => {
            const Icon = faqIcons[index];
            return (
              <AccordionItem key={`item-${index + 1}`} value={`item-${index + 1}`} className="bg-card border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span className="font-semibold">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            );
          })}
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
