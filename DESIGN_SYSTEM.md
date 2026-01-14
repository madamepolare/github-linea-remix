# Linea Suite Design System

> **RÈGLE ABSOLUE** : Ce fichier est la référence pour tout développement UI.
> Toute modification de composant ou de style DOIT respecter ces règles.

---

## 🎨 Principes Fondamentaux

### Philosophie
- **Clean & Minimal** : Inspiré de Qonto, Linear, Notion
- **Noir & Blanc** comme base avec accents subtils
- **Fonctionnel avant décoratif**
- **Cohérence absolue** sur tous les composants

---

## 🎯 Tokens de Couleur

### ⛔ INTERDIT - Ne JAMAIS utiliser :
```tsx
// ❌ JAMAIS de couleurs hardcodées
className="text-white"
className="bg-black"
className="text-gray-500"
className="bg-slate-100"
className="text-[#ffffff]"
className="bg-zinc-900"
style={{ color: '#000' }}
```

### ✅ OBLIGATOIRE - Toujours utiliser les tokens sémantiques :
```tsx
// ✅ Couleurs de texte
className="text-foreground"          // Texte principal (noir/blanc)
className="text-muted-foreground"    // Texte secondaire
className="text-primary"             // Couleur d'accent principale
className="text-destructive"         // Erreurs, danger

// ✅ Fonds
className="bg-background"            // Fond de page
className="bg-card"                  // Fond de carte
className="bg-muted"                 // Fond subtil (gris clair)
className="bg-surface"               // Surfaces intermédiaires
className="bg-primary"               // Boutons principaux
className="bg-secondary"             // Boutons secondaires
className="bg-accent"                // Éléments accentués (violet)

// ✅ Bordures
className="border-border"            // Bordure standard
className="border-input"             // Champs de formulaire

// ✅ États
className="text-success"             // Succès (vert)
className="text-warning"             // Avertissement (orange)
className="text-info"                // Information (bleu)
className="text-destructive"         // Erreur (rouge)
```

### Variables CSS disponibles (index.css) :
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | blanc | #0f0f0f | Fond de page |
| `--foreground` | noir | #fafafa | Texte principal |
| `--card` | blanc | #141414 | Fond de carte |
| `--muted` | #f5f5f5 | #1f1f1f | Fonds subtils |
| `--accent` | violet | violet | Accents spéciaux |
| `--primary` | noir | blanc | Boutons, liens actifs |
| `--border` | #e5e5e5 | #292929 | Bordures |

---

## 📝 Typographie

### Hiérarchie des titres
```tsx
// Définis globalement dans index.css - NE PAS surcharger
<h1>  // text-2xl sm:text-3xl font-semibold
<h2>  // text-xl sm:text-2xl font-semibold
<h3>  // text-lg sm:text-xl font-semibold
<h4>  // text-base font-semibold
<h5>  // text-sm font-semibold
<h6>  // text-xs font-semibold

// Paragraphes
<p>   // text-sm text-muted-foreground
```

### Classes utilitaires
```tsx
className="text-primary-content"     // Texte principal fort
className="text-secondary-content"   // Texte secondaire
className="text-tertiary"            // Texte tertiaire
className="label-sm"                 // Labels (uppercase, tracking-wider)
```

---

## 📦 Composants Standards

### Boutons (utiliser shadcn/ui)
```tsx
import { Button } from '@/components/ui/button';

<Button>Principal</Button>                    // variant="default"
<Button variant="secondary">Secondaire</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Supprimer</Button>
<Button size="sm">Petit</Button>
<Button size="lg">Grand</Button>
```

### Cartes
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Carte standard
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>

// Ou avec la classe custom
<div className="card-programa">...</div>
```

### Badges
```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom pour statuts
<div className="badge-phase">En cours</div>
<div className="badge-phase-active">Actif</div>
```

### Inputs
```tsx
import { Input } from '@/components/ui/input';

<Input placeholder="..." />

// Ou style custom
<input className="input-clean" />
```

---

## 📐 Espacements

### Règles de spacing
```tsx
// Padding de page
className="page-content"              // p-3 sm:p-4 md:p-6
className="responsive-container"      // px-3 sm:px-4 md:px-6

// Gaps standards
gap-1   // 4px - éléments très proches
gap-2   // 8px - éléments proches
gap-3   // 12px - espacement normal
gap-4   // 16px - espacement confortable
gap-6   // 24px - sections
gap-8   // 32px - grandes sections

// Padding cards
p-4     // Cartes compactes
p-5     // Cartes standard
p-6     // Cartes avec plus de contenu
```

---

## 🔲 Border Radius

```tsx
rounded-sm   // 0.375rem - petits éléments
rounded-md   // 0.5rem - boutons, inputs
rounded-lg   // 0.625rem - cartes, modals
rounded-xl   // 0.75rem - grandes cartes
rounded-full // Badges, avatars
```

---

## 🌗 Dark Mode

Le dark mode est automatique via `class="dark"` sur `<html>`.

**IMPORTANT** : Ne pas utiliser de couleurs spécifiques au mode :
```tsx
// ❌ ÉVITER
className="bg-white dark:bg-black"
className="text-gray-900 dark:text-gray-100"

// ✅ UTILISER (s'adapte automatiquement)
className="bg-background"
className="text-foreground"
```

---

## ⚡ Animations

### Classes disponibles
```tsx
className="animate-fade-in"           // Entrée avec fade
className="animate-scale-in"          // Entrée avec scale
className="animate-slide-in-right"    // Slide depuis la droite
className="hover-lift"                // Légère élévation au hover
className="transition-smooth"         // Transition fluide
```

### Avec Framer Motion
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
```

---

## 📱 Responsive

### Breakpoints
```
sm: 640px   // Tablette portrait
md: 768px   // Tablette paysage
lg: 1024px  // Desktop
xl: 1280px  // Grand écran
2xl: 1400px // Très grand écran
```

### Patterns courants
```tsx
// Grilles
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Flex responsive
className="flex flex-col sm:flex-row gap-4"

// Texte responsive
className="text-lg sm:text-xl lg:text-2xl"

// Affichage conditionnel
className="hidden sm:block"  // Caché sur mobile
className="block sm:hidden"  // Visible uniquement sur mobile
```

---

## ✅ Checklist avant commit

- [ ] Aucune couleur hardcodée (text-white, bg-black, etc.)
- [ ] Tous les tokens viennent du design system
- [ ] Les composants shadcn/ui sont utilisés quand disponibles
- [ ] Le responsive est géré (mobile-first)
- [ ] Le dark mode fonctionne (pas de couleurs fixes)
- [ ] Les espacements suivent la grille (gap-2, gap-4, etc.)
- [ ] Les animations sont subtiles et performantes

---

## 🗂 Structure des fichiers

```
src/
├── index.css           # Variables CSS, classes globales
├── components/
│   └── ui/            # Composants shadcn/ui (NE PAS MODIFIER)
tailwind.config.ts      # Configuration Tailwind
```

---

## 📚 Référence rapide

| Besoin | Solution |
|--------|----------|
| Texte principal | `text-foreground` |
| Texte secondaire | `text-muted-foreground` |
| Fond de page | `bg-background` |
| Fond de carte | `bg-card` |
| Fond gris léger | `bg-muted` |
| Bordure standard | `border-border` |
| Bouton principal | `<Button>` |
| Bouton secondaire | `<Button variant="secondary">` |
| Carte | `<Card>` |
| Input | `<Input>` |
| Badge | `<Badge>` |
| Ombre légère | `shadow-sm` ou `shadow-card` |
| Ombre hover | `shadow-card-hover` |
