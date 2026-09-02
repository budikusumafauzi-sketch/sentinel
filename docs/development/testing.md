# Testing Guide

## Test Framework

- **Backend**: Jest + Supertest
- **Mobile**: Jest + React Native Testing Library (foundation)
- **Shared packages**: Jest

## Running Tests

```bash
# Run all tests
pnpm test

# Run backend tests only
pnpm --filter @sentinel/backend test

# Run backend e2e tests
pnpm --filter @sentinel/backend test:e2e

# Run mobile tests only
pnpm --filter @sentinel/mobile test
```

## Test Structure

### Backend

```
apps/backend/
├── test/
│   ├── health.controller.spec.ts    # Unit tests
│   ├── health.e2e-spec.ts           # E2E tests
│   └── jest-e2e.json                # E2E Jest config
└── jest.config.js                   # Unit Jest config
```

### Conventions

- Unit tests: `*.spec.ts` alongside source or in `test/`
- E2E tests: `*.e2e-spec.ts` in `test/`
- Test files mirror the source structure
- Use descriptive `describe` and `it` blocks

## Coverage

```bash
pnpm --filter @sentinel/backend test -- --coverage
```

## Future Testing Areas

As defined in the PRD (implemented in later phases):

- Component tests (React Native Testing Library)
- Integration tests
- API security tests
- OWASP MASVS/MASTG verification
- E2E flows
