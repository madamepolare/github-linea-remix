# Linea Suite Design System

> **RÈGLE ABSOLUE** : Ce fichier est la référence pour tout développement UI.
> Tous les tokens sont centralisés dans `index.css` (source unique de vérité).

---

## 🎨 Principes Fondamentaux

### Philosophie
- **Clean & Minimal** : Inspiré de Qonto, Linear, Notion
- **Noir & Blanc** comme base avec accents subtils
- **Fonctionnel avant décoratif**
- **Cohérence absolue** sur tous les composants
- **Single Source of Truth** : Tous les tokens dans `index.css`

---

## 📐 Architecture des Tokens

### Fichiers clés
```
src/index.css          → Source unique de tous les tokens CSS
tailwind.config.ts     → Référence les variables CSS
DESIGN_SYSTEM.md       → Documentation (ce fichier)
```

### Catégories de tokens (dans index.css)
1. **Typography Scale** - Polices, tailles, poids
2. **Spacing Rules** - Échelle d'espacements (base 4px)
3. **Border Radius** - Arrondis des éléments
4. **Shadows** - Ombres et élévations
5. **Colors** - Palette sémantique light/dark
6. **Container Widths** - Largeurs max de conteneurs
7. **Button Styles** - Dimensions des boutons
8. **Z-Index Scale** - Couches de superposition
9. **Transitions** - Durées et easings

---

## 1️⃣ Typography Scale

### Variables CSS
```css
/* Familles */
--font-family-heading    /* Inter pour titres */
--font-family-body       /* Inter pour corps */
--font-family-mono       /* Monospace pour code */

/* Tailles (Mobile-first) */
--font-size-2xs: 0.625rem   /* 10px */
--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px - Base du body */
--font-size-base: 1rem      /* 16px */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */
--font-size-2xl: 1.5rem     /* 24px */
--font-size-3xl: 1.875rem   /* 30px */
--font-size-4xl: 2.25rem    /* 36px */

/* Poids */
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Line heights */
--line-height-tight: 1.25
--line-height-snug: 1.375
--line-height-normal: 1.5
--line-height-relaxed: 1.625
```

### Utilisation Tailwind
```tsx
// Hiérarchie des titres (définie globalement)
<h1>  // 2xl→3xl, semibold, tight
<h2>  // xl→2xl, semibold, tight
<h3>  // lg→xl, semibold, snug
<h4>  // base, semibold, snug
<h5>  // sm, semibold, snug
<h6>  // xs, semibold, snug

// Classes utilitaires
className="text-primary-content"     // Texte principal fort
className="text-secondary-content"   // Texte secondaire
className="text-tertiary"            // Texte tertiaire
className="label-sm"                 // Labels uppercase
```

---

## 2️⃣ Spacing Rules

### Échelle (base 4px)
```css
--space-0: 0
--space-1: 0.25rem     /* 4px */
--space-2: 0.5rem      /* 8px */
--space-3: 0.75rem     /* 12px */
--space-4: 1rem        /* 16px */
--space-5: 1.25rem     /* 20px */
--space-6: 1.5rem      /* 24px */
--space-8: 2rem        /* 32px */
--space-10: 2.5rem     /* 40px */
--space-12: 3rem       /* 48px */
--space-16: 4rem       /* 64px */
--space-20: 5rem       /* 80px */
--space-24: 6rem       /* 96px */
```

### Tokens sémantiques
```css
--space-page-x: 1.5rem         /* Padding horizontal page */
--space-page-y: 1.5rem         /* Padding vertical page */
--space-card-padding: 1.25rem  /* Padding interne cartes */
--space-section-gap: 2rem      /* Gap entre sections */
--space-component-gap: 1rem    /* Gap entre composants */
```

