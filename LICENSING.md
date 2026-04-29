# Licensing

imprint is **open core**. Two licenses, one repository, one install graph.

## The Apache surface

The free, MIT-spirited, semver-stable surface. Everything you need to ship
beautiful invoices, contracts, statements, tickets, certificates, resumes, and
reports.

| Package                  | License        |
| ------------------------ | -------------- |
| `@imprint/core`          | **Apache-2.0** |
| `@imprint/react`         | **Apache-2.0** |
| `@imprint/tailwind`      | **Apache-2.0** |
| `@imprint/cli`           | **Apache-2.0** |
| `@imprint/next`          | **Apache-2.0** |
| `@imprint/vite`          | **Apache-2.0** |
| `@imprint/eslint-plugin` | **Apache-2.0** |

Apache-2.0 (not MIT) for the explicit patent grant — essential when the
source touches font tech and PDF parsing.

## The BSL surface

The features regulated enterprises buy anyway. Source-available, free for
non-production and internal use, paid for production deployments. Reverts
to **Apache-2.0** four years after each release.

| Package           | License      | Use case                                   |
| ----------------- | ------------ | ------------------------------------------ |
| `@imprint/print`  | **BSL 1.1**  | PDF/X-4, CMYK, ICC profiles, factur-X      |
| `@imprint/sign`   | **BSL 1.1**  | PKCS#7 detached signatures                 |
| `@imprint/ua`     | **BSL 1.1**  | PDF/UA-1 tagged PDF, structure tree        |

BSL 1.1 follows the precedent set by Sentry, MariaDB, and CockroachDB. It
prevents AWS-style "managed imprint" without alienating users — a commercial
license is available for genuine enterprise use, and the four-year sunset
addresses OSS-purist concerns.

See [`LICENSE-BSL`](LICENSE-BSL) for the full text.

## Frequently asked

**Can I use `@imprint/print` in my SaaS to generate PDFs for my customers?**
Yes, with a commercial license. Email
[tamimbinhakim.work@gmail.com](mailto:tamimbinhakim.work@gmail.com).

**Can I use it locally during development without a license?**
Yes. The BSL "Additional Use Grant" covers non-production internal use.

**Can I use the Apache packages without ever touching BSL?**
Yes. The Apache surface is fully self-contained. BSL packages are opt-in.

**Will the BSL packages ever become Apache-2.0?**
Yes — automatically, four years after each release, on a per-version basis.
The change date is encoded in the `LICENSE-BSL` file shipped with each
release.

**Is this a CLA?**
No. Contributions to BSL packages are accepted under the Developer
Certificate of Origin, with the understanding that they relicense to
Apache-2.0 at the BSL change date alongside the rest of the package. See
[`CONTRIBUTING.md`](CONTRIBUTING.md).
