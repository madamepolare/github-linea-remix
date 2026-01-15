import { ComponentShowcase } from "../ComponentShowcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LayoutSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Espacement (Spacing)
            <Badge variant="secondary">Tailwind</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Gaps standards</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex gap-1 p-2 bg-muted rounded">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-primary rounded" />
                </div>
                <code className="text-xs">gap-1 (4px)</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2 p-2 bg-muted rounded">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-primary rounded" />
                </div>
                <code className="text-xs">gap-2 (8px)</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-3 p-2 bg-muted rounded">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-primary rounded" />
                </div>
                <code className="text-xs">gap-3 (12px)</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-4 p-2 bg-muted rounded">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-primary rounded" />
                </div>
                <code className="text-xs">gap-4 (16px)</code>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-6 p-2 bg-muted rounded">
                  <div className="w-4 h-4 bg-primary rounded" />
                  <div className="w-4 h-4 bg-primary rounded" />
                </div>
                <code className="text-xs">gap-6 (24px)</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Border Radius
            <Badge variant="secondary">Tailwind</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-none mb-2" />
              <code className="text-xs">rounded-none</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-sm mb-2" />
              <code className="text-xs">rounded-sm</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded mb-2" />
              <code className="text-xs">rounded</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-md mb-2" />
              <code className="text-xs">rounded-md</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-lg mb-2" />
              <code className="text-xs">rounded-lg</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-xl mb-2" />
              <code className="text-xs">rounded-xl</code>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full mb-2" />
              <code className="text-xs">rounded-full</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Shadows
            <Badge variant="secondary">CSS Variables</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-card rounded-lg mb-2" style={{ boxShadow: "var(--shadow-xs)" }} />
              <code className="text-xs">shadow-xs</code>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-card rounded-lg mb-2" style={{ boxShadow: "var(--shadow-sm)" }} />
              <code className="text-xs">shadow-sm</code>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-card rounded-lg mb-2" style={{ boxShadow: "var(--shadow-md)" }} />
              <code className="text-xs">shadow-md</code>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-card rounded-lg mb-2" style={{ boxShadow: "var(--shadow-lg)" }} />
              <code className="text-xs">shadow-lg</code>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-card rounded-lg mb-2" style={{ boxShadow: "var(--shadow-card)" }} />
              <code className="text-xs">shadow-card</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <ComponentShowcase
        name="ScrollArea"
        description="Zone de défilement personnalisée"
        filePath="src/components/ui/scroll-area.tsx"
        importStatement='import { ScrollArea } from "@/components/ui/scroll-area"'
      >
        <div className="flex gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Vertical</p>
            <ScrollArea className="h-40 w-48 rounded-md border p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="py-1 text-sm">
                  Élément {i + 1}
                </div>
              ))}
            </ScrollArea>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Horizontal</p>
            <ScrollArea className="w-64 rounded-md border">
              <div className="flex gap-4 p-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-20 h-20 rounded-md bg-muted flex items-center justify-center"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </ComponentShowcase>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Classes responsive
            <Badge variant="secondary">Breakpoints</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">sm: 640px</code>
            <code className="text-xs bg-muted px-2 py-1 rounded ml-2">md: 768px</code>
            <code className="text-xs bg-muted px-2 py-1 rounded ml-2">lg: 1024px</code>
            <code className="text-xs bg-muted px-2 py-1 rounded ml-2">xl: 1280px</code>
            <code className="text-xs bg-muted px-2 py-1 rounded ml-2">2xl: 1536px</code>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm">
              <span className="sm:hidden">📱 Mobile</span>
              <span className="hidden sm:inline md:hidden">📱 SM (640px+)</span>
              <span className="hidden md:inline lg:hidden">💻 MD (768px+)</span>
              <span className="hidden lg:inline xl:hidden">🖥️ LG (1024px+)</span>
              <span className="hidden xl:inline">🖥️ XL (1280px+)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Grilles
            <Badge variant="secondary">Grid</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">2 colonnes</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">1</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">2</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">3 colonnes</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">1</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">2</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">3</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">4 colonnes responsive</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">1</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">2</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">3</div>
              <div className="h-12 bg-muted rounded flex items-center justify-center text-sm">4</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
