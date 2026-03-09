import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import logo from "@/assets/logo.svg";

const NotFound = () => {
  useSEO({
    title: "Page Not Found - bin there",
    description: "The page you're looking for doesn't exist.",
    path: "/404",
    noindex: true
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="text-center space-y-8 px-6 max-w-md">
        <img src={logo} alt="bin there" className="h-24 mx-auto opacity-50" />
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Oops! This page doesn't exist</p>
          <p className="text-sm text-muted-foreground">
            Looks like you took a wrong turn. Let's get you back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto" aria-label="Return to homepage">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto" aria-label="Find bins on map">
              <Search className="w-4 h-4 mr-2" />
              Find Bins
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
