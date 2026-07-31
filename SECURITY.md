# Security Policy

## Supported versions

Respiro is currently maintained from the `main` branch. Security fixes are applied to the latest revision only; older commits and independently modified deployments are not supported.

| Version | Supported |
|---|---|
| Latest `main` | Yes |
| Older revisions | No |

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's private reporting form:

<https://github.com/harunmansor/respiro/security/advisories/new>

Include, where possible:

- The affected page, action, component, or dependency
- Steps required to reproduce the issue
- The security impact and who could be affected
- Whether authentication or a specific deployment configuration is required
- A minimal proof of concept, screenshots, or relevant logs with secrets removed
- Any mitigation or patch you recommend

You should receive an acknowledgement within seven days. Validation and remediation time will depend on severity and reproducibility. Please allow a reasonable period for investigation and a coordinated fix before public disclosure.

This project does not currently operate a paid bug-bounty program. Good-faith reports are welcome and reporters may be credited in a security advisory with their consent.

## Scope

Security reports may cover:

- Authentication, session management, and account isolation
- Unauthorized access to another user's sessions, templates, or table runs
- Injection, cross-site scripting, cross-site request forgery, or request smuggling
- Exposure of credentials, password hashes, or private training data
- Vulnerable runtime dependencies with a practical impact on this application
- Docker, PostgreSQL, PWA, or reverse-proxy configurations provided by this repository

The following are generally out of scope unless they demonstrate a concrete security impact:

- Findings that only affect unsupported browsers or modified deployments
- Missing security headers that are already present in the current `main` branch
- Automated scanner output without reproduction or impact analysis
- Denial of service requiring prolonged access to the host machine itself
- Social engineering, physical attacks, or attacks against GitHub and third-party infrastructure
- Freediving training or medical-safety advice; safety concerns may still be reported as normal issues

## Safe-harbor intent

Good-faith research should avoid privacy violations, data destruction, service disruption, and access beyond what is necessary to demonstrate a finding. Use accounts and data you control. Stop testing and report immediately if you encounter another person's private information.

The maintainer does not intend to pursue action against researchers who follow this policy, act in good faith, and comply with applicable law.

## Deployment responsibility

The bundled Docker Compose configuration supports trusted local-network use over HTTP. Public or untrusted-network deployments must add HTTPS, generate unique secrets and database credentials, keep dependencies updated, maintain backups, and apply appropriate monitoring and network controls.
