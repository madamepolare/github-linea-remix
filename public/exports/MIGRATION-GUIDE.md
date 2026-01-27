# Guide de Migration - Archigood vers Supabase Personnel

## Vue d'ensemble

Ce guide vous accompagne pour migrer l'application Archigood de Lovable Cloud vers votre propre instance Supabase.

## Étape 1 : Créer un nouveau projet Lovable

1. Allez sur [lovable.dev](https://lovable.dev)
2. Cliquez sur "Remix" sur votre projet actuel
3. Le nouveau projet n'aura PAS Lovable Cloud activé
4. Vous pourrez connecter votre propre Supabase

## Étape 2 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez :
   - **Project URL** : `https://votre-projet.supabase.co`
   - **Anon Key** : La clé publique
   - **Service Role Key** : La clé secrète (pour les edge functions)

## Étape 3 : Importer le schéma de base de données

1. Dans votre dashboard Supabase, allez dans **SQL Editor**
2. Exécutez les fichiers SQL dans cet ordre :
   - `01-enums.sql` - Types énumérés
   - `02-helper-functions.sql` - Fonctions utilitaires RLS
   - `03-tables-core.sql` - Tables principales
   - `04-tables-crm.sql` - Tables CRM
   - `05-tables-commercial.sql` - Tables commerciales
   - `06-tables-projects.sql` - Tables projets
   - `07-tables-team.sql` - Tables équipe
   - `08-tables-misc.sql` - Tables diverses
   - `09-rls-policies.sql` - Politiques RLS
   - `10-triggers.sql` - Triggers et automatisations

## Étape 4 : Configurer les secrets Edge Functions

Dans votre dashboard Supabase → Settings → Edge Functions → Secrets :

### Secrets requis pour l'IA (Lovable AI Gateway)
```
LOVABLE_API_KEY=votre-clé-lovable
```

### Secrets pour les emails (Resend)
```
RESEND_API_KEY=votre-clé-resend
```

### Secrets pour la génération PDF (Browserless)
```
BROWSERLESS_API_KEY=votre-clé-browserless
```

### Secrets pour Gmail OAuth (optionnel)
```
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
WORKSPACE_GOOGLE_CLIENT_ID=votre-workspace-client-id
WORKSPACE_GOOGLE_CLIENT_SECRET=votre-workspace-client-secret
```

### Secrets pour Web Push (optionnel)
```
VAPID_PUBLIC_KEY=votre-clé-publique
VAPID_PRIVATE_KEY=votre-clé-privée
```

## Étape 5 : Déployer les Edge Functions

Les 69 edge functions dans `supabase/functions/` seront automatiquement déployées.

Pour un déploiement manuel, utilisez la CLI Supabase :
```bash
supabase login
supabase link --project-ref votre-projet-ref
supabase functions deploy
```

## Étape 6 : Connecter au projet Lovable remixé

1. Dans votre nouveau projet Lovable (remixé)
2. Allez dans Settings → Supabase
3. Entrez votre Project URL et Anon Key
4. La connexion est établie !

## Étape 7 : Configurer l'authentification

Dans Supabase → Authentication → Settings :
- Activez "Email confirmations" (ou désactivez pour le dev)
- Configurez les providers OAuth si nécessaire
- Définissez les URLs de redirection

## Structure des fichiers

```
public/exports/
├── MIGRATION-GUIDE.md      # Ce guide
├── database-schema-full.sql # Schéma complet en un seul fichier
└── sql/
    ├── 01-enums.sql
    ├── 02-helper-functions.sql
    ├── 03-tables-core.sql
    ├── 04-tables-crm.sql
    ├── 05-tables-commercial.sql
    ├── 06-tables-projects.sql
    ├── 07-tables-team.sql
    ├── 08-tables-misc.sql
    ├── 09-rls-policies.sql
    └── 10-triggers.sql
```

## Edge Functions - Liste complète (69)

### IA & Génération
- ai-planning-suggestions
- ai-prospect-search
- ai-workflow-planning
- analyze-dce-before-creation
- analyze-deliverables
- analyze-tender-documents
- generate-company-categories
- generate-company-types
- generate-deliverable-email
- generate-deliverable-tasks
- generate-discipline-content
- generate-email-content
- generate-full-quote
- generate-line-description
- generate-phase-templates
- generate-pipeline-stages
- generate-project-deliverables
- generate-project-summary
- generate-quote-theme
- generate-subtasks
- generate-tender-section
- linea-assistant
- openai-lead-search
- suggest-commercial-phases
- suggest-phase-planning
- support-chat

### PDF & Documents
- generate-html-pdf
- generate-pdf
- generate-pdf-chromium
- generate-quote-html
- generate-signed-pdf

### Emails
- gmail-config
- gmail-disconnect
- gmail-oauth-callback
- gmail-send-email
- gmail-status
- gmail-sync
- gmail-sync-config
- send-deliverable-email
- send-invite
- send-meeting-convocation
- send-partner-invitation
- send-push-notification
- send-quote-email
- workspace-email-config
- workspace-email-oauth-callback
- workspace-email-status
- workspace-email-update

### Portails clients
- client-portal-actions
- client-portal-view
- company-portal-actions
- company-portal-view
- public-quote-sign
- public-quote-view

### Autres
- archive-completed-tasks
- ask-dce-question
- auto-categorize-companies
- auto-schedule-evaluations
- auto-source-image
- chorus-pro-submit
- create-user
- distribute-budget
- edit-quote-lines
- fetch-company-logo
- framework-request-submit
- get-vapid-key
- parse-bpu-file
- parse-contacts-import
- parse-school-calendar
- schedule-followups

## Support

Si vous rencontrez des problèmes lors de la migration, n'hésitez pas à demander de l'aide dans le chat Lovable.

## Notes importantes

1. **Les données ne sont PAS migrées** - Ce guide migre uniquement la structure (schéma)
2. **Testez en environnement de développement d'abord**
3. **Sauvegardez vos données actuelles** avant toute modification
4. **Les storage buckets** doivent être créés manuellement si vous utilisez le stockage de fichiers
