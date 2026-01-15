import { Badge } from "@/components/ui/badge";

export function LandingSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">31+ composants</Badge>
        <Badge variant="secondary">src/components/landing/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Landing:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• HeroSection</li>
          <li>• PricingCard</li>
          <li>• FeatureCard</li>
          <li>• TestimonialsCarousel</li>
        </ul>
      </div>
    </div>
  );
}
