# Copilot repository adapter

`AGENTS.md` is the canonical, provider-neutral project context. Read it before making repository changes and keep project facts and conventions there rather than maintaining a second detailed description here. Copilot surfaces differ in whether they load `AGENTS.md` automatically; open it explicitly when it is not present in context.

The following quick reference keeps this file useful on Copilot surfaces that only load repository-wide instructions:

- Use Node.js 24 and pnpm 10.34.5. Install with `pnpm install --frozen-lockfile`; validate with `pnpm typecheck` and `pnpm build`.
- No test runner or lint script is currently configured; do not report tests or lint as run.
- `lib/api-spec/openapi.yaml` is the API contract. Regenerate API clients with `pnpm --filter @workspace/api-spec run codegen`; do not hand-edit generated output.
- The public UI supports French, Malagasy, and English; follow the locale and route/prerender guidance in `AGENTS.md`.

Do not treat frontend route guards, browser-stored roles, or `VITE_*` values as backend authorization or secrets. Preserve unrelated local changes and follow the inspect → understand → plan → modify → verify → review diff → report workflow in `AGENTS.md`.
