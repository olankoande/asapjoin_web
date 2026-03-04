# Frontend Backlog — Delivery Module (PWA)

## TODO

### Admin Settings UI
- [ ] Le module admin n'existe pas dans /web (il est dans /admin)
- [ ] Ajouter page admin/settings dans /admin pour modifier `deliveries_min_hours_before_departure` et `deliveries_min_minutes_before_departure`
- [ ] L'endpoint backend est prêt : `GET /api/v1/admin/settings` et `PUT /api/v1/admin/settings`

### DeliveriesPage — Onglet Driver
- [ ] Ajouter un 3ème onglet "Conducteur" dans DeliveriesPage pour les livraisons des trajets du conducteur
- [ ] Afficher les actions driver : Accepter / Refuser / En transit / Livré
- [ ] Utiliser `deliveriesApi.driverDeliveries()` pour charger les données

### Badges delivery_mode
- [ ] Afficher badge "⚡ Accepté automatiquement" si `delivery.trip.delivery_mode === 'instant'` et status === 'accepted'
- [ ] Afficher badge "⏳ En attente d'acceptation" si `delivery.trip.delivery_mode === 'manual'` et status === 'pending'

### Notifications in-app
- [ ] Afficher toast/notification quand une livraison change de statut
- [ ] Afficher message contextuel "Trop tard avant départ" (DELIVERY_TOO_LATE_BEFORE_DEPARTURE)

### Paiement delivery
- [ ] Intégrer le flow de paiement Stripe pour les livraisons (après acceptation)
- [ ] Afficher bouton "Payer" quand status = 'accepted' et amount_total > 0

## DONE
- [x] Types mis à jour : `delivery_mode`, `booking_mode` dans Trip, timestamps dans Delivery
- [x] CreateTripPage : toggle "Livraison instantanée" ajouté
- [x] SendParcelPage : gestion des erreurs business (DELIVERY_TOO_LATE_BEFORE_DEPARTURE, etc.)
- [x] API client : endpoints deliveries complets (create, accept, reject, cancel, in-transit, delivered, confirm-receipt, sent, received, driver)
