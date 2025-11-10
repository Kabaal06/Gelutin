# Electron + Angular

Ce projet combine Electron avec Angular.

## Structure

- `/src` - Application Angular
- `/electron` - Code Electron en TypeScript
  - `main.ts` - Processus principal Electron
  - `preload.ts` - Script de preload pour la communication sécurisée
  - `tsconfig.json` - Configuration TypeScript pour Electron

## Scripts disponibles

### Développement

- `npm start` - Lance uniquement le serveur de développement Angular (http://localhost:4200)
- `npm run electron:start` - Lance Angular ET Electron ensemble en mode développement

### Build et Package

- `npm run electron:build` - Build l'application Angular et compile le code Electron
- `npm run electron:package` - Crée un package Electron de l'application
- `npm run electron:make` - Crée des installateurs pour l'application

### Scripts utilitaires

- `npm run electron:compile` - Compile uniquement le code TypeScript d'Electron
- `npm run electron:dev` - Lance Electron en mode développement (nécessite que Angular soit déjà lancé)

## Workflow de développement

1. Lancer l'application en mode développement :
   ```bash
   npm run electron:start
   ```
   Cela lance Angular sur http://localhost:4200 et ouvre Electron qui pointe vers ce serveur.

2. Modifier votre code Angular ou Electron - les changements seront reflétés automatiquement.

## Build de production

Pour créer un installateur de votre application :

```bash
npm run electron:make
```

Les installateurs seront générés dans le dossier `/out`.

## Configuration

- La configuration Electron Forge se trouve dans `package.json` sous `config.forge`
- Le processus principal Electron charge l'app Angular depuis `http://localhost:4200` en dev
- En production, il charge depuis `dist/Gelutin/browser/index.html`
