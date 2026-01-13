# 🎯 Guide des Disciplines - Comment modifier chaque type

Ce fichier explique comment demander des modifications pour chaque discipline.

---

## 📁 Structure des fichiers

```
src/lib/disciplines/
├── types.ts              ← Interfaces (ne pas toucher)
├── architecture.ts       ← Config ARCHITECTURE
├── communication.ts      ← Config COMMUNICATION  
├── scenographie.ts       ← Config SCÉNOGRAPHIE
└── index.ts              ← Registry (ne pas toucher)
```

---

## 🏗️ ARCHITECTURE (`architecture.ts`)

### Onglets visibles
```typescript
tabs: [
  { key: 'synthese', label: 'Synthèse', ... },
  { key: 'equipe', label: 'Honoraires & Équipe', ... },  // ← Spécifique archi
  { key: 'calendrier', label: 'Calendrier', ... },
  // ...
]
```

### Blocs de synthèse
```typescript
synthesisBlocks: [
  { key: 'budget', component: 'BudgetBlock' },        // Budget travaux HT
  { key: 'honoraires', component: 'HonorairesBlock' }, // % MOE
  { key: 'surface', component: 'SurfaceBlock' },       // m² SHAB/SHON
  { key: 'missions', component: 'MissionsBlock' },     // Phases MOE
  // ...
]
```

### Spécialités équipe
```typescript
teamSpecialties: [
  { value: 'architecte', label: 'Architecte' },
  { value: 'bet_structure', label: 'BET Structure' },
  { value: 'economiste', label: 'Économiste' },
  // ...
]
```

### Pour modifier, dis-moi :
- "Dans ARCHITECTURE, ajoute l'onglet X"
- "Dans ARCHITECTURE, cache le bloc Y"
- "Dans ARCHITECTURE, ajoute la spécialité Z"

---

## 📢 COMMUNICATION (`communication.ts`)

### Onglets visibles (différent d'archi!)
```typescript
tabs: [
  { key: 'synthese', label: 'Synthèse', ... },
  { key: 'budget', label: 'Budget & Accord-cadre', ... },  // ← Spécifique comm
  { key: 'cas_pratique', label: 'Cas pratique', ... },      // ← Spécifique comm
  // PAS d'onglet "Honoraires & Équipe" !
]
```

### Blocs de synthèse (différent d'archi!)
```typescript
synthesisBlocks: [
  { key: 'accord_cadre', component: 'AccordCadreBlock' },   // Min/Max €
  { key: 'lots', component: 'LotsBlock' },                   // Allotissement
  { key: 'cas_pratique', component: 'CasPratiqueBlock' },    // Brief créatif
  { key: 'audition', component: 'AuditionBlock' },           // Soutenance
  { key: 'anciens_titulaires', component: 'SortantsBlock' }, // Sortants
  // PAS de bloc "honoraires MOE" ou "surface" !
]
```

### Spécialités équipe
```typescript
teamSpecialties: [
  { value: 'directeur_conseil', label: 'Directeur conseil' },
  { value: 'directeur_creation', label: 'Directeur de création' },
  { value: 'concepteur_redacteur', label: 'Concepteur-rédacteur' },
  // ...
]
```

### Pour modifier, dis-moi :
- "Dans COMMUNICATION, ajoute le bloc X"
- "Dans COMMUNICATION, renomme l'onglet Y en Z"
- "Dans COMMUNICATION, ajoute le champ W dans le formulaire"

---

## 🎭 SCÉNOGRAPHIE (`scenographie.ts`)

### Onglets visibles
```typescript
tabs: [
  { key: 'synthese', label: 'Synthèse', ... },
  { key: 'equipe', label: 'Équipe & Partenaires', ... },    // ← Label différent
  { key: 'exposition', label: 'Exposition', ... },           // ← Spécifique scéno
  // ...
]
```

### Blocs de synthèse
```typescript
synthesisBlocks: [
  { key: 'exposition', component: 'ExpositionBlock' },       // Type, durée, lieu
  { key: 'surface', component: 'SurfaceExpoBlock' },         // m² expo
  { key: 'itinerance', component: 'ItineranceBlock' },       // Lieux itinérance
  { key: 'contraintes', component: 'ContraintesBlock' },     // Conservation, climat
  // ...
]
```

### Spécialités équipe
```typescript
teamSpecialties: [
  { value: 'scenographe', label: 'Scénographe' },
  { value: 'graphiste', label: 'Graphiste' },
  { value: 'eclairagiste', label: 'Éclairagiste' },
  { value: 'conservateur', label: 'Conservateur' },
  // ...
]
```

---

## 🤖 Prompts IA (extraction DCE)

Chaque discipline a son propre prompt dans `aiPrompts.dceAnalysis`.

### Pour modifier l'extraction IA, dis-moi :
- "Dans COMMUNICATION, l'IA doit extraire le champ X"
- "Dans ARCHITECTURE, améliore le prompt pour mieux détecter Y"

---

## ✅ Exemples de demandes claires

| ✅ Bonne demande | ❌ Demande confuse |
|------------------|-------------------|
| "Dans COMMUNICATION, ajoute un bloc 'Cibles' sur la synthèse" | "Ajoute les cibles" |
| "Dans ARCHITECTURE, cache l'onglet 'Livrables'" | "Je veux pas voir les livrables" |
| "Dans SCÉNOGRAPHIE, l'IA doit extraire la durée d'exposition" | "L'IA ne marche pas" |

---

## 🔧 Fichiers techniques (ne pas modifier directement)

| Fichier | Rôle |
|---------|------|
| `useDisciplineTabs.ts` | Lit la config et retourne les tabs |
| `useWorkspaceTenderConfig.ts` | Merge config + overrides workspace |
| `TenderDetail.tsx` | Affiche les bons onglets selon discipline |
| `TenderSyntheseTab.tsx` | Affiche les bons blocs selon discipline |
| `analyze-dce-before-creation` | Edge function qui utilise le bon prompt IA |
