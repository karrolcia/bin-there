import { Heart } from 'lucide-react';

interface DonateButtonProps {
  className?: string;
}

export const DonateButton = ({ className = '' }: DonateButtonProps) => (
  <a
    href="https://buy.stripe.com/bJefZhej802JatdfK1b7y01"
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${className}`}
    aria-label="Support bin there with a donation"
  >
    <Heart className="w-3.5 h-3.5" />
    Support us
  </a>
);
