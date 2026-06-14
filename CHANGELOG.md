# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 2.0.0-beta.0 (2026-06-14)

La v1 du launcher n'était pas adaptée au système d'arcs changeants d'Arcend. À chaque
nouvel arc, les joueurs perdaient l'accès aux anciens puisqu'ils ne pouvaient pas relancer
un modpack obsolète. La v2 introduit un système **multi-instances** : chaque arc possède
son propre dossier et son modpack, et peut être rejoué en solo même hors-ligne. Les
runtimes Java sont partagés entre instances pour éviter les téléchargements redondants.

### Features

- Authentification Microsoft (connexion/déconnexion)
- Barre latérale avec thumbnails d'arcs et tri intelligent
- Bouton Play/Install contextuel selon l'état de l'arc
- Panneau de paramètres avec toggle console et dossier launcher
- Titlebar personnalisée (minimiser/fermer, drag de fenêtre)
- Affichage de la cover d'arc en grand
- Cache offline des données d'arcs (fonctionne sans connexion)

### Bug Fixes

- Correction de l'URL du packwiz-installer bootstrap
