# malim-graph — Build Plan

**Branch:** `claude/graph-visualization-7pJaN`  
**Date:** 2026-04-17  
**Status:** Planning

---

## 1. What This Is

`malim-graph` is the graph visualization frontend for the MALIM platform. It renders knowledge graphs built from MALIM member data — search queries, summaries, and curated concepts — using the Cognitive Network Protocol data model first implemented in [InfraNodus](https://infranodus.com).

The app sits in front of `malimseek_backend` and gives members a visual, interactive way to explore the knowledge they have accumulated through their seeks and notes.

---

## 2. Repository Map

| Repo | Role | Status |
|------|------|--------|
| `al-the/malimseek_backend` | Express.js API — Perplexity AI search, news, member auth, Cosmos DB | ✅ Live |
| `al-the/graphdbmodel` | Cognitive Graph DB model spec (Concept / Statement / Context / User / Narrative) | ✅ Reference |
| `al-the/infranodus` | Reference implementation — text-to-network with Neo4J + Sigma.js | ✅ Reference |
| `al-the/graph-skills` | InfraNodus Claude Skills — cognitive variability, SEO, discourse analysis | ✅ Live |
| `al-the/malim-graph` | **This repo** — graph visualization frontend for MALIM | 🔨 Building |

---

## 3. Problem This Solves

Right now MALIM members can search (seek), read news, and build up a history of queries — but that knowledge sits as a flat list in Cosmos DB with no structure, no connections, no way to see patterns.

`malim-graph` gives that knowledge a shape:
- Concepts extracted from seeks and summaries become **nodes**
- Co-occurrences and semantic proximity become **edges**
- Seeks / notes become **Statements** attached to those concepts
- Each member gets their own **Context** (graph namespace)
- The graph reveals gaps, clusters, and dominant topics — the same insights InfraNodus provides for text

---

## 4. Data Model

Based on `al-the/graphdbmodel` — the Cognitive Network Protocol:

### Node Types

| Label | Description |
|-------|-------------|
| `:Concept` | A recurring term / idea (e.g. "OPR rate", "Ringgit") |
| `:Statement` | A seek query, summary snippet, or note made by a member |
| `:Context` | A named graph namespace (e.g. member's default context, a project) |
| `:User` | The MALIM member |
| `:Narrative` | An ordered path through concepts (optional — Phase 2) |

### Edge Types

| Label | Connects | Meaning |
|-------|----------|---------|
| `:TO` | Concept → Concept | Co-occur in same statement |
| `:OF` | Concept → Statement | Concept appears in this statement |
| `:AT` | Concept → Context | Concept appears in this context |
| `:IN` | Statement → Context | Statement belongs to this context |
| `:BY` | Any → User | Created by this user |
| `:THRU` | Node → Node | Sequential narrative order (Phase 2) |

### Node Properties
- `.name` — display name
- `.uid` — unique ID
- `.timestamp` — creation time
- `.text` — body (Statements only)

### Edge Properties (`:TO`)
- `.uid`, `.timestamp`, `.context`, `.statement`, `.user`, `.weight`

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router)** | Consistent with `malimseek_backend`'s `src/app` (Next.js); SSR for fast first paint |
| Graph rendering | **Sigma.js + Graphology** | Same stack as InfraNodus; battle-tested for large graphs |
| Graph metrics | **Graphology** modules | Modularity (community detection), betweenness centrality, degree |
| Styling | **Tailwind CSS** | Rapid UI; consistent with MALIM portal |
| Auth | **API key via `x-api-key` header** | Matches `malimseek_backend` auth model |
| State | **Zustand** | Lightweight; good for graph selection/filter state |
| Data fetching | **SWR** | Stale-while-revalidate; good for incremental graph updates |
| DB (graph store) | **Azure Cosmos DB** — new `kg` container | Stores serialised graph JSON per member; no separate graph DB needed in Phase 1 |
| Deployment | **Vercel** | Consistent with backend deployment |

### Why Not Neo4J?

InfraNodus uses Neo4J for a multi-user, 26M-edge production system. For Phase 1 of `malim-graph`, each member's graph is small enough to be stored as a serialised JSON document in Cosmos DB and computed client-side with Graphology. This avoids standing up a separate graph DB. Neo4J can be introduced in Phase 3 if the graph scale demands it.

---

## 6. Backend Changes Needed (`malimseek_backend`)

The backend needs a new `/api/kg` (knowledge graph) route group. These will be added on the `claude/graph-visualization-7pJaN` branch.

### New Cosmos DB Container

```
Database:    malimseek
Container:   kg
Partition:   /memberId
Purpose:     Serialised graph documents per member
```

### New API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/kg` | `validateApiKey` | Return member's full graph (nodes + edges) |
| `POST` | `/api/kg/statement` | `validateApiKey` | Add a statement → extract concepts → update graph |
| `DELETE` | `/api/kg/node/:uid` | `validateApiKey` | Remove a concept node and its edges |
| `GET` | `/api/kg/contexts` | `validateApiKey` | List all contexts (graph namespaces) for member |
| `POST` | `/api/kg/context` | `validateApiKey` | Create a new context |

### Concept Extraction

For Phase 1, concept extraction uses a simple approach:
- Strip stopwords
- Lemmatize (simple suffix rules or a small library)
- Sliding window of size 4 over tokens → co-occurrence edges
- Reuse Perplexity response text from `/api/seek` to auto-populate the graph after each seek

For Phase 2, swap in a proper NLP pipeline (e.g. Compromise.js or Azure Language).

### Auto-graph on Seek

When a member calls `POST /api/seek`, the backend should:
1. Complete the seek as normal
2. In the background, extract concepts from the query + answer
3. Upsert nodes/edges into the `kg` container for that member
4. Return the seek result immediately (graph update is async)

---

## 7. Frontend Features

### Phase 1 — Core Visualization

- [ ] **Graph canvas** — Sigma.js force-directed layout, nodes sized by degree, coloured by community (Louvain modularity)
- [ ] **Node detail panel** — click a concept node → see all Statements it appears in
- [ ] **Statement list** — sidebar showing recent seeks/notes that feed the graph
- [ ] **Add statement** — text input → POST to `/api/kg/statement` → graph updates live
- [ ] **Context switcher** — dropdown to switch between graph namespaces
- [ ] **Auth gate** — enter API key on first visit; stored in `localStorage`
- [ ] **Graph metrics bar** — node count, edge count, top 5 nodes by betweenness centrality
- [ ] **Empty state** — prompt to run first seek or type first statement

### Phase 2 — Analysis

- [ ] **Gap detection** — highlight structural gaps (nodes that bridge otherwise disconnected communities) — core InfraNodus insight
- [ ] **Community colouring** — Louvain community detection via Graphology; each cluster gets a colour
- [ ] **Narrative mode** — ordered path through nodes (`:THRU` edges); replay knowledge chronologically
- [ ] **Search / filter** — filter nodes by keyword, date range, context
- [ ] **Export** — download graph as GEXF or JSON for use in InfraNodus

### Phase 3 — AI Integration

- [ ] **Graph-aware seek** — when member runs a seek, surface the 3 most relevant concept nodes from their graph as context for the Perplexity query
- [ ] **Gap questions** — AI-generated questions targeting structural gaps in the graph ("You know a lot about X and Y but nothing connects them — ask about Z")
- [ ] **Skill integration** — invoke `graph-skills` (Cognitive Variability, Shifting Perspective, Embodied Navigation) directly from the graph UI for selected nodes
- [ ] **InfraNodus MCP bridge** — export graph to InfraNodus for advanced text network analysis

---

## 8. File Structure

```
malim-graph/
├── src/
│   ├── app/
│   │   ├── page.tsx              — Root: redirect to /graph
│   │   ├── graph/
│   │   │   └── page.tsx          — Main graph view
│   │   ├── api/
│   │   │   └── [...proxy]/       — Optional: proxy to malimseek_backend
│   │   └── layout.tsx
│   ├── components/
│   │   ├── GraphCanvas.tsx       — Sigma.js wrapper
│   │   ├── NodePanel.tsx         — Node detail sidebar
│   │   ├── StatementList.tsx     — Recent statements feed
│   │   ├── AddStatement.tsx      — Text input form
│   │   ├── ContextSwitcher.tsx   — Graph namespace selector
│   │   ├── MetricsBar.tsx        — Graph stats header
│   │   └── AuthGate.tsx          — API key entry modal
│   ├── lib/
│   │   ├── api.ts                — Typed wrappers for malimseek_backend endpoints
│   │   ├── graph.ts              — Graphology helpers (metrics, layout, community)
│   │   └── extract.ts            — Client-side concept extraction (Phase 1 fallback)
│   ├── store/
│   │   └── graphStore.ts         — Zustand store (selected node, active context, auth)
│   └── types/
│       └── graph.ts              — TypeScript types: Node, Edge, Statement, Context
├── public/
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── graph-plan.md                 — This file
```

---

## 9. Environment Variables

```env
# malim-graph/.env.local
NEXT_PUBLIC_BACKEND_URL=https://malimseek.vercel.app
```

The member's API key is entered at runtime and stored in `localStorage` — it is never baked into the build.

---

## 10. Integration Points

### With `malimseek_backend`

- All data flows through the backend API (`/api/kg/*` routes to be added)
- Auth: `x-api-key` header on every request
- The backend owns Cosmos DB; `malim-graph` is a pure frontend — no direct DB access

### With `graph-skills`

- Phase 3: the Cognitive Variability and Shifting Perspective skills can be surfaced as actions on selected graph nodes
- The Actionize skill can turn graph gaps into scheduled tasks

### With `infranodus`

- InfraNodus is the reference implementation — same data model, same viz stack (Sigma.js + Graphology)
- Phase 2: GEXF export from `malim-graph` → import into InfraNodus for advanced analysis
- Phase 3: InfraNodus MCP server tools can be called directly from the `malim-graph` UI

### With `graphdbmodel`

- The node/edge schema in `graphdbmodel` is the source of truth for all data structures in this repo
- Any schema changes must be reflected in `src/types/graph.ts`

---

## 11. Implementation Phases

### Phase 1 — MVP (weeks 1–2)

1. Scaffold Next.js 15 app with Tailwind
2. `AuthGate` component — API key entry → stored in localStorage
3. `GET /api/kg` backend route + Cosmos `kg` container
4. `GraphCanvas` — Sigma.js renders nodes/edges from API response
5. `AddStatement` → `POST /api/kg/statement` → concept extraction → graph update
6. `NodePanel` — click node → list statements
7. `MetricsBar` — degree, node count, edge count via Graphology
8. Deploy to Vercel

### Phase 2 — Analysis (weeks 3–4)

1. Louvain community detection → node colouring
2. Gap detection — nodes bridging disconnected subgraphs highlighted
3. `ContextSwitcher` + `POST /api/kg/context`
4. Auto-graph on seek — backend async concept extraction from seek results
5. Narrative mode (`:THRU` edges)
6. GEXF / JSON export

### Phase 3 — AI Integration (weeks 5–6)

1. Graph-aware seek — surface relevant graph context in Perplexity queries
2. Gap questions — AI suggests seeks that would bridge graph gaps
3. Skill surface — invoke `graph-skills` from selected node
4. InfraNodus MCP bridge

---

## 12. Open Issues / Deferred Items

| # | Item | Blocker |
|---|------|---------|
| A | `beta` container rename → `seeks` | Cosmos DB production operation; needs ops coordination |
| B | `/api/member/seeks` endpoint alignment | Spec alignment pending |
| C | Concept extraction NLP quality | Phase 1 uses simple stopword removal; upgrade in Phase 2 |
| D | Neo4J migration | Only needed if graph grows beyond ~100k edges per member |
| E | `POST /api/feedback` auth | Deferred from backend audit |
| F | `generateAuthToken()` deduplication between `index.js` and `src/lib/cosmos.ts` | Deferred from backend audit |

---

## 13. Key References

- Cognitive Network Protocol: https://noduslabs.com/research/cognitive-network-protocol/
- InfraNodus paper (WWW'19): https://dl.acm.org/doi/10.1145/3308558.3313698
- Graphology docs: https://graphology.github.io/
- Sigma.js docs: https://www.sigmajs.org/
- InfraNodus MCP Server: https://infranodus.com/mcp
