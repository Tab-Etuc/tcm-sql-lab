# 中醫處方實驗室 · Art direction

An application worked in, not a promotional page. Use the app-screen run.

Chosen direction: Framed sheet, seed 192751434. It gives the SQL editor, relational canvas and comparison tables a shared quiet working surface. No redraws. The frame is tinted green-grey from the herbal subject; the white sheet and the dealt IBM Plex Sans remain. Chinese glyphs use the system Traditional Chinese face. IBM Plex Mono has one job: SQL and identifiers.

Inventory: 48 teaching cases; one primary syndrome per case; six secondary syndromes; three symptom states; ten formulae; 49 named ingredients; four many-to-many bridges; two unprescribed cases; two unused formulae; SQL outputs whose rows change with predicates; clinical tongue/pulse observations; deterministic SQLite seed.

On this screen, the case → syndrome → formula → herb chain becomes an explorable clinical record, with the same chain reused as schema paths and executable JOIN exercises.

The face is the green-grey frame and the bracket-and-leaf mark. The signature is a live clinical relationship trace: choose a case, see its documented syndromes and actual formula ingredients, then open a real SQL question.

Questions per screen:
- Case background: what can a clinical database help whom find? A selected case, relational trace, three concrete user tasks and dataset scope answer it.
- Database design: how do these nine tables keep clinical meanings distinct? ERD, clickable tables, field constraints and seed samples answer it.
- SQL laboratory: which records answer this question? Editable SQL, expected result, actual data and native SQLite errors answer it.
- Comparison: which rows changed, and why? Before/after SQL and computed multiset differences answer it.

Grid: at 1440px, 228px sidebar + 1204px sheet + 8px inset. The sheet has two 28px gutters, leaving 1148px. Paired 562px columns + 24px gap close that width. On tablet the frame folds; on phone panels stack and data tables scroll within their own frames.

Sample clinical records are intentionally synthetic teaching data, with vocabulary informed by the supplied 中國醫門診教學病例 JSON. Formula ingredient facts are transcribed from the supplied Ministry of Health reference PDFs and linked public Ministry sources. This authored teaching dataset supplies the displayed query statistics.

App rules apply: no image or motion floor, no entrance choreography. Motion only explains a changed selection, running query, or changed result; reduced-motion is supported.
