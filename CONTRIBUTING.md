# Contributing to Second Brain

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Development Process

1. **Fork** the repo on GitHub.
2. **Clone** the project to your own machine.
3. **Branch** off of `main` for your feature or bug fix.
4. **Develop** your code. Ensure you run `npm run lint` and `npx tsc --noEmit` before committing.
5. **Commit** your changes following conventional commit messages.
6. **Push** to your fork and submit a **Pull Request**.

## Pull Request Guidelines

- Ensure your PR description clearly describes the problem and solution.
- Link any relevant issues.
- Keep PRs as small and focused as possible.
- If introducing new UI components, use the shared primitives in `src/components/ui/`.
- Maintain strict TypeScript safety (no `any` types unless absolutely necessary with justification).

## Architectural Guidelines

- **No business logic in the UI**: All heavy lifting (chunking, embeddings, search) MUST happen in the background service worker or dedicated utility classes.
- **Local-First**: Do not add dependencies that send user data to remote servers without explicit user opt-in (aside from the configured LLM API).
- **Performance**: Remember that this runs in a browser extension context. Be mindful of memory usage, especially with `Transformers.js`.

## Code Style

- We use standard Prettier rules.
- We use `oxlint` for fast linting.
- Follow the React component composition patterns established in the project.

Thank you for contributing!
