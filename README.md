# AsapJoin — Web PWA

Application web progressive (PWA) mobile-first pour la plateforme de covoiturage et livraison de colis **AsapJoin**.

## Stack technique

| Technologie | Rôle |
|---|---|
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5.9](https://www.typescriptlang.org/) | Typage statique |
| [Vite 7](https://vite.dev/) | Bundler & dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling utility-first |
| [React Router 7](https://reactrouter.com/) | Routage SPA |
| [TanStack React Query 5](https://tanstack.com/query) | Gestion du cache & requêtes API |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Formulaires & validation |
| [Axios](https://axios-http.com/) | Client HTTP |
| [Stripe.js](https://stripe.com/docs/js) | Paiement en ligne |
| [Lucide React](https://lucide.dev/) | Icônes |
| [Sonner](https://sonner.emilkowal.dev/) | Notifications toast |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Service Worker & manifest PWA |

## Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- Le **backend** doit tourner sur `http://localhost:3000` (voir `../backend/README.md`)

## Installation

```bash
# Depuis la racine du projet
cd web

# Installer les dépendances
npm install

# Créer le fichier d'environnement
cp .env.example .env
```

## Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API backend | `http://localhost:3000/api/v1` |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe (mode test) | `pk_test_xxx` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google Identity Services (Web) | `xxxxxxxx.apps.googleusercontent.com` |

> ⚠️ Éditez le fichier `.env` avec vos propres valeurs avant de lancer l'application.

## Google Sign-In

Le frontend utilise exclusivement **Google Identity Services for Web** via le script `https://accounts.google.com/gsi/client`.

### Configuration Google Cloud

1. Créez un client OAuth 2.0 de type **Web application**.
2. Dans **Authorized JavaScript origins**, ajoutez au minimum :
   - `http://localhost:5173`
   - l'URL de production du frontend
3. Renseignez le même `Client ID` dans :
   - `web/.env` via `VITE_GOOGLE_CLIENT_ID`
   - `backend/.env` via `GOOGLE_CLIENT_ID`

### Flux d'authentification

- Le bouton officiel Google est affiché sur `/login` et `/register`.
- Le frontend récupère uniquement le `credential` GIS.
- Le frontend l'envoie à `POST /api/v1/auth/google`.
- L'utilisateur n'est considéré connecté qu'après validation backend et retour des JWT applicatifs.

### Liaison de compte

- Si l'email existe déjà côté backend, le compte Google est lié automatiquement quand aucun autre `google_sub` n'est déjà associé.
- En cas de conflit de liaison, l'API renvoie `GOOGLE_AUTH_EMAIL_CONFLICT`.

## Lancement

```bash
# Serveur de développement (HMR)
npm run dev
# → http://localhost:5173

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint
```

> Le dev server proxy automatiquement les requêtes `/api` vers `http://localhost:3000`.

## Structure du projet

```
web/
├── public/
│   ├── favicon.png
│   └── icons/              # Icônes PWA (192×192, 512×512)
├── src/
│   ├── components/
│   │   ├── layout/         # AppShell, TopBar, BottomNav
│   │   └── ui/             # Button, Input (composants réutilisables)
│   ├── lib/
│   │   ├── api-client.ts   # Instance Axios avec intercepteurs JWT
│   │   ├── api.ts          # Fonctions d'appel API typées
│   │   ├── auth.tsx        # AuthProvider & useAuth hook
│   │   ├── auth-context.ts # Contexte React pour l'auth
│   │   ├── types.ts        # Types TypeScript (alignés sur le backend)
│   │   ├── useOnline.ts    # Hook détection connexion réseau
│   │   └── utils.ts        # Utilitaires (cn, formatDate, etc.)
│   ├── pages/
│   │   ├── LoginPage.tsx        # Connexion
│   │   ├── RegisterPage.tsx     # Inscription
│   │   ├── SearchPage.tsx       # Recherche de trajets
│   │   ├── TripDetailPage.tsx   # Détail d'un trajet + réservation
│   │   ├── BookingDetailPage.tsx# Détail d'une réservation
│   │   ├── DriverTripsPage.tsx  # Espace conducteur
│   │   ├── WalletPage.tsx       # Portefeuille & transactions
│   │   ├── AccountPage.tsx      # Profil utilisateur
│   │   ├── MessagesPage.tsx     # Messagerie (placeholder)
│   │   └── OfflinePage.tsx      # Page hors ligne
│   ├── App.tsx             # Point d'entrée (providers)
│   ├── router.tsx          # Configuration des routes
│   ├── main.tsx            # Bootstrap React
│   └── index.css           # Styles globaux Tailwind
├── .env.example
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── package.json
```

## Routes

| Route | Page | Auth requise |
|---|---|---|
| `/login` | Connexion | Non |
| `/register` | Inscription | Non |
| `/offline` | Page hors ligne | Non |
| `/search` | Recherche de trajets | Oui |
| `/trips/:id` | Détail d'un trajet | Oui |
| `/booking/:id` | Détail d'une réservation | Oui |
| `/account` | Profil utilisateur | Oui |
| `/driver/trips` | Espace conducteur | Oui |
| `/wallet` | Portefeuille | Oui |
| `/messages` | Messagerie | Oui |
| `/parcel/search` | Recherche colis (placeholder) | Oui |
| `/history` | Historique (placeholder) | Oui |

## Fonctionnalités PWA

- **Manifest** : installable sur mobile (standalone)
- **Service Worker** : mise en cache automatique des assets statiques
- **Runtime caching** :
  - Recherche de trajets → `NetworkFirst` (cache 5 min)
  - Détail trajet → `StaleWhileRevalidate` (cache 10 min)
  - Portefeuille → `NetworkFirst` (cache 2 min)
  - Messages → `NetworkFirst` (cache 1 min)
- **Détection hors ligne** : indicateur visuel + page `/offline`

## Alias d'import

Le chemin `@/` est un alias vers `./src/` :

```tsx
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
```

## Scripts npm

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement Vite (port 5173) |
| `npm run build` | Compile TypeScript puis build Vite pour la production |
| `npm run preview` | Sert le build de production localement |
| `npm run lint` | Exécute ESLint sur le projet |

## Voir aussi

- [Backend README](../backend/README.md) — API REST Fastify
- [Admin README](../admin/README.md) — Dashboard d'administration
- [BACKLOG.md](./BACKLOG.md) — Fonctionnalités à venir
