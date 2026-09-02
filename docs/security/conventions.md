# Security Conventions

> **Reference**: OWASP MASVS/MASTG

## Secrets Management

- **Never commit secrets** to the repository
- Use `.env` files for local configuration (ignored by `.gitignore`)
- Use `.env.example` files to document required variables without values
- Production secrets must be managed through secure infrastructure (not source code)

## Environment Variables

- All sensitive configuration uses environment variables
- Backend uses `@nestjs/config` for validated env access
- No hardcoded API keys, passwords, tokens, or database credentials

## Logging

- Never log passwords, tokens, or access credentials
- Never log raw sensitive user content
- Use structured logging
- Backend logs should include request correlation IDs (future phase)

## Data Handling

- Collect only necessary data
- Prefer metadata over raw content
- Use secure storage for tokens and cryptographic material
- Do not use ordinary local storage for secrets

## Development Practices

- Dependency versions are pinned via lockfile
- Regular dependency auditing (`pnpm audit`)
- Static analysis via ESLint with TypeScript rules
- Strict TypeScript configuration

## Future Security Work

- Authentication and authorization (Phase 3)
- Threat model documentation (Phase 9)
- Security hardening review (Phase 9)
- OWASP MASVS/MASTG verification (Phase 9-10)