### Utilisation Tailwind
```tsx
// Classes sémantiques
className="p-card"              // Padding carte
className="gap-section"         // Gap entre sections
className="gap-component"       // Gap entre composants

// Standards
className="page-content"        // p-3 sm:p-4 md:p-6
className="responsive-container"// px-3 sm:px-4 md:px-6

// Gaps standards
gap-1   // 4px - très proches
gap-2   // 8px - proches
gap-3   // 12px - normal
gap-4   // 16px - confortable
gap-6   // 24px - sections
gap-8   // 32px - grandes sections
```

---

## 3️⃣ Border Radius

### Variables CSS
```css
--radius-none: 0
--radius-sm: 0.375rem     /* 6px - Badges, petits éléments */
--radius-md: 0.5rem       /* 8px - Default */
--radius-lg: 0.625rem     /* 10px - Cartes */
--radius-xl: 0.75rem      /* 12px - Grandes cartes, modals */
--radius-2xl: 1rem        /* 16px - Hero sections */
--radius-full: 9999px     /* Circulaire */

/* Aliases sémantiques */
--radius-button: var(--radius-lg)
--radius-input: var(--radius-lg)
--radius-card: var(--radius-xl)
--radius-dialog: var(--radius-xl)
--radius-badge: var(--radius-full)
```

### Utilisation Tailwind
```tsx
rounded-sm       // Petits éléments
rounded-md       // Default
rounded-lg       // Cartes, dialogs
rounded-xl       // Grandes cartes
rounded-full     // Badges, avatars

// Sémantiques
rounded-button   // Boutons
rounded-input    // Inputs
rounded-card     // Cartes
rounded-dialog   // Modals
rounded-badge    // Badges
```

---

## 4️⃣ Shadows

### Variables CSS
```css
--shadow-none: none
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.04)
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.2)
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)

/* Aliases sémantiques */
--shadow-card: var(--shadow-sm)
--shadow-card-hover: var(--shadow-md)
--shadow-dropdown: var(--shadow-lg)
--shadow-dialog: var(--shadow-xl)
--shadow-button: var(--shadow-xs)
--shadow-button-hover: var(--shadow-sm)
```

### Utilisation Tailwind
```tsx
shadow-xs        // Subtil
shadow-sm        // Léger
shadow-md        // Medium (default)
shadow-lg        // Prononcé
shadow-xl        // Fort
shadow-2xl       // Très fort

// Sémantiques
shadow-card        // Cartes au repos
shadow-card-hover  // Cartes au survol
shadow-dropdown    // Menus déroulants
shadow-dialog      // Modals/dialogs
shadow-button      // Boutons
```

---

## 5️⃣ Button Styles

### Dimensions
```css
--button-height-sm: 2.25rem    /* 36px / h-9 */
--button-height-md: 2.5rem     /* 40px / h-10 */
--button-height-lg: 2.75rem    /* 44px / h-11 */
--button-height-icon: 2.5rem   /* 40px */
--button-height-icon-sm: 2.25rem
--button-height-icon-xs: 2rem

--button-padding-x-sm: 1rem
--button-padding-x-md: 1.25rem
--button-padding-x-lg: 1.5rem
```

### Utilisation
```tsx
import { Button } from '@/components/ui/button';

<Button>Principal</Button>                    // default
<Button variant="secondary">Secondaire</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="soft">Soft</Button>
<Button variant="destructive">Supprimer</Button>

<Button size="sm">Petit</Button>              // h-9
<Button size="default">Normal</Button>        // h-10
<Button size="lg">Grand</Button>              // h-11
<Button size="icon">🔍</Button>               // h-10 w-10
<Button size="icon-sm">🔍</Button>            // h-9 w-9
<Button size="icon-xs">🔍</Button>            // h-8 w-8
```

---

## 6️⃣ Container Widths

### Variables CSS
```css
--container-xs: 20rem     /* 320px */
--container-sm: 24rem     /* 384px */
--container-md: 28rem     /* 448px */
--container-lg: 32rem     /* 512px */
--container-xl: 36rem     /* 576px */
--container-2xl: 42rem    /* 672px */
--container-3xl: 48rem    /* 768px */
--container-4xl: 56rem    /* 896px */
--container-5xl: 64rem    /* 1024px */
--container-6xl: 72rem    /* 1152px */
--container-7xl: 80rem    /* 1280px */
--container-page: 87.5rem /* 1400px */
```

