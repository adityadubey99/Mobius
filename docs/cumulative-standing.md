# Overall subject standing

## Behaviour

Relative performance gains an Overall subject assessment option. Existing individual assessment comparisons and score entry remain available.

Each component with positive weight becomes active after five distinct eligible students have submitted it. Repeat saves count once. Activation is recomputed from current submissions independently for the section and entire subject cohort; removing submissions can deactivate a component. There is no sequencing requirement. Zero-weight components never affect the total or completeness.

The running score is the sum of `(marks / maximum marks) * weight percent` for all active components. Display its denominator as the sum of their weights, not a final subject score out of 100. Only students with every active component submitted enter the comparison. Missing marks are excluded; a recorded zero is valid. With 47 Quiz 1 submissions and 20 complete Quiz 1 + Quiz 2 submissions, component standings use 47 while overall standings use 20.

An incomplete student sees the missing assessment names. A complete student can see their own total, but peer averages, minimum, maximum, rank and distribution require five complete participants. Competition ranks preserve ties (1, 1, 3). The interface lists the components and assessed subject weight. Section and entire-cohort totals can use different component sets because activation is scoped separately.

## Database and access

Apply `supabase/patches/cumulative-standing.sql` before publishing the frontend. It allows assessment weight zero and introduces an authenticated cumulative-performance RPC. Existing scores and assessment weights are not changed. The RPC validates an approved authenticated student and their enrollment, excludes inactive or wrong-batch participants, and requires locked enrollment for Terms 3–8. It returns only own results and peer aggregates.

No inclusion setting, stored cumulative marks, confidence interval, auth change, or new score-entry field is introduced.

## Validation

- 22 Node tests passed, including cumulative load, RPC arguments and rejection of direct overall-score saves.
- Production Vite build and whitespace checks passed.
- Supabase integration tests passed inside an explicit rollback transaction: 47-versus-20 example, four-versus-five activation threshold, repeated saves, zero marks, zero weights, independent cohort activation, incomplete scores, fewer than five complete totals, no active components, anonymous rejection and unenrolled rejection. Authenticated-role RPC execution was tested.
- After rollback, the new RPC and test subjects were absent and the original production weight constraint remained intact.
- Browser fixture checks passed for available, missing, pending and empty results, switching back to an assessment, and the submit navigation action.
- Dashboard document bounds matched the viewport at 1024×600, 390×700 and 320×568; no horizontal or page overflow. At the smallest size the chart is compact.
- Browser preview uses synthetic test data, not live cumulative standings. Publication was approved. The production migration was applied and authenticated RPC calls verified against Operations Research and Organizational Dynamics; anonymous execution is denied.

## Publication

1. Apply the prepared database patch and verify authenticated access and aggregate results.
2. Commit only this feature's source, tests, patch and documentation; exclude unrelated local files and screenshots.
3. Push the reviewed commit and verify the Vercel build.
4. Check Overall subject on the deployed app without altering student marks. Keep individual assessment comparisons available.
