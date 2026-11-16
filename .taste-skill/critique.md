# Render critique · 中醫處方實驗室

App-screen run, builder kind. Framed sheet, seed 192751434; no redraw. This is a working SQL application. App rules supersede promotional-page photo, entrance-motion, headline-ratio and card restrictions. Code identifiers and structural separators have functional roles.

ROUND 1
Seen in one second: the green clinical record trace; on the laboratory screen, editable SQL.
Idea (one sentence): follow a case through syndrome, formula and ingredients, then query the same relationships.
Live thing: changing the selected case rebuilds its actual relationship trace; editing SQL executes SQLite and changes result rows.
Layout words by section: background=record-and-chart / database=relationship-canvas-and-dictionary / laboratory=question-index-and-editor / comparison=paired-diff
Scores: design 7.0 · usability 6.0 · creativity 7.0 · content 8.5 → overall 6.9
Caps applied: initial inspector FAILs and the mobile comparison explanation layout reduce the overall score to 6.0.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. The mobile comparison explanation is squeezed into a narrow column in the initial compare mobile page sheet. Fix the missing closing container so the reason spans the screen below both results.
2. The full nine-table ERD is too small or requires too much lateral navigation on the initial database mobile sheet. Give phones four readable relationship paths and a deliberate control to expand the full graph.
3. Several small ERD/metadata labels are 10px in the first inspected database and laboratory screens. Raise the floor to 11px, preserve larger narrative and SQL type, and rerun all viewport checks.

ROUND 2
Seen in one second: a specific clinical record on the overview, a readable query on the laboratory, and the changed SQL line on the comparison screen.
Idea (one sentence): the same case-to-herb relations connect clinical context, the ERD, executable JOINs and visible result differences.
Live thing: four selectable case traces, nine selectable tables, twelve executable exercises, editable SQL, and before/after multiset differences computed from actual SQLite results.
Layout words by section: background=record-and-chart / database=paths-and-dictionary / laboratory=editor-and-results / comparison=paired-diff
Scores: design 7.8 · usability 8.0 · creativity 7.5 · content 8.8 → overall 7.9
Caps applied: none under the app-screen rules. This is a confident learning workbench, not a claim of award-level novelty.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Dense metadata remains small in final-case, final-database and final-query screenshots. Main prose and editor content are larger; retain compact secondary identifiers for this data tool. The inspector tiny-text warnings remain documented rather than hidden.
2. Long SQL lines scroll inside their editor or code pane on final-query and final-compare mobile sheets. Preserve code alignment and native horizontal scrolling; no document-level overflow. The wide ERD is optional on phones.
3. Full comparison tables make a long mobile page in final-compare/mobile-page-01.jpg. The working “只看差異資料” control shortens both tables to changed rows; keep complete results available for explanation and grading.

## Evidence and screen questions

All 24 final screenshots were visually reviewed: desktop/tablet/mobile fold and page sheet for case, database, query and compare. Widths: 1440, 768 and 390px. Final inspector reports: case 0 FAIL / 2 WARN; database 0 FAIL / 1 WARN; query 0 FAIL / 1 WARN; compare 0 FAIL / 0 WARN. No allowances were passed. The case no-data-hue warning does not detect the green CSS-rendered syndrome bars visible in the screenshot. The other warnings concern small secondary text. Static skill lint: 0 FAIL / 0 WARN.

- Background answers who uses the database and what can be found, through three user tasks and a real record trace.
- Design answers how the data relates, through a nine-table ERD, PK/FK fields, constraints and real samples.
- Laboratory answers which records satisfy a question, with executable SQL, expected results, actual results and native errors.
- Comparison answers which rows changed and why, with highlighted SQL, both result tables, duplicate-preserving differences and a written explanation.

No stock or generated imagery is used. The visual material is the subject itself: relationships, clinical records and measured query results. Motion is selection/execution feedback only and respects reduced motion. Case records are intentionally authored teaching data; they are the finished dataset, not placeholders. Formula ingredients are sourced and linked in the application.

Validation: 17 database/SQL tests pass; browser smoke coverage includes all 24 exercise queries, 12 comparisons, schema samples, error/empty states, CSV and SQLite downloads, responsive navigation and reduced motion. Additional checks cover worker cancellation, timeout recovery and custom-result column differences.
