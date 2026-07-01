# Le Grand Quizz

Application de création et de jeu de quizz en temps réel, partie de la suite **VGAMES**.

> L'utilisateur doit être connecté sur le portail [VGAMES](http://localhost:3000) pour créer et héberger des quizz. Les joueurs peuvent rejoindre une salle sans compte.

## Fonctionnalités

- Créer des quizz avec titre, description, catégorie et questions à choix multiples (4 options, 1 bonne réponse)
- Modifier et supprimer ses quizz
- **Héberger une partie en temps réel** : salle d'attente avec code de salle, chat, liste des joueurs
- **Rejoindre une partie** : sans compte, avec juste un code de salle et un pseudo
- Scoring : +1000 points par bonne réponse
- Historique des parties sauvegardé en base de données
- Consulter les quizz publics des autres utilisateurs

## SSO — Authentification unique

Le Grand Quizz ne gère pas ses propres comptes. Il vérifie le **cookie JWT** émis par VGAMES lors de la connexion. La même `SECRET_KEY` est partagée entre les deux applications.

Si l'utilisateur n'est pas connecté, il est automatiquement redirigé vers `VGAMES_URL/login`.

Les joueurs rejoignant une salle (`/join`) n'ont pas besoin de compte — ils saisissent juste un pseudo.

## Tech Stack

| Couche | Technologie |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Temps réel | Socket.io 4 |
| Template engine | EJS |
| Base de données | MongoDB (Mongoose) — base `LEGRANDQUIZZ` |
| Auth | JWT vérifié localement (clé partagée VGAMES) |
| CSS | Tailwind CSS (Play CDN) |

## Structure du projet

```
LeGrandQuizz/
├── app.js                        # Point d'entrée, port 3001, Socket.io game engine
├── controllers/
│   └── quizzController.js        # Rendu des pages EJS (CRUD + rooms)
├── middleware/
│   └── authMiddleware.js         # requireAuth / optionalAuth (JWT cookie)
├── models/
│   ├── Quiz.js                   # title, description, category, questions[], owner, isPublic
│   └── GameHistory.js            # Historique des parties jouées
├── routes/
│   └── quizzRoutes.js            # Routes EJS (+ REST API dans app.js)
├── views/
│   ├── partials/
│   │   ├── header.ejs            # Navbar Tailwind
│   │   └── footer.ejs
│   └── quizz/
│       ├── all_quizz.ejs         # Grille des quizz (mes quizz + quizz publics)
│       ├── create_quizz.ejs      # Formulaire dynamique de création
│       ├── edit_quizz.ejs        # Formulaire dynamique d'édition
│       ├── host_room.ejs         # Interface hôte (salle d'attente + jeu temps réel)
│       └── join_room.ejs         # Interface joueur (rejoindre + jeu temps réel)
└── public/
    └── styles.css
```

## Installation et démarrage

### Prérequis

- Node.js 18+
- MongoDB en local sur le port `27017`
- **VGAMES** démarré sur le port `3000` (nécessaire pour la connexion)

### 1. Configurer l'environnement

```env
SECRET_KEY='...'              # Identique à la SECRET_KEY de VGAMES
PORT=3001
VGAMES_URL=http://localhost:3000
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Démarrer l'application

```bash
npm run serve
# → http://localhost:3001
```

## Routes

### Pages EJS (rendu serveur)

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| GET | `/all_quizz` | Oui | Liste des quizz |
| GET | `/create_quizz` | Oui | Formulaire de création |
| GET | `/edit_quizz/:id` | Oui | Formulaire de modification |
| GET | `/host/:id` | Oui | Héberger une partie |
| GET | `/join` | Non | Rejoindre une partie (avec `?code=XXXXXX`) |

### REST API (appelée en AJAX depuis les pages)

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| GET | `/api/quizzes` | Oui | Tous les quizz publics |
| GET | `/api/quizzes/user/:id` | Oui | Quizz d'un utilisateur |
| GET | `/api/quizzes/:id` | Oui | Un quizz |
| POST | `/api/quizzes/create` | Oui | Créer un quizz |
| PUT | `/api/quizzes/:id` | Oui | Modifier un quizz |
| DELETE | `/api/quizzes/:id` | Oui | Supprimer un quizz |
| GET | `/api/history/user/:id` | Oui | Historique de parties |

## Modèle de données

```
Quiz
 ├── title
 ├── description
 ├── category ('history' | 'science' | 'geography' | ...)
 ├── timeLimit (number, secondes)
 ├── owner (ref User VGAMES)
 ├── isPublic (boolean)
 ├── image (URL optionnelle)
 └── questions[]
       ├── text
       ├── options[4] (4 choix)
       └── correctOption (index 0-3)

GameHistory
 ├── quizId
 ├── quizTitle
 ├── roomCode
 ├── playedAt
 └── players[]
       ├── userId
       ├── username
       ├── score
       └── avatar
```

## Flux de jeu

1. L'hôte va sur `/host/:quizId` → une salle est créée avec un code à 6 chiffres
2. Les joueurs vont sur `/join?code=XXXXXX` → ils saisissent leur pseudo et rejoignent
3. L'hôte démarre la partie (2+ joueurs requis)
4. Pour chaque question : les joueurs soumettent une réponse → l'hôte révèle → scores mis à jour
5. Fin de partie : classement affiché, historique sauvegardé en MongoDB

## Auteur

Miro_ — VGAMES 2025
