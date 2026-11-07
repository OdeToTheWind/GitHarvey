# How scoring works

GitHarvey gives every repo a health score from 0 to 100. It is a starting point, not a verdict. Source: `src/lib/score.ts`, `src/lib/profiles.ts`.

## Signals

| Signal | Source | Value |
|---|---|---|
| Recent activity | `pushed_at` | under 30 days = 1, under 180 = 0.6, under 365 = 0.3, else 0 |
| License | `license` | none = 0, present = 1 |
| Docs | `homepage` | present = 1, else 0.5 |
| Popularity | stars | `min(log10(stars + 1) / 5, 1)` |
| Release bonus | latest release | within 365 days adds 0.05. A missing release is neutral |

With the "permissive license" priority, only MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Unlicense, 0BSD, Zlib, BSL-1.0 and CC0-1.0 count as 1. Other licenses count as 0.5.

## Weights by audience

**Default** is the choice for people who do not want to say who they are: balanced weights, no assumptions. It is also the starting answer on the Get started page, and "Skip to search" uses it, so nobody has to answer "Who are you?" or "What do you want to do?" (the goal "Default" means no special goal).

Each row sums to 1.0.

| Audience | Recent activity | License | Docs | Popularity |
|---|---|---|---|---|
| default | 0.3 | 0.15 | 0.2 | 0.35 |
| beginner | 0.2 | 0.1 | 0.4 | 0.3 |
| developer | 0.4 | 0.15 | 0.15 | 0.3 |
| security | 0.5 | 0.1 | 0.1 | 0.3 |
| founder | 0.3 | 0.3 | 0.1 | 0.3 |

With the goal **learn**, docs gain 0.1 and popularity loses 0.1, because good docs matter more than popularity when you are learning.

## "Why this score"

Every result card has a "Why this score" panel. It lists each signal, what was found, and the points it added out of its maximum. Points above 100 are not counted. The release bonus shows "Not checked yet" until you press Expand.

## Health labels

- 70 and above: Healthy (green)
- 40 to 69: Okay (yellow)
- under 40: Risky (red)
- Archived repos are capped at 20 and always red.

Every label shows the word and the number, so colour is never the only signal.

## How the search works

One GitHub search call fetches the 30 best matches. GitHarvey scores all 30 and re-ranks them by health, so the order is not just GitHub's. You see 10 at a time with "Show more".

- "Actively maintained" adds a `pushed:>` filter (one year back).
- "Popular" requires more than 100 stars. Otherwise repos need more than 10 stars.
- "Beginner friendly" adds `good-first-issues:>0`.
- **Any** (the last priority) removes every filter: no minimum stars, no `archived:false`, no recency or good-first-issue filter. The search then covers all kinds of repos, including tiny, old and archived ones. It cannot be combined with the other priorities: choosing one of them turns Any off. A language, if you chose one, still applies.
- **Language** is optional. Pick one from the list, or choose Other and type any language GitHub knows (for example Kotlin or Jupyter Notebook). Typed names may use letters, numbers, spaces and `+ # . -` only, so they can never add search qualifiers of their own.
- "Permissive license" changes the license score, as above.
- Goal "stay updated" asks GitHub for the most recently updated matches first.
- Goal "compare" starts with the top three results ticked for comparison.
- Archived repos are always excluded from search.

Scores in the compare view use the same audience, goal and priorities as your search, so one repo has one score everywhere.

## Limits

- Stars are not quality. New repos score low on popularity.
- A repo with no releases is not penalized.
- The 30-repo pool comes from GitHub's own relevance, so a good match GitHub ranks low may not appear.
- Scores are a starting point. Read the repo before you depend on it.

## Tune the score

Above the results, "Tune the score" has four sliders (0 to 10), one per signal. Moving them re-scores the page at once, in your browser, using weights scaled to sum to 1. Tuning is not saved and is not part of shared links. "Reset to the default" returns to the audience weights.

## Sort and filter

The 30 matches can be sorted by health, stars or last push, and filtered by license (any, has a license, permissive only) and minimum stars. This happens in the browser and makes no GitHub calls.

## Also worth knowing (not part of the score)

Some facts help you decide but are **never added to the 0 to 100 score**, so the score stays simple to explain. They appear under Expand, on the repo details page and in the compare table (`src/lib/facts.ts`):

| Fact | Where it comes from |
|---|---|
| Open issues and PRs | the repo itself (GitHub counts both together) |
| License type | the SPDX id, grouped as Permissive, Weak copyleft, Strong copyleft, Source-available (restricted), Custom or unclear, or No license. Information, not legal advice |
| Codebase size | the repository size on GitHub, plus starter topics such as `starter`, `boilerplate`, `template`, `tutorial`. A rough hint, because the size includes history |
| Age | creation date |
| Contributors | one call to the contributors list |
| Median time to merge a PR | the 30 most recently updated closed pull requests. Needs at least 3 merged ones |
| Maintenance trend | commits per week over a year: the last 13 weeks against the 13 before. "Quiet" when there are very few commits |
| Good first issues | open issues labelled "good first issue" (a search call, which has its own smaller quota) |
| Dependencies (approx.) | top-level entries in `package.json` (JavaScript, TypeScript) or lines in `requirements.txt` (Python) |

A repo that is archived, or has had no push for over a year, also gets a plain warning ("It may be abandoned"). If a lookup fails, the fact shows "Not available" and the rest still load.

## Find alternatives

Archived or Risky repos offer "Find alternatives". It searches again using the repo's first two topics (or its name), in the same language when it is one GitHarvey can filter by, with the same priorities, and leaves the repo itself out.

## Comparing many repos

You can compare 2 to 10 repos. Ticking an 11th in the results shows an alert and does not add it; typing more than 10 into the compare box is refused with a message. With up to 5 repos the table includes the facts under "Also worth knowing". With 6 to 10 repos the slower ones (contributors, merge time, maintenance trend, good first issues, dependencies) are left out, to stay within GitHub's rate limits. The score and the basic rows are always there.

