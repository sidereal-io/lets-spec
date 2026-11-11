# Specs in a monorepo

This page is for you if you are setting up Let's Spec in a repository that
holds several applications or services. It says how to lay out the specs,
how to tell agents which code each group of specs describes, and where
discovery keeps its maps.

## Keep one setup at the root

Keep one set of skills and one `openspec/` directory at the repository
root, as
[OpenSpec recommends for monorepos](https://github.com/Fission-AI/OpenSpec/blob/main/docs/existing-projects.md#monorepos-and-work-that-spans-repos).
Group the specs by application, service or feature, as your project needs:

```text
.agents/skills/                        # shared skills
AGENTS.md                              # shared workflow rules
openspec/
  config.yaml                          # shared schema and project context
  specs/
    backend/checkout/spec.md
    frontend/checkout/spec.md
    shared/user-auth/spec.md
  changes/
```

## Domains and capability paths

- A **domain** is a group of specs, such as `backend` or `shared`.
- A **capability path** names one spec by its folder under
  `openspec/specs/`, such as `user-auth` or `backend/checkout`.

`backend/checkout` and `frontend/checkout` are two different capabilities,
even though their last folder has the same name. Agents always use the
full path.

Domains are optional. A flat path such as `openspec/specs/user-auth/spec.md`
keeps working. You do not need to move it or configure anything.

## Tell agents which code each domain describes

Domain names do not map to source folders by themselves. Say how they map
in the `context` of `openspec/config.yaml`:

```yaml
context: |
  Backend capabilities describe apps/api; frontend capabilities describe apps/web.
  Shared authentication behavior is implemented in packages/auth.
```

Agents use this context, the request and the code to find the specs a
change touches. When the scope is clear, they go on without asking you to
pick a domain.

## One change can update several domains

A checkout story can change both the backend and the frontend specs. Its
change then holds two delta specs:

```text
openspec/changes/add-checkout/specs/backend/checkout/spec.md
openspec/changes/add-checkout/specs/frontend/checkout/spec.md
```

Each delta's path matches its main spec under `openspec/specs/`. A spec the
change only reads, such as shared authentication, gets a delta only if its
requirements change.

Skills, git branches and pull requests stay shared across the repository.
One change is still one branch and one pull request, however many domains
it touches.

## Discovery maps

A discovery map records the personas a product serves and the journeys
they walk. `lets-shape` writes it, and `lets-go` commits it on the first
story's branch.

A **product** is something the repository delivers to people of its own,
who walk journeys of their own. It is not a spec domain. A repository with
several domains can still be one product: one journey can cross the
`backend` and `frontend` specs. Such a repository keeps one map,
`openspec/discovery.md`, and discovery asks nothing about products.

When a discovery run brings a second product, `lets-shape` proposes a name
for each product and shows you the move. It asks before it moves anything.
On your yes, each product gets a map of its own, and the root map becomes
the list of products:

```text
openspec/
  discovery.md                 # the root map: the list of products
  discovery/
    web-shop.md                # one product's personas and journeys
    warehouse.md
```

- **Each product's map** is `openspec/discovery/<product>.md`. It holds
  every journey of that product, the journeys of the personas it shares
  too.
- **The root map** opens with a `## Products` table. Each row gives a
  product, what it covers and a link to its map. That heading is how
  `lets-shape` knows the repository has several products.
- **The root also holds the shared personas**: the personas more than one
  product serves. A product's map names a shared persona with a link to
  the root entry instead of a copy. The root holds no journeys.

Each discovery run picks one map. When the idea clearly fits a listed
product, `lets-shape` uses that product's map and says which. When it
cannot tell, it asks you. Each parent issue names its map on a `Map:`
line, so a later session resumes the run on the right map. A later
product adds a row and a map, and moves nothing.

[ADR-021](decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md)
records why the maps follow products, not spec domains.
