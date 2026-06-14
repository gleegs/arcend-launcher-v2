# Contribuer au Arcend Launcher V2

Ce document décrit les conventions, outils et workflow de développement mis en place sur le projet. Tout contributeur doit le lire et le respecter.

---

## Sommaire

- [Contribuer au Arcend Launcher V2](#contribuer-au-arcend-launcher-v2)
  - [Sommaire](#sommaire)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Conventional Commits](#conventional-commits)
    - [Format détaillé](#format-détaillé)
    - [Types autorisés](#types-autorisés)
    - [Exemples](#exemples)
  - [Commits interactifs avec Commitizen](#commits-interactifs-avec-commitizen)
  - [Issues et Pull Requests](#issues-et-pull-requests)
    - [Découpage en sub-issues](#découpage-en-sub-issues)
    - [Squash and merge](#squash-and-merge)
  - [Qualité de code](#qualité-de-code)
    - [ESLint](#eslint)
    - [Prettier](#prettier)
    - [TypeScript strict](#typescript-strict)
  - [Hooks Git (Husky + lint-staged)](#hooks-git-husky--lint-staged)
    - [`pre-commit`](#pre-commit)
    - [`commit-msg`](#commit-msg)
  - [Versioning et Changelog (Standard-Version)](#versioning-et-changelog-standard-version)
    - [Créer une release](#créer-une-release)
    - [Pousser la release](#pousser-la-release)
  - [CI/CD (GitHub Actions)](#cicd-github-actions)
    - [Ce qu'il fait](#ce-quil-fait)
    - [Artefacts générés](#artefacts-générés)
  - [Workflow quotidien](#workflow-quotidien)
    - [Commandes utiles](#commandes-utiles)

---

## Prérequis

- **Node.js** 22+
- **npm** (fourni avec Node.js)
- **Git** 2.9+

---

## Installation

```bash
# Cloner le repo
git clone https://github.com/gleegs/arcend-launcher-v2.git
cd arcend-launcher-v2

# Installer les dépendances (hooks Husky inclus via `npm prepare`)
npm ci
```

Les hooks Husky s'installent automatiquement grâce au script `prepare` dans `package.json`.

---

## Conventional Commits

Tous les messages de commit doivent respecter le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description
```

### Format détaillé

```
type(scope)!: description

[body optionnel]

[footer(s) optionnel(s)]
```

- `!` indique un **breaking change** (ex: `feat(api)!: nouvelle API incompatible`)

### Types autorisés

| Type       | Description                                           | Visible dans le CHANGELOG |
| ---------- | ----------------------------------------------------- | ------------------------- |
| `feat`     | Nouvelle fonctionnalité **visible par l'utilisateur** | ✅ Features               |
| `fix`      | Correction de bug                                     | ✅ Bug Fixes              |
| `perf`     | Amélioration des performances                         | ❌ Masqué                 |
| `refactor` | Refactoring sans changement de comportement           | ❌ Masqué                 |
| `docs`     | Documentation uniquement                              | ❌ Masqué                 |
| `style`    | Formatting, espaces (pas de logique)                  | ❌ Masqué                 |
| `test`     | Ajout ou modification de tests                        | ❌ Masqué                 |
| `build`    | Système de build, dépendances                         | ❌ Masqué                 |
| `ci`       | Configuration CI/CD                                   | ❌ Masqué                 |
| `chore`    | Tâches de maintenance                                 | ❌ Masqué                 |

> **Règle d'or :** Seuls `feat` et `fix` apparaissent dans le CHANGELOG. Tout ce qui est interne (architecture, IPC, services, tests, CI) doit utiliser `chore`, `refactor`, `test`, etc.

### Exemples

```bash
feat(ui): ajout du bouton de RAM
fix(auth): correction du refresh token
docs(readme): mise à jour de l'installation
refactor(api): extraction du service d'authentification
ci(actions): ajout du build macOS et Linux
```

### Quand utiliser `feat` vs `chore`

Le type `feat` est réservé aux changements que le **joueur** peut voir ou ressentir. Tout le reste est `chore` ou `refactor`.

| Changement                         | Type    | Pourquoi                         |
| ---------------------------------- | ------- | -------------------------------- |
| Nouveau bouton dans l'UI           | `feat`  | L'utilisateur voit le changement |
| Système d'auth Microsoft           | `feat`  | L'utilisateur peut se connecter  |
| Refactor du service d'arcs         | `chore` | Aucun changement visible         |
| Ajout d'un wrapper IPC             | `chore` | Interne                          |
| Tests unitaires                    | `test`  | Interne                          |
| Correction d'un crash au lancement | `fix`   | L'utilisateur est impacté        |

### Langue des commits

Tous les messages de commit doivent être rédigés en **anglais** pour rester cohérents avec les conventions standard et le CHANGELOG généré.

> **Note :** Les commits non conformes sont **automatiquement rejetés** par commitlint (hook `commit-msg`).

---

## Commits interactifs avec Commitizen

Si tu n'es pas à l'aise avec le format, utilise l'assistant interactif :

```bash
npm run commit
```

Commitizen te guidera étape par étape (type, scope, description, breaking change, etc.) et génèrera un message conforme.

---

## Issues et Pull Requests

### Découpage en sub-issues

**Une feature utilisateur = une issue parent = une PR = une ligne de CHANGELOG.**

Quand une feature est complexe (ex: authentification), la découper en **sub-issues** dans Linear, mais tout développer sur la **branche de l'issue parent** :

```
DEV-XX: Authentification Microsoft (parent)
  ├── DEV-XX-a: Service auth MSMC (sub-issue)
  ├── DEV-XX-b: Tests du service (sub-issue)
  └── DEV-XX-c: UI AuthButton (sub-issue)
```

- **Une seule branche Git** (celle du parent) → tout le travail est groupé
- **Un seul PR** qui merge l'ensemble → une seule ligne dans le CHANGELOG
- Les sub-issues permettent de tracker l'avancement finement dans Linear

**À ne pas faire :** créer des issues séparées avec des branches séparées pour le service, les tests et l'UI d'une même feature. Cela génère plusieurs commits `feat` sur `main` pour ce qui est, du point de vue de l'utilisateur, une seule fonctionnalité.

### Squash and merge

Les PR doivent être mergées avec **Squash and merge** sur GitHub. Cela garantit qu'une PR entière produit **un seul commit** sur `main`, peu importe le nombre de commits intermédiaires sur la branche.

Configuré dans : GitHub → Settings → General → Pull Requests → cocher **"Allow squash merging"** (et désactiver les autres méthodes pour éviter les erreurs).

---

## Qualité de code

### ESLint

ESLint est configuré avec les plugins TypeScript, React et React Hooks.

```bash
# Vérifier le code
npm run lint

# Vérifier et corriger automatiquement
npm run lint -- --fix
```

**Règles notables :**

- `@typescript-eslint/no-unused-vars` : warning, les arguments préfixés `_` sont ignorés
- `@typescript-eslint/no-explicit-any` : warning
- `react/react-in-jsx-scope` : désactivé (React 19)
- `import/no-unresolved` : erreur

### Prettier

Prettier formate le code automatiquement selon les conventions du projet.

```bash
# Formater le code
npm run format

# Vérifier le formatage sans modifier
npm run format:check
```

**Configuration (`.prettierrc`) :**

| Option           | Valeur     |
| ---------------- | ---------- |
| `semi`           | `false`    |
| `singleQuote`    | `true`     |
| `tabWidth`       | `2`        |
| `trailingComma`  | `"es5"`    |
| `printWidth`     | `100`      |
| `bracketSpacing` | `true`     |
| `arrowParens`    | `"always"` |
| `endOfLine`      | `"lf"`     |

### TypeScript strict

Le mode strict est activé dans `tsconfig.json` avec les options suivantes :

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `strictBindCallApply: true`
- `strictPropertyInitialization: true`
- `noImplicitThis: true`
- `alwaysStrict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

---

## Hooks Git (Husky + lint-staged)

Deux hooks sont configurés via Husky :

### `pre-commit`

Lance **lint-staged** sur les fichiers modifiés uniquement :

- `*.{ts,tsx,js,jsx}` → ESLint `--fix` + Prettier `--write`
- `*.{json,css,md}` → Prettier `--write`

### `commit-msg`

Valide le message de commit via **commitlint**. Rejette le commit si le message ne respecte pas le format Conventional Commits.

---

## Versioning et Changelog (Standard-Version)

Le versioning suit le standard [SemVer](https://semver.org/) (MAJOR.MINOR.PATCH).

### Créer une release

```bash
# Pour une release normale
npm run release

# Pour la première release du projet
npm run release:first
```

`npm run release` effectue automatiquement :

1. **Bump de version** dans `package.json` selon les commits :
   - `feat:` → **MINOR** (ex: 2.0.0 → 2.1.0)
   - `feat!:` ou `BREAKING CHANGE:` → **MAJOR** (ex: 2.0.0 → 3.0.0)
   - `fix:` → **PATCH** (ex: 2.0.0 → 2.0.1)
2. **Génération du `CHANGELOG.md`** à partir des commits conventional
3. **Commit** automatique des changements
4. **Création du tag Git** avec le préfixe `v` (ex: `v2.1.0`)

### Pousser la release

```bash
git push --follow-tags origin main
```

Le tag poussé déclenchera automatiquement le pipeline CI/CD.

---

## CI/CD (GitHub Actions)

Un workflow GitHub Actions se déclenche automatiquement sur chaque push de tag `v*`.

### Ce qu'il fait

| Étape    | Description                              |
| -------- | ---------------------------------------- |
| Checkout | Récupère le code source                  |
| Setup    | Installe Node.js 20                      |
| Install  | `npm ci`                                 |
| Build    | Compile le launcher                      |
| Publish  | Publie les artefacts sur GitHub Releases |

### Artefacts générés

| OS      | Format        |
| ------- | ------------- |
| Windows | `.exe` (NSIS) |
| macOS   | `.dmg`        |
| Linux   | `.AppImage`   |

---

## Workflow quotidien

Résumé du flux de développement complet :

```
[Code]
  ↓
[git add <fichiers>]
  ↓
[git commit] ou [npm run commit]  ← Husky: lint-staged + commitlint
  ↓
[Répéter pour d'autres commits]
  ↓
[npm run release]                 ← Standard-Version: bump + CHANGELOG + tag
  ↓
[git push --follow-tags origin main]  ← GitHub Actions: build + publish
  ↓
[Release publiée sur GitHub]
```

### Commandes utiles

| Commande                | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm start`             | Lancer le launcher en mode développement |
| `npm run lint`          | Vérifier le code avec ESLint             |
| `npm run format`        | Formater le code avec Prettier           |
| `npm run format:check`  | Vérifier le formatage sans modifier      |
| `npm run commit`        | Assistant commit interactif (Commitizen) |
| `npm run release`       | Créer une release (version + changelog)  |
| `npm run release:first` | Première release du projet               |
| `npm run make`          | Build l'installateur Windows             |
