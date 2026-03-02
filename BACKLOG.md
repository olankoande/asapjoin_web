# Frontend Web PWA — Backlog

## ✅ Implémenté (v1)

- [x] Projet Vite + React + TypeScript + Tailwind CSS v4
- [x] PWA : manifest, service worker (vite-plugin-pwa), icônes, offline fallback
- [x] Couche API : httpClient avec intercepteur JWT, refresh token, gestion erreurs
- [x] Types TypeScript alignés sur l'API backend
- [x] AuthProvider + useAuth (login, register, logout, refreshUser)
- [x] Layout mobile-first : TopBar, BottomNav, AppShell
- [x] Composants UI : Button, Input (avec variants, loading, error)
- [x] Page Login / Register
- [x] Page Recherche de trajets (avec filtres : origine, destination, date, places, colis)
- [x] Page Détail trajet (infos, conducteur, véhicule, notes, réservation)
- [x] Page Détail réservation (statut, paiement, annulation)
- [x] Page Espace conducteur (réservations reçues)
- [x] Page Portefeuille (solde, transactions)
- [x] Page Compte (profil, édition, liens rapides)
- [x] Page Messages (placeholder)
- [x] Page Hors ligne
- [x] Routeur avec toutes les routes
- [x] Hook useOnline (useSyncExternalStore)
- [x] Indicateur hors ligne dans la TopBar

## 🔲 À faire (prochaines itérations)

### Priorité haute
- [ ] **Création de trajet** : formulaire complet (CreateTripPage) — endpoint `POST /trips` existe
- [ ] **Gestion véhicules** : CRUD véhicules du conducteur — endpoints `GET/POST/PATCH/DELETE /vehicles` existent
- [ ] **Accepter/Refuser réservation** (côté conducteur) — endpoints `PATCH /bookings/:id/accept|reject` existent
- [ ] **Paiement Stripe** : intégration Stripe Elements pour confirmer le PaymentIntent — endpoint `POST /payments/create-intent` existe
- [ ] **Livraisons/Colis** : page dédiée avec formulaire de demande — endpoints `GET/POST /deliveries` existent
- [ ] **Reviews** : laisser un avis après un trajet — endpoints `GET/POST /reviews` existent

### Priorité moyenne
- [ ] **Messagerie temps réel** : WebSocket ou polling — endpoint `GET/POST /messages` à créer côté backend
- [ ] **Historique complet** : page dédiée listant tous les bookings passés du passager
- [ ] **Notifications push** : intégration Web Push API avec le service worker
- [ ] **Recherche avancée** : autocomplétion d'adresses (Google Places / Mapbox)
- [ ] **Carte interactive** : afficher les trajets sur une carte (Mapbox GL / Google Maps)
- [ ] **Mode sombre** : toggle dark mode avec Tailwind

### Priorité basse
- [ ] **Mot de passe oublié** : page + endpoint backend `POST /auth/forgot-password` à créer
- [ ] **Vérification email** : page + endpoint backend `POST /auth/verify-email` à créer
- [ ] **Upload photo de profil** : endpoint backend `POST /users/me/avatar` à créer
- [ ] **Demande de payout** : page + endpoint `POST /payouts/request` existe
- [ ] **Politique d'annulation** : affichage des politiques — endpoint `GET /policies` existe
- [ ] **Internationalisation (i18n)** : support anglais/français
- [ ] **Tests E2E** : Playwright ou Cypress
- [ ] **Animations** : transitions de page avec Framer Motion

## 🚧 Endpoints backend manquants

| Fonctionnalité | Endpoint nécessaire | Statut |
|---|---|---|
| Messagerie | `GET /messages`, `POST /messages`, WebSocket | ❌ À créer |
| Mot de passe oublié | `POST /auth/forgot-password` | ❌ À créer |
| Vérification email | `POST /auth/verify-email` | ❌ À créer |
| Upload avatar | `POST /users/me/avatar` | ❌ À créer |
| Recherche trajets publique | `GET /trips/search` (sans auth) | ⚠️ À vérifier |
