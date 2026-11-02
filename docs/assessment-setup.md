# Term 2 Organizational Dynamics

The live database contains OB102 under the existing MBA 2026–28 Term 2. All 71 active Section C students are enrolled in its C group. No marks have been imported; students enter their own raw marks.

| Assessment | Maximum raw marks | Weight |
| --- | ---: | ---: |
| Class participation | 25 | 25% |
| Quiz 1 | 10 | 5% |
| Quiz 2 | 10 | 5% |
| Quiz 3 | 10 | 5% |
| Quiz 4 | 10 | 5% |
| Mid Term Group Project | 15 | 15% |
| Group Project Presentation | 10 | 10% |
| End Term | 30 | 30% |
| Total | — | 100% |

## Student workflow after this frontend release

1. Sign in to Möbius with the existing college account.
2. Open Profile & Subjects → Term & Subjects → Term 2.
3. Click Enter scores beside Organizational Dynamics, or open Submit scores and select Term 2 → Organizational Dynamics → the assessment.
4. Enter raw marks, e.g. Quiz 1: 9 out of 10, and Save marks. Its weighted contribution is 9/10 × 5 = 4.5 percentage points. Do not enter 4.5 as the raw score.
5. Use Update marks for corrections. Other assessments keep separate scores. Blank means not submitted; zero is valid.
6. Open Relative performance and choose the same assessment. Section and entire-subject comparisons use submitted scores; at least five are required. Equal scores share competition rank (1, 1, 3).

## Admin workflow for another subject

1. Find the correct batch's term in `terms`; use its ID in `subjects.term_id`.
2. Create the subject with its code, name, and actual academic credits. Credits weight the subject; assessment `weight_percent` weights a component within it.
3. Add one `assessments` row per independently scored component, referencing the subject ID. Give each a stable `comparison_key` and its published `max_marks` and `weight_percent`. Component weights must total 100 for overall comparison.
4. For Terms 1–2, create subject groups matching registered home sections and enroll each student in their matching group. `sync_my_core_enrollments` also fills missing core enrollment when a student opens their profile. For Terms 3–8, preserve students' per-subject group choices and term-lock workflow.
5. Leave scores absent until students submit. Set `submission_deadline` only when a real deadline is known; these OD components currently have none.
6. The new frontend lists enrolled subjects with published assessments automatically, without another course-specific code change.

## Validation and release

- `node --test tests/*.test.mjs`: 11 tests pass, covering both subjects, separate enrollments, maxima, zero, invalid values, deadlines, failed writes, and cross-subject selection rejection.
- `npm run build`: production bundle builds.
- Authenticated database transaction: own insert/update, zero, maximum enforcement, immutable assessment, peer isolation and minimum-five gate pass; all test writes rolled back.
- Browser fixture: OD Quiz 1 saves 9/10 and CP uses 25; dashboard switches subjects, displays the corresponding scale, and stays within 1024×600, 390×700 and 320×568 viewports.
- Browser validation uses test fixtures, not a real student's login session. The production frontend requires publication before this flow is available there.
