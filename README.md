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
- Un compte **vendeur** déjà approuvé, "Boutique Sahara" : `vendeur@elalamia.dz` / `elalamia123`
- Un compte **client** : `client@elalamia.dz` / `elalamia123`

Pour une build de production :
```bash
npm run build
npm run start
```

## Ce qui est inclus

- **Boutique** : accueil (deals, best-sellers, nouveautés), catalogue filtrable/triable, fiche produit avec badge boutique, recherche
- **Panier & commande** : panier persistant par compte, formulaire de livraison (58 wilayas), paiement à la livraison (COD)
- **Comptes** : inscription / connexion (JWT + cookie httpOnly), historique des commandes
- **Multi-boutiques (marketplace)** :
  - N'importe quel client peut candidater pour devenir vendeur via `/sell`
  - L'admin approuve ou refuse les candidatures dans `/admin/vendors`
  - Une fois approuvé, le vendeur a son propre tableau de bord (`/vendor`) : gestion de ses produits, suivi de ses commandes et de son chiffre d'affaires — totalement isolé des autres vendeurs
  - Chaque produit affiche sa boutique d'origine ("Boutique officielle ELALAMIA" ou le nom du vendeur) sur les cartes produit et la fiche produit
- **Admin** (`/admin`, réservé au rôle `admin`) : tableau de bord, gestion des produits (créer / modifier / désactiver), gestion des commandes (changement de statut), gestion des candidatures vendeurs
- **Bilingue AR/FR** : bouton de bascule dans l'en-tête, interface RTL complète en arabe

## Ce qu'il reste à faire pour une mise en production réelle

Ce projet est une base fonctionnelle complète avec un vrai système multi-vendeurs (candidature → approbation → boutique). Avant un vrai lancement, il faudrait :
1. **Paiement en ligne réel** : intégrer CIB/Edahabia ou un agrégateur de paiement algérien (actuellement seul le paiement à la livraison est actif)
2. **Répartition des paiements vendeurs** : commission ELALAMIA + versement aux vendeurs (actuellement tout l'argent COD va au propriétaire de la plateforme ; il faudrait un système de règlement périodique par vendeur)
3. **Vraies photos produits** : remplacer les images de démonstration (actuellement générées via picsum.photos) par de vraies photos, avec upload d'images (S3, Cloudinary, etc.) — utile à la fois pour les produits et les logos de boutique
4. **Hébergement + domaine** : déployer sur un serveur avec Node.js (Vercel, un VPS, etc.) et passer sur PostgreSQL/MySQL si le volume grandit (SQLite convient bien jusqu'à un trafic modéré)
5. **Notifications SMS/WhatsApp** pour la confirmation des commandes (fréquent pour la vente COD en Algérie)
6. **Pages boutique publiques** (ex. `/boutique/boutique-sahara`) listant tous les produits d'un vendeur — la colonne `store_slug` est déjà prête pour ça
7. Changer `JWT_SECRET` (voir `.env.local.example`) et sécuriser le déploiement

## Structure du projet

```
src/
  app/            → pages (App Router) + routes API (src/app/api)
  components/      → composants UI réutilisables
  context/        → contexte langue (AR/FR) et panier
  lib/            → base de données (db.js), authentification (auth.js), i18n (i18n.js)
data/             → fichier SQLite (créé automatiquement)
```
