# ELALAMIA 🇩🇿

Une marketplace en ligne multi-catégories pour les acheteurs algériens — dans l'esprit d'AliExpress / Temu, avec une identité visuelle inspirée du souk (tickets de prix, tampons de réduction), bilingue **arabe / français**, prix en **DA**, livraison vers les **58 wilayas**, et paiement à la livraison.

Application full-stack : **Next.js 16 (App Router)** + **SQLite** (base de données réelle, fichier local, aucun service externe requis) + **JWT** pour l'authentification.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). La base de données SQLite est créée et pré-remplie automatiquement au premier lancement (`data/elalamia.sqlite`), avec :
- 10 catégories, 24 produits (AR + FR)
- Un compte **admin** : `admin@elalamia.dz` / `elalamia123`
- Un compte **client** : `client@elalamia.dz` / `elalamia123`

Pour une build de production :
```bash
npm run build
npm run start
```

## Ce qui est inclus

- **Boutique** : accueil (deals, best-sellers, nouveautés), catalogue filtrable/triable, fiche produit, recherche
- **Panier & commande** : panier persistant par compte, formulaire de livraison (58 wilayas), paiement à la livraison (COD)
- **Comptes** : inscription / connexion (JWT + cookie httpOnly), historique des commandes
- **Admin** (`/admin`, réservé au rôle `admin`) : tableau de bord, gestion des produits (créer / modifier / désactiver), gestion des commandes (changement de statut)
- **Bilingue AR/FR** : bouton de bascule dans l'en-tête, interface RTL complète en arabe

## Ce qu'il reste à faire pour une mise en production réelle

Ce projet est une base fonctionnelle complète (MVP mono-boutique, comme demandé). Avant un vrai lancement, il faudrait :
1. **Multi-vendeurs** : ajouter des comptes vendeurs, des tableaux de bord vendeur, et une commission — la structure de la base est prête à être étendue (ajouter `vendor_id` sur `products` et une table `vendors`)
2. **Paiement en ligne réel** : intégrer CIB/Edahabia ou un agrégateur de paiement algérien (actuellement seul le paiement à la livraison est actif)
3. **Vraies photos produits** : remplacer les images de démonstration (actuellement générées via picsum.photos) par de vraies photos, avec upload d'images (S3, Cloudinary, etc.)
4. **Hébergement + domaine** : déployer sur un serveur avec Node.js (Vercel, un VPS, etc.) et passer sur PostgreSQL/MySQL si le volume grandit (SQLite convient bien jusqu'à un trafic modéré)
5. **Notifications SMS/WhatsApp** pour la confirmation des commandes (fréquent pour la vente COD en Algérie)
6. Changer `JWT_SECRET` (voir `.env.local.example`) et sécuriser le déploiement

## Structure du projet

```
src/
  app/            → pages (App Router) + routes API (src/app/api)
  components/      → composants UI réutilisables
  context/        → contexte langue (AR/FR) et panier
  lib/            → base de données (db.js), authentification (auth.js), i18n (i18n.js)
data/             → fichier SQLite (créé automatiquement)
```
