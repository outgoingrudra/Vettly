# Vettly · BuildApp design rules

Design for two people with different pressures. A host needs to know who can still join, who is answering, and which scorecards need review. A candidate needs to know when the clock starts, whether their answers were received, and when their result becomes available. Let those questions determine what gets space on screen.

## Use this guide on your next screen

Start with the [skill shortlist](#design-skills-worth-borrowing), choose a [3D approach](#choosing-and-directing-3d) if the brief calls for it, then use the [50-pattern review](#50-patterns-to-catch-in-review) on the rendered screen. The [BuildApp upgrade list](#where-buildapp-can-improve) gives this project its own priorities.

For another product, replace the opening paragraph with five lines: **who is here, what they came to do, what a mistake costs them, what they must understand before acting, and what visible outcome confirms success**. Keep the methods below. Choose new colors, type and imagery from that product’s subject matter. Paper, Clay, Night and the ribbon are Vettly decisions.

## Design skills worth borrowing

Selected for the quality of the decision each skill helps make, the availability of an inspectable original, and whether the result can be checked on a working screen. The links point to the skill files as reviewed on 8 November 2026. The exercises and acceptance checks are adaptations for product work.

| Reach for this skill when… | Best part to borrow | Exercise and acceptance check |
|---|---|---|
| **A new page feels interchangeable.** Anthropic, Frontend Design | Establish a visual direction and critique it against the actual brief before implementation. | Sketch two materially different compositions using the same words and no color. For a host, compare a chronological interview schedule with a queue of submissions awaiting review. Pick the one that exposes the user’s next decision. Changing a gradient does not count as a second composition. [Original skill](https://github.com/anthropics/skills/blob/2c5958ecac7cee2b583967a2c4981d0f4a75c579/skills/frontend-design/SKILL.md) |
| **An existing product needs refinement.** Paul Bakaus, Impeccable | Distinguish a surface meant to persuade from one meant to operate. Separate a design critique from an implementation audit. | Annotate one screenshot with the first three things the eye sees. Check them against task order. Then audit with a long name, a failed request, a keyboard, and the narrowest layout. Record the highest-impact fix and the evidence that would close it. [Original skill](https://github.com/pbakaus/impeccable/blob/924bbd194d02e5e15a227e75b5901fb0d7a4ecad/.agents/skills/impeccable/SKILL.md) |
| **A screen looks finished in a screenshot.** Vercel, Web Design Guidelines | Review the implementation for interaction details that a screenshot hides. | Submit a form with Enter, paste into password fields, tab backwards, and recover from an invalid entry. Pass when every control has an accessible name, focus is visible, and values that are safe to retain survive a recoverable error. [Original skill](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines/SKILL.md) · [Guidelines used by the skill](https://vercel.com/design/guidelines) |
| **A transition feels slow or arbitrary.** Design Engineering in Vercel’s Open Agents repo | Decide whether motion explains a state change and how frequently the user must sit through it. | Compare an instant state change with a short transition. A menu can open from its trigger. Selecting answer 40 should be just as immediate as selecting answer 1. Try a second input midway through the transition and check that the final state is correct. [Original skill](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/.agents/skills/emil-design-eng/SKILL.md) |
| **An illustration needs convincing depth.** CloudAI-X, Three.js Fundamentals | Establish the camera, scale, silhouette and frame before adding surface effects. | Render the object in one flat color, at its smallest intended size. Pick an orthographic camera for a diagram or emblem whose proportions should stay stable. Use perspective when distance itself communicates meaning. [Original skill](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-fundamentals/SKILL.md) |
| **A 3D object looks flat or muddy.** CloudAI-X, Three.js Lighting | Shape a form with a key light and fill, then decide which shadows earn their rendering cost. | Light a neutral version first. Rotate the key until the important overlap reads in grayscale. Add fill only until the darker face separates from the background. Check the silhouette in the darkest and lightest theme. [Original skill](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-lighting/SKILL.md) |
| **Every 3D asset looks like polished plastic.** CloudAI-X, Three.js Materials | Match roughness, metalness and the environment to a specific physical reference. | Choose one reference such as folded satin or anodized aluminum. Sweep roughness on the same object under the same light and compare the highlight width. Keep the least expensive material that reproduces the intended finish at display size. [Original skill](https://github.com/CloudAI-X/threejs-skills/blob/0e181866f095b5f06d005133876e926515390d95/skills/threejs-materials/SKILL.md) |

**How to resolve a disagreement between skills.** Give the identity room on a public landing page or the artwork beside sign-in. Give the user’s content room in an assessment or scorecard. A striking composition can win the landing-page comparison and still lose the timed-question comparison. For the latter, check how quickly the candidate can read two long options, revise a choice, and find the remaining time.

## Craft details that carry across products

| Discipline | Decision to make | Check in the rendered product |
|---|---|---|
| Typography | Define a small set of roles for display, page title, task heading, body, label and numeric data. Assign size, weight and line height together. The display face can carry identity while the task face handles repeated reading. [Carbon typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview) | Compare a two-line name, a 120-word feedback note, and scores of 9/10 and 100/100. The first line of the note should be easy to find. Score columns should align as the number of digits changes. |
| Theming | Keep a shared meaning for each color token across themes. Define text, field border, focus ring, selected surface, error and success as foreground/background pairs. | Capture identical invalid and focused fields in all three themes. Measure contrast on the actual adjacent colors. Remove color temporarily and see whether selection and error still read. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) |
| Forms and recovery | Write the failure and the recovery action while writing the happy path. Associate field-specific guidance with the input and reserve form-level messages for problems such as a network failure. | With a screen reader, submit an invalid value, find the field, correct it and hear the result. For a rejected login, keep the account-level error generic. [W3C forms guidance](https://www.w3.org/WAI/tutorials/forms/notifications/) |
| Perceived speed | Give the primary control a stable place before fonts, art or data arrive. Measure responsiveness, paint and layout shifts independently. | Test first visit and repeat visit on a modest phone. For production field data, use the good thresholds at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1. A local trace helps diagnose a cause. [Web Vitals](https://web.dev/articles/vitals) |

## Choosing and directing 3D

| What the visitor needs | Delivery choice | Review criterion |
|---|---|---|
| Recognize a brand silhouette | A static image with reserved dimensions, or a procedural canvas for a small theme-aware asset | Compare both at the actual display size. Keep the cheaper version if people perceive the same shape and finish. |
| Understand a transition between two states | A small CSS transform or a short, user-triggered sequence | With reduced motion enabled, both states and the action between them remain understandable. |
| Inspect an object from multiple angles, or manipulate parts of a model | A lazily loaded interactive scene with an immediately available poster | Keyboard and touch users can complete the same task. Restore the poster if WebGL fails; keep essential text and controls in the DOM. |

**A practical art-direction exercise.** For Vettly’s ribbon, start with a thumbnail silhouette. Find a pose where the loop has one clear opening and the crossing strands separate. Lock that pose, then try three finishes under one light: matte paper, woven fabric, and metal. Choose the finish that still reads at half size. Keep camera position and crop consistent across Paper, Clay and Night, adjusting fill and highlight contrast per theme. The current canvas already projects geometry in 2D; this exercise can be done in that renderer.

**If a future screen earns a real-time scene**, load it after the task UI. Reuse geometry and materials, cap pixel density for the target device, and render a resting scene on demand. Stop continuous updates when hidden. Release GPU textures, geometries and materials when leaving the view. Test by visiting the screen five times, comparing memory after each exit, and checking that an idle scene stops drawing. [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) · [Three.js resource cleanup](https://threejs.org/manual/en/cleanup.html)

## Where BuildApp can improve

These are proposed upgrades from inspecting the current authentication implementation.

| Priority | Current detail | Upgrade and definition of done |
|---|---|---|
| 1 · Recovery | The URL for a missing reset token gives a recovery link. After a failed network request, the form shows the underlying error’s message. | Give connection failures human wording and a retry path. Test an expired link, an offline submit, and a second attempt after reconnecting. Keep the entered email and avoid implying an email was sent until the API confirms it. |
| 2 · Hierarchy | Sign-in and signup each offer the other route twice, once in the top tabs and again below the form. The artwork and footer also repeat the workspace label. | Try one account-switching affordance near the form, then remove the redundant footer label in a screenshot comparison. Ask a new visitor to locate signup and a returning visitor to locate sign-in on a 360 px screen. Both should succeed on the first try. |
| 3 · Typography | The current UI combines system body type with Georgia display headings. The long title and the italic artwork headline compete at desktop size. | Keep the form heading dominant. Compare two type treatments using exactly the same copy and panel width. Choose the one where the primary action stays in view at 200% zoom and the long reset heading wraps naturally. |
| 4 · Theme quality | Paper, Clay and Night use shared CSS variables, while some error and decorative colors are still literal values. The saved theme is applied after the app mounts. | Give error and focus states explicit theme tokens. Load the stored preference before the first visible paint, then hard-refresh each theme on a slow connection and check for flashes. |
| 5 · Signature artwork | The ribbon redraws on resize or theme change. On narrow screens the art panel disappears. | Preserve that quiet rendering behavior. Compare a static thumbnail with the live ribbon at desktop size; try a compact brand mark on mobile only if it leaves the fields and action as easy to reach. Judge it in all three themes before considering WebGL. |

### A reusable brief for the next build

Copy these six lines into the issue or prompt and fill them in before implementation:

1. **Person and task** — Who is here, and what should they accomplish in this visit?
2. **Hardest state** — Which error, empty state, permission boundary or time constraint must the design explain?
3. **Composition** — What are the first two things the person should notice? Sketch two arrangements.
4. **Identity** — Which one detail will be recognizable across screens? Specify where to use it and where to leave space.
5. **Interaction** — What changes on input, while waiting, after success, and after failure?
6. **Acceptance** — Name the smallest viewport, longest content, keyboard journey, theme states, and one measurable performance or comprehension check.

## What the research supports

In Morphic’s experiment, 17 generated homepages for the same fictional company varied in appearance but repeatedly used similar compositions and stories. Changing the font or palette alone can leave the underlying template intact. HTTP Archive also found that a widely cited visual tell, purple CSS, overlapped with broader framework adoption. Treat these patterns as design review prompts. Appearance alone cannot establish who made a site. [Morphic experiment](https://www.getmorphic.com/resources/ai-creative-intelligence/why-ai-generated-websites-look-the-same/) · [HTTP Archive analysis](https://almanac.httparchive.org/en/2025/generative-ai)

## 50 patterns to catch in review

The first three groups cover visual and editorial habits reported by designers or adapted from their observations. The last two cover common usability failures that make a generated prototype feel unfinished. Each alternative is a choice for this product.

### Composition and hierarchy

Look at the page with its text blurred. You should still be able to identify the main task and where to begin. [Design observations from IOV Labs](https://labs.iovstudio.kr/en/papers/ai-design-tells) · [Nielsen Norman Group on hierarchy and grouping](https://www.nngroup.com/articles/principles-visual-design/)

| # | Pattern to avoid | Use in BuildApp |
|---|---|---|
| 01 | Centered marketing hero above every task | Open the host dashboard on the interview list. Put “Create interview” beside its heading. |
| 02 | Three equal feature cards regardless of content | On the join page, give the instructions reading space and keep duration and format together in a compact facts list. |
| 03 | A bento grid whose proportions imply arbitrary importance | Size the candidate roster for scanning many names. A sharing control needs only one button. |
| 04 | A card inside a card inside a panel | On the scorecard, use one reading surface. Separate answers with spacing or rules. |
| 05 | Dashboard counters that repeat the list underneath | Offer “Awaiting review (4)” as a filter when it helps the host find four actual submissions. |
| 06 | Every action has the same visual weight | Make “Join interview” the primary action. Show “Back” as a quieter link. |
| 07 | Excess whitespace pushes essential details below the fold | Keep the duration, start condition, and Join button together on a short phone screen. |
| 08 | Decoration and text follow different alignment grids | Align the question number, prompt, and first line of each answer on a deliberate reading axis. |
| 09 | Alternating light and dark sections solely to create variety | Change surfaces at a meaningful boundary, such as the transition from interview instructions to the live workspace. |
| 10 | A giant footer or repeated call to action on a focused task | End an assessment with the answer review and submission action. Keep unrelated navigation out of that area. |

### Color, type, and visual assets

Effects become conspicuous when they recur regardless of context. Judge each one by its effect on legibility and emphasis. [SCALR’s visual examples](https://scalr.sg/blog/20-signs-a-website-was-made-by-ai/) · [Morphic’s comparison](https://www.getmorphic.com/resources/ai-creative-intelligence/why-ai-generated-websites-look-the-same/)

| # | Pattern to avoid | Use in BuildApp |
|---|---|---|
| 11 | A purple-to-blue gradient becomes the entire brand | Choose one recognizable accent and repeat it deliberately on actions and selections. |
| 12 | Gradient-filled words in every headline | Set interview titles in solid ink so long titles remain readable across wraps. |
| 13 | Colored orbs and blurred glows behind forms | Give the form a quiet background. Let the focused field provide the strongest local contrast. |
| 14 | Frosted glass over busy content | Use an opaque question surface that stays readable beside changing video frames. |
| 15 | The same heavy shadow on every block | Reserve elevation for something layered, such as a menu sitting above the roster. |
| 16 | Every label, control, and container is pill-shaped | Reserve a compact badge for a real status. Use familiar button and input shapes elsewhere. |
| 17 | A different accent color for every metric | Give colors stable meanings. Pair “Entry closed” with text so its meaning survives grayscale. |
| 18 | Oversized display lettering applied to long user content | Give interview names a wrapping title style. Reserve larger display type for short, authored headings. |
| 19 | Hairline, pale-gray type used to suggest luxury | Give instructions and secondary labels enough weight and contrast to read under ordinary lighting. |
| 20 | Inconsistent icon families and random emoji beside labels | Use one icon family and size. Give unfamiliar actions such as closing entry a visible text label. |

### Copy, imagery, and credibility

A practical test is to replace “Vettly” with the name of a bank. Copy or imagery that still fits probably needs a more specific subject. [IOV Labs design analysis](https://labs.iovstudio.kr/en/papers/ai-design-tells) · [GOV.UK task patterns](https://design-system.service.gov.uk/patterns/)

| # | Pattern to avoid | Use in BuildApp |
|---|---|---|
| 21 | A headline promises to “transform your workflow” | Name the job plainly. “Review submissions” tells a host exactly where they are. |
| 22 | An eyebrow, title, subtitle, and paragraph all repeat the same idea | Keep the heading. Spend one extra sentence only where it changes a decision, such as explaining when the timer starts. |
| 23 | A sparkle or “AI-powered” badge attached to routine features | Describe how scoring works. Each correct answer earns the marks set by the interviewer. |
| 24 | Generic buttons such as “Continue” at irreversible steps | Write “Submit answers,” “Close entry,” or “Publish result.” Give each action its own verb. |
| 25 | Invented testimonials, partner logos, or user counts | Demonstrate the actual interview flow with a clearly labeled sample scorecard if the public page needs proof. |
| 26 | Stock photos of smiling teams on functional screens | Use an actual profile image where identity matters. Use initials when a photo is missing. |
| 27 | Floating laptop mockups showing an imaginary interface | On any product overview, show a legible crop of the real question editor with realistic sample data. |
| 28 | Decorative charts imply analytics the product never calculated | Show earned and possible marks directly. Add a visualization only when it answers a separate question. |
| 29 | A hero illustration relies on generic robots, brains, or circuits | If an illustration helps, depict a specific moment such as a candidate choosing an answer or a host reviewing it. |
| 30 | Congratulatory language assumes every outcome is positive | Use “Your result is available.” Let the actual score and host feedback communicate the outcome. |

### Interaction and accessibility

Give controls familiar behavior even when the page has a distinctive visual style. These are general usability and accessibility checks adapted for the interview flow. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)

| # | Pattern to avoid | Use in BuildApp |
|---|---|---|
| 31 | Every card lifts on hover, including static content | Give hover feedback to clickable controls. Keep read-only instructions still. |
| 32 | Scroll reveals hide content until an animation runs | Render questions and answer options immediately, including with reduced motion enabled. |
| 33 | A custom cursor or magnetic button chases the pointer | Keep the pointer predictable over radio options and submission controls. |
| 34 | Rotating carousels hide instructions | Keep the full pre-interview instructions available as readable text. |
| 35 | Placeholder text serves as the field label | Label “Feedback (optional)” above the box and keep the label visible while the host types. |
| 36 | Selection, correctness, or warning severity is indicated only by color | Use radio state for selection and text such as “Your answer” and “Correct answer” on scorecards. |
| 37 | Keyboard focus disappears into a custom theme | Give controls a visible focus ring. Tab through the join and submit flows with the sticky timer visible. |
| 38 | Compact icon targets require precision taps | Make the whole answer label selectable. Aim for 44 × 44 CSS px for primary touch controls. |
| 39 | A modal interrupts every small change | Let candidates revise choices inline. Confirm the final submission once, with the unanswered count. |
| 40 | A toast is the only record of an important outcome | Give a submitted attempt a persistent receipt that explains who publishes the result. |

### Responsive layouts and real states

A convincing screenshot can still conceal a broken workflow. Review the awkward states with real content lengths. [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/) · [W3C on focus and target size](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

| # | Pattern to avoid | Use in BuildApp |
|---|---|---|
| 41 | A desktop table simply shrinks to phone width | On mobile put candidate name, attempt status, and review action first. Move secondary timestamps to detail. |
| 42 | Fixed-height boxes clip long questions or names | Test a three-line title and a paragraph-length option. Allow both containers to grow. |
| 43 | A sticky footer covers the last answer or its keyboard focus | Reserve space beneath the content and test with the phone keyboard open. |
| 44 | The empty dashboard is filled with plausible fake interviews | For a new host, show “No interviews yet” and one “Create interview” action. |
| 45 | Loading replaces the whole screen with a spinner | Keep the roster heading and column widths in place while fetching the rows. |
| 46 | Every failure displays “Something went wrong” | For an oversized résumé, name the accepted PDF format and 5 MiB limit beside the upload field. |
| 47 | A label promises “Saved” before data reaches the server | During an attempt, say “8 of 10 answered.” Reserve “Submitted” for a confirmed final submission. |
| 48 | A ticking timer shifts surrounding text or restarts on refresh | Use tabular digits and a stable width. Recalculate remaining time from the server deadline. |
| 49 | Closing entry makes all candidates appear finished | Show “Entry closed” separately from “2 candidates still answering.” Base both on server state. |
| 50 | A permanent-looking success screen hides partial failure | If publication succeeds but email queueing fails, show “Result published” and offer “Retry email.” |

## What to add for a premium finish

These are starting choices for BuildApp. Revisit them against actual screens and content before making them global styles.

| Decision | Starting specification | Where it earns its place |
|---|---|---|
| A recognizable palette | Start with paper `#F7F8F5`, white surfaces, ink `#182522`, and a deep teal action color `#145C4C`. Test each foreground/background pair. | Reuse the accent for Join, the selected radio, and the active list filter. Give warnings a separate semantic color. |
| A small, deliberate type scale | Try Source Sans 3 at 16 px for body text, 14 px for metadata, 22 px for questions, and 32 px for page titles. Use regular and semibold weights first. | Distinguish the question from its options; enable tabular figures for time and marks. |
| Comfortable reading width | Start with 60–70 characters per line for instructions and feedback. Let the roster use more horizontal space. | A candidate can follow a long prompt without sweeping across the full monitor. |
| Purposeful spacing | Use 8 px between a label and its control, 16 px within a question group, and 32 px between sections as starting values. | A host can tell which marks field and answer key belong to which question without extra borders. |
| One repeatable signature detail | Typeset scores as **18 / 24** with the earned marks prominent and the denominator quieter. Repeat the same arrangement in history and scorecards. | A recognizable detail carries real information and makes results easy to compare. |
| Layout by role | Give the host a scannable roster with aligned columns. Give the candidate a quieter reading column with the deadline and a way to review answers. | The two views feel related while serving different jobs. |
| Honest previews | On the join screen, use the actual title, duration, format, and start condition. Put “Your timer starts when you join” next to the button. | A candidate can open a shared link and decide when to start with confidence. |
| Precise feedback | After final submission, show the receipt. After publication, show marks, selected and correct answers, and the host’s optional comment. | Each screen explains what happened and what the person can do next. |
| Restraint in motion | Try a brief 120–180 ms transition for a menu or selection. Respect reduced motion. Keep the timer and question text steady. | Motion explains a change of state without stealing time or attention. |

## Review before shipping a screen

- Open it at 360 px and 1440 px, then at 200% zoom. Read the longest realistic name, title, answer, and feedback without clipping.
- Complete the primary action using only a keyboard. Check the focus order, visible focus, radio group behavior, labels, and return focus after a dialog closes.
- Measure text contrast. Target WCAG AA minimums of 4.5:1 for normal text and 3:1 for large text. Check meaningful control boundaries and status indicators separately. [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- Try an empty account, slow request, rejected upload, expired timer, and result waiting for publication. Judge the exact text the person sees.
- Ask a host to distinguish **Close entry** from **Publish result**, and a candidate to explain when their timer begins. If either answer requires a walkthrough, revise the layout or wording.
