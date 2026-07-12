## Description

<!-- Briefly describe what this PR does and why. -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] Tests
- [ ] Config / CI / tooling

## Testing

<!-- How was this tested? Include test commands you ran. -->
- [ ] `npm run build` passes
- [ ] `npm test` passes (or N/A)
- [ ] Playwright smoke tests pass (or N/A)
- [ ] Manual testing done (describe)

## Checklist

- [ ] Code follows the project's TypeScript strict patterns
- [ ] No `any` types added — prefer `unknown` with narrowing
- [ ] Prisma queries use the singleton from `@/lib/prisma`
- [ ] API routes have proper error handling (try/catch + error response)
- [ ] Env vars: `NEXT_PUBLIC_` prefix used for client-side vars
- [ ] No hardcoded secrets or credentials

## Screenshots (if UI change)

<!-- Before/after screenshots help a lot. -->

## Related issues

<!-- Closes #123, relates to #456 -->
