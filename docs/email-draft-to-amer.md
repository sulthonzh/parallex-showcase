Subject: Senior Full-Stack Engineer — Sulthon Zainul Habib

Hi Amer,

I came across the Senior Full-Stack Engineer role at Parallex and the opportunity to build the interactive sales hub that's reshaping how developers and brokers present real estate projects.

To show rather than tell, I built a working proptech SaaS prototype that maps directly to the JD:

**Live demo:** https://saas-nu-five-91.vercel.app
**Source code:** https://github.com/sulthonzh/parallex-showcase

What I built (all in Next.js 15 + TypeScript strict + Drizzle + Postgres):

- **Developer dashboard** — project CRUD, asset management (renders, floorplans, brochures), unit management with availability states, publish/unpublish workflow
- **Cinematic public hub** — dark-luxury interactive project pages with hero, gallery, unit grid, and inquiry CTA — the "sales hub" that centralizes all assets
- **Broker workspace** — browse published projects, generate scoped share-links with expiry, track engagement
- **Admin console** — user role management (admin/developer/broker), asset approval queue (draft → pending → approved → published), full audit log capturing every mutation with before/after
- **Analytics dashboard** — engagement tracking (views, clicks), event breakdown charts (Recharts), intent scoring heuristic, recent activity feed
- **AI features** — vision-based asset tagging and AI description generation (graceful degradation without API key)
- **RBAC everywhere** — middleware route redirects + layout role guards + server-action assertCan() defense in depth
- **Auth** — GitHub + Google OAuth via Auth.js v5

Every bullet in your JD maps to a concrete feature in the codebase. The architecture is a modular monolith with strict domain boundaries, server actions with typed Result<T,E> returns, and Zod validation at every boundary.

I'd love to discuss how this approach translates to scaling Parallex's product. Reply here or we can jump on a call.

Best,
Sulthon Zainul Habib
sulthonzh@gmail.com