### Utilisation Tailwind
```tsx
className="max-w-xs"      // Petit conteneur
className="max-w-sm"      // Formulaires
className="max-w-md"      // Dialogs
className="max-w-lg"      // Cartes larges
className="max-w-page"    // Page complète
```

---

## 🎯 Color Tokens

### ⛔ INTERDIT - Ne JAMAIS utiliser :
```tsx
// ❌ JAMAIS de couleurs hardcodées
className="text-white"
className="bg-black"
className="text-gray-500"
className="bg-[#ffffff]"
style={{ color: '#000' }}
```

### ✅ OBLIGATOIRE - Tokens sémantiques :
```tsx
// Texte
className="text-foreground"          // Texte principal
className="text-muted-foreground"    // Texte secondaire
className="text-primary"             // Accent principal

// Fonds
className="bg-background"            // Fond de page
className="bg-card"                  // Fond de carte
className="bg-muted"                 // Fond subtil
className="bg-surface"               // Surfaces
className="bg-primary"               // Boutons principaux

// États
className="text-success"             // Succès (vert)
className="text-warning"             // Avertissement (orange)
className="text-info"                // Information (bleu)
className="text-destructive"         // Erreur (rouge)
className="text-error"               // Alias pour destructive

// Bordures
className="border-border"            // Standard
className="border-input"             // Inputs
```

---

## 🌗 Dark Mode

Le dark mode est automatique via `class="dark"` sur `<html>`.

```tsx
// ❌ ÉVITER
className="bg-white dark:bg-black"

// ✅ UTILISER (s'adapte automatiquement)
className="bg-background"
```

---

## ⚡ Transitions & Animations

### Durées
```css
--transition-fast: 100ms
--transition-base: 150ms
--transition-slow: 200ms
--transition-slower: 300ms
```

### Easings
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Classes
```tsx
className="animate-fade-in"           // Entrée fade
className="animate-scale-in"          // Entrée scale
className="animate-slide-in-right"    // Slide droite
className="hover-lift"                // Élévation hover
className="transition-smooth"         // Transition fluide

className="duration-fast"             // 100ms
className="duration-base"             // 150ms
className="duration-slow"             // 200ms
```

---

## 📱 Responsive & Breakpoints

```
sm: 640px   // Tablette portrait
md: 768px   // Tablette paysage
lg: 1024px  // Desktop
xl: 1280px  // Grand écran
2xl: 1400px // Très grand écran
```

### Patterns
```tsx
// Grilles
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Flex
className="flex flex-col sm:flex-row gap-4"

// Affichage conditionnel
className="hidden sm:block"  // Caché mobile
className="block sm:hidden"  // Mobile only
```

---

## 🔢 Z-Index Scale

```css
--z-dropdown: 50
--z-sticky: 100
--z-fixed: 200
--z-modal-backdrop: 400
--z-modal: 500
--z-popover: 600
--z-tooltip: 700
--z-toast: 800
```

```tsx
className="z-dropdown"    // Menus
className="z-modal"       // Dialogs
className="z-tooltip"     // Tooltips
className="z-toast"       // Notifications
```

---

## ✅ Checklist avant commit

- [ ] Aucune couleur hardcodée
- [ ] Tous les tokens viennent du design system
- [ ] Composants shadcn/ui utilisés quand disponibles
- [ ] Responsive géré (mobile-first)
- [ ] Dark mode fonctionne
- [ ] Espacements suivent l'échelle
- [ ] Animations subtiles et performantes

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
| Carte | `<Card>` + `rounded-card` |
| Input | `<Input>` + `rounded-input` |
| Badge | `<Badge>` + `rounded-badge` |
| Ombre carte | `shadow-card` |
| Ombre hover | `shadow-card-hover` |
| Gap section | `gap-section` ou `gap-8` |
| Gap composants | `gap-component` ou `gap-4` |
