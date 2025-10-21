import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border py-3 px-4 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <Link 
          to="/privacy" 
          className="hover:text-foreground transition-colors"
          aria-label="Read our privacy policy"
        >
          Privacy
        </Link>
        <span className="text-border">•</span>
        <Link 
          to="/terms" 
          className="hover:text-foreground transition-colors"
          aria-label="Read our terms of service"
        >
          Terms
        </Link>
        <span className="text-border">•</span>
        <Link 
          to="/faq" 
          className="hover:text-foreground transition-colors"
          aria-label="View frequently asked questions"
        >
          FAQ
        </Link>
      </div>
    </footer>
  );
};
