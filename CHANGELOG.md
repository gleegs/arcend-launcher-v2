# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0-beta.1](https://github.com/gleegs/arcend-launcher-v2/compare/v2.0.0-beta.0...v2.0.0-beta.1) (2026-06-17)

### Features

- **arc:** add per-arc settings panel ([94414cf](https://github.com/gleegs/arcend-launcher-v2/commit/94414cf6f172453d16289902b589cdc2b4da6326))
- **arc:** add per-arc settings panel ([#35](https://github.com/gleegs/arcend-launcher-v2/issues/35)) ([663e8c9](https://github.com/gleegs/arcend-launcher-v2/commit/663e8c9ed71e29acfa5181dd9d3b8fe732a27cd8))
- **arc:** add uninstall button in arc settings ([81c4fc9](https://github.com/gleegs/arcend-launcher-v2/commit/81c4fc9bd2eaaedd53d4389fb91e88991a99158a))
- **arc:** add uninstall button in arc settings ([#36](https://github.com/gleegs/arcend-launcher-v2/issues/36)) ([5a73c5f](https://github.com/gleegs/arcend-launcher-v2/commit/5a73c5fed02934fceb2b823a9c0bb9cb4dd8b722))
- **sidebar:** display live player count in sidebar via SLP protocol ([0dfc920](https://github.com/gleegs/arcend-launcher-v2/commit/0dfc9202d1231b65de50a2ae116e7b75bff04f92))
- **sidebar:** display live player count in sidebar via SLP protocol ([#34](https://github.com/gleegs/arcend-launcher-v2/issues/34)) ([4783089](https://github.com/gleegs/arcend-launcher-v2/commit/4783089febf90522676397f9f75ea8edf808c1c4))

### Bug Fixes

- **sidebar:** display dynamic launcher version ([7701f56](https://github.com/gleegs/arcend-launcher-v2/commit/7701f5612b95a90fa4e3e1601b72d3df1b806302))
- **sidebar:** display dynamic launcher version ([#33](https://github.com/gleegs/arcend-launcher-v2/issues/33)) ([9b8fd36](https://github.com/gleegs/arcend-launcher-v2/commit/9b8fd36b550e8a269f5054de5ea79f1343c3cdd6))

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
