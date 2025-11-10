# <img src="public/gelutin-icon.png" alt="Logo Gelutin" width="48"/> Gelutin - Wakfu App Companion

Gelutin est une application qui permet gérer plusieurs fenêtres Wakfu simultanément avec auto-focus et navigation rapide entre les fenêtres.

**Note:** L'application a été développée pour fonctionner sur Windows.

**Note 2:** Wakfu est une marque déposée d'Ankama Games. Cette application est un projet indépendant non affilié à Ankama.

## Fonctionnalités

![Logo Gelutin](public/gelutin-app.png)

### Auto-Focus
Détecte automatiquement le tour d'un personnage en combat et bascule vers sa fenêtre.

**Modes de détection:**
- **Par pixels**: Analyse une zone de l'écran pour détecter les couleurs du tour de combat
- **Par nom de fenêtre**: Détecte les changements dans le titre de la fenêtre (/!\ Ne fonctionne qu'en mode Hero si le personnage principal n'est pas le premier joueur)

### Organizer
Navigation rapide entre les personnages via des raccourcis clavier personnalisables.

**Raccourcis par défaut:**
- `Tab`: Personnage suivant
- `Ctrl+Tab`: Personnage précédent

### Interface
- Overlay discret et rétractable
- Orientation horizontale ou verticale

## Configuration

### Paramètres
1. **Mode Auto-Focus**: Choisir entre détection par pixels ou nom de fenêtre
2. **Raccourcis clavier**: Personnaliser les touches de navigation
3. **Orientation**: Basculer entre orientation horizontal et vertical

## Installation

### Prérequis
- Node.js 18+
- Git
- Windows

### Étapes
```bash
# Cloner le repository
git clone https://github.com/Kabaal06/gelutin.git
cd gelutin

# Installer les dépendances
npm install
```

## Développement
```bash
# Lancer en mode dev (Angular + Electron)
npm run electron:start

# Angular uniquement
npm start

# Compiler Electron uniquement
npm run electron:compile
```

## Build
```bash
# Build complet
npm run electron:build

# Créer un package
npm run electron:package

# Créer un installateur Windows
npm run electron:make
```

Les installateurs sont générés dans `/out`

## Technologies

- Angular 20
- Electron 39
- Angular Material
- Koffi (APIs Windows)
- TypeScript
- Electron Store

## Licence

MIT License

## Copyright

Wakfu © Ankama Games. Cette application est un projet indépendant non affilié à Ankama Games.