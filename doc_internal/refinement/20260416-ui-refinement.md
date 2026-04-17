# Arrival Resources — Website Refinement Spec

## Cursor-Ready Implementation Brief

### Purpose

Use this document as the source of truth for incremental UI/UX refinement of the Arrival Resources website. Implement changes in small, testable batches. Do not redesign unrelated parts of the product while working on a batch.

### Working Rules for Cursor

* Read this full document before making changes.
* Implement only the requested batch in each pass.
* Do not change data logic, layout, or styling outside the scoped items unless required for the batch.
* Preserve existing functionality unless this document explicitly calls for a change.
* When a requirement is marked deferred or exploratory, do not implement it yet.
* After each batch, summarize:

  * what was changed
  * which files were modified
  * any assumptions made
  * any follow-up questions or blockers


### Recommended Implementation Order

#### Batch 1 — Header and top-level hierarchy

Implement only the header and top-level navigation refinements.

**Scope:**

* Strengthen header branding and hierarchy.
* Update subtitle copy to: “Finding welcoming services and community resources in Greater Boston.”
* Increase navigation readability.
* Add icons to top navigation items.
* Improve Map/List toggle prominence.
* Replace favicon/header icon with an open-source placeholder icon if easy; otherwise use a temporary placeholder and note it.

**Do not include yet:**

* search changes
* sidebar changes
* map filtering logic
* popup or list-card changes

**Success check:**
The page should immediately feel more intentional and easier to understand at first glance.

---

#### Batch 2 — Search and active-filter usability

Implement only search simplification and filter-state clarity.

**Scope:**

* Combine name/location search into one unified search bar.
* Add autocomplete suggestions for organization names.
* Tighten map zoom behavior for zip-code/address search.
* Clarify selected-filter states.
* Add removable selected-filter chips.
* Rename “Clear” to “Clear all.”
* Keep click-again-to-deselect as a secondary shortcut.
* Change service-tag multi-select logic from AND to OR.

**Do not include yet:**

* service-tag grouping
* category filter UI
* popup redesign
* list view redesign

**Success check:**
Users should be able to search and manage filters without guessing how the interface works.

---

#### Batch 3 — Sidebar structure and service-tag discovery

Implement only sidebar prioritization and service-tag organization.

**Scope:**

* Re-prioritize sidebar space so service tags are more prominent.
* Reduce prominence of “Counts by Category.”
* Make “Counts by Category” collapsible or otherwise visually secondary.
* Group service tags into meaningful browseable sections.
* Review service-tag ordering within groups.
* Do not add a separate service-tag search yet.

**Do not include yet:**

* category filter UI
* map marker decluttering
* popup/list/export changes

**Success check:**
The sidebar should feel easier for first-time users to browse, with service needs clearly prioritized.

---

#### Batch 4 — Category filtering across both views

Implement category filtering as a shared sidebar filter.

**Scope:**

* Add category filtering to the sidebar.
* Place category filtering below service tags.
* Keep category visually secondary to service tags.
* Make category filtering work in both Map and List views.
* Keep the legend informational only.
* Keep selected/unselected category states clear and consistent with other filters.

**Do not include yet:**

* legend-as-filter behavior
* label-on-map experiments

**Success check:**
Users should be able to filter by category without relying on the map legend.

---

#### Batch 5 — Map interaction and popup refinement

Implement only map interaction improvements and popup cleanup.

**Scope:**

* Improve clickability of overlapping points at close zoom levels.
* Keep popup-based place inspection.
* Do not add automatic point labels.
* Refine popup card hierarchy.
* Standardize popup action row.
* Order actions as Website, Google Maps / Directions, Phone, Email.
* Use consistent icon-plus-label treatment for all available actions.
* Make popup service tags visually lighter if needed.

**Success check:**
The map should feel easier to interact with, and popups should scan more clearly.

---

#### Batch 6 — List view and export/print refinement

Implement only list-view cleanup and export/print improvements.

**Scope:**

* Improve list-card hierarchy and scanning.
* Align list-card actions with popup action priorities.
* Remove opening hours from list view.
* Rename “Download PDF” if needed to better match behavior.
* Refine export modal wording.
* Keep two export scopes: current page only, all filtered results.
* Polish print layout formatting.
* Keep print layout compact and image-free.
* Keep disclaimer, but visually secondary.

**Success check:**
List view should scan faster, and exported output should feel practical and intentional.

---

### Deferred / Not for This Round

Do not implement these unless explicitly requested later:

* multilingual support
* service-tag search input
* automatic place labels on the map
* advanced AND/OR filter mode switching
* additional-resources full page/modal decision beyond the current callout concept


---

## Purpose

This document captures proposed improvements to the Arrival Resources website based on user feedback and visual review. It is written so Cursor can implement changes in clear, incremental steps.

---

## How to Use This File

* Add one change request per section.
* Keep requests concrete and implementation-oriented.
* When possible, specify:

  * the page or component affected
  * the current issue
  * the desired change
  * the reason for the change
  * any implementation notes or constraints
* Group related changes into phases so they can be implemented step by step.

---

## Suggested Priority Levels

* **P1** — important / should fix soon
* **P2** — useful improvement
* **P3** — nice to have

---

## Suggested Effort Levels

* **Small** — quick UI/content tweak
* **Medium** — component-level revision
* **Large** — multi-component or structural change

---

# Change Requests

## CR-001

**Title:** Strengthen header branding and hierarchy

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Global header / site branding

**Current Issue:**
The site title "Arrival Resources" and subtitle "Find Welcoming Services in Greater Boston" feel visually too small and understated. The brand does not currently establish a strong first impression or clear information hierarchy.

**Desired Change:**
Increase the visual prominence of the site branding in the header. Enlarge the site title, slightly increase the subtitle size, and improve spacing and hierarchy so the header feels more intentional and confident.

**Reason / Goal:**
The website needs a stronger identity and clearer first-read message. Users should immediately understand what the site is and who it serves.

**Implementation Notes:**

* Increase title font size and/or weight.
* Increase subtitle size slightly, but keep it clearly secondary to the title.
* Review spacing between icon, title, subtitle, and navigation.
* Consider slightly increasing header height if needed.
* Keep the tone welcoming and clean rather than corporate.

**Acceptance Criteria:**

* Site title is clearly more prominent than it is now.
* Subtitle remains readable at a glance and feels intentionally paired with the title.
* Header feels balanced without overcrowding the navigation.

---

## CR-002

**Title:** Replace current favicon / brand icon with a more distinctive visual identity

**Priority:** P2
**Effort:** Small
**Status:** Proposed

**Page / Component:** Favicon, header logo/icon

**Current Issue:**
The current icon appears to be a generic location pin. It works functionally but does not give the site a distinctive or memorable identity.

**Desired Change:**
Replace the current icon with a more intentional symbol that better reflects arrival, welcome, orientation, or community support.

**Reason / Goal:**
A distinctive icon will make the site feel more polished and memorable, and less like a default map-based interface.

**Implementation Notes:**

* Explore open-source icons first before designing a custom one.
* Favor simple line or filled icons that still read clearly at favicon size.
* Possible directions: compass / wayfinding, doorway, helping hand, community node, map-with-spark, or home-with-path.
* The selected icon should work both in the browser tab and in the site header.
* If no strong ready-made option fits, prepare a placeholder choice now and revisit later with a custom icon.

**Acceptance Criteria:**

* The new favicon is visually clearer and more distinctive than a generic pin.
* The icon remains legible at small sizes.
* The icon aligns with the website’s welcoming and navigational purpose.

---

## CR-003

**Title:** Improve navigation readability and add icons to top-level tabs

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Top navigation (Home, About, Feedback, future Additional Resources)

**Current Issue:**
The navigation text is currently a bit small and visually quiet. Tabs feel functional but do not provide strong visual guidance or affordance.

**Desired Change:**
Increase the font size of top-level navigation items and add a small icon next to each tab label.

**Reason / Goal:**
This will improve readability, strengthen the interface hierarchy, and help each page feel easier to scan.

**Implementation Notes:**

* Increase nav font size slightly.
* Add simple, consistent icons to the left of each label.
* Suggested mapping:

  * Home: home / map-home icon
  * About: info-circle / book-open icon
  * Feedback: message-square / comment icon
  * Additional Resources: external-link / library / compass icon
* Avoid overly decorative icons; keep them small and aligned.
* Check spacing so the nav still feels lightweight.

**Acceptance Criteria:**

* Navigation labels are easier to read than before.
* Each nav item includes a visually appropriate icon.
* Navigation remains clean and not visually cluttered.

---

## CR-004

**Title:** Add an “Additional Resources” pathway for needs not covered on the map

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Dashboard/map area and list view

**Current Issue:**
Users may not find what they need within the curated map and may not realize that there are other trusted external resource directories available.

**Desired Change:**
Create a clearly visible pathway to external, trusted resource collections for categories not fully covered by Arrival Resources, using a floating callout above the map rather than a top-level navigation item.

**Reason / Goal:**
This reduces dead ends, sets realistic expectations, and better supports users with broader or more urgent needs.

**Implementation Notes:**

* Do not add “Additional Resources” as a top-level navigation item for now.
* Create a lightweight floating callout positioned above the map in the top-right area of the dashboard.
* The same callout should remain visible in both Map view and List view.
* Draft language direction: “Can’t find what you’re looking for? Explore additional trusted resources.”
* This section can link out to partner or public resource websites for domains where this site is intentionally not comprehensive.
* Keep the callout visible but secondary; it should feel like a supportive escape hatch rather than a primary action.
* Ensure the callout integrates cleanly with the layout and does not obstruct map controls or the legend.

**Acceptance Criteria:**

* Users can easily discover external trusted resources from the main dashboard.
* The callout appears above the map in the top-right area and also remains available in List view.
* The site communicates that the map is curated but not exhaustive.
* The additional resources pathway feels helpful, not like an error state.

---

## CR-005

**Title:** Simplify sidebar search into one unified search experience

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Sidebar search controls

**Current Issue:**
The current sidebar uses separate mechanisms for name search and zip-code/location search. This makes the search experience feel fragmented and slightly harder to understand at a glance.

**Desired Change:**
Combine the current search inputs into a single unified search bar that supports multiple input types, including organization name, zip code, and address.

**Reason / Goal:**
A single search field will make the interface easier to understand, reduce visual clutter, and better match user expectations from modern search interfaces.

**Implementation Notes:**

* Replace separate search-by-name and zip-code inputs with one combined search bar.
* Use helper text / placeholder copy such as: “Search by organization name, zip code, or address.”
* The interaction model should make it clear that different input types are accepted without requiring the user to choose a mode first.
* Preserve the current “Near me” action as a separate control.
* Consider whether the search button label should remain “Search” or become a lighter inline affordance depending on the final UI.

**Acceptance Criteria:**

* Users can understand the purpose of the search control without needing to interpret two separate inputs.
* One search field accepts organization names, zip codes, and addresses.
* The search area feels simpler and more intuitive than the current design.

---

## CR-006

**Title:** Add autocomplete suggestions for organization-name search

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Unified sidebar search

**Current Issue:**
Users may need to type the full organization name to find a match, which adds unnecessary effort and reduces discoverability.

**Desired Change:**
Add autocomplete suggestions when users type organization names, so likely matching places from the internal database appear in a dropdown and can be selected directly.

**Reason / Goal:**
This makes search faster, lowers typing burden, and helps users discover relevant places even if they only know part of the name.

**Implementation Notes:**

* Trigger suggestions as the user types.
* Suggestions should be based on the site’s own place database.
* Selecting a suggestion should take the user directly to the relevant place result.
* Prioritize exact-prefix and close partial matches.
* Keep the dropdown visually lightweight and easy to scan.
* Make sure keyboard navigation is supported.

**Acceptance Criteria:**

* Typing part of an organization name surfaces relevant suggestions.
* Users can select a result from the dropdown without typing the full name.
* Suggestion behavior feels fast and predictable.

---

## CR-007

**Title:** Tighten map re-centering and zoom behavior for zip-code or address search

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Map behavior after location-based search

**Current Issue:**
When users search by zip code, the map does reorient, but the resulting extent still feels too broad. It does not zoom in enough to make the location change feel meaningful.

**Desired Change:**
Adjust the map behavior so zip-code and address searches zoom to a tighter, more relevant extent.

**Reason / Goal:**
Users should feel that the map has clearly moved to the searched area. The result should create a stronger sense of orientation and geographic specificity.

**Implementation Notes:**

* For zip-code searches, zoom more tightly to the corresponding boundary or approximate search area.
* For address searches, use an appropriately focused extent rather than a broad regional view.
* Avoid over-zooming to the point where users lose local context, but make the change much more noticeable than it is now.
* Review whether different input types should use different zoom rules.
* Preserve smooth map transition behavior.

**Acceptance Criteria:**

* Searching a zip code results in a noticeably tighter and more relevant map extent.
* The map reorientation feels meaningful rather than subtle.
* Users can immediately tell that the map has focused on the searched area.

---

## CR-008

**Title:** Re-prioritize sidebar space so service-tag filtering is more prominent

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Sidebar layout beneath search controls

**Current Issue:**
The service-tag area is constrained and requires scrolling, while the “Counts by Category” section occupies visible space even though it is more useful for research or overview purposes than for direct resource-finding.

**Desired Change:**
Give more visible space and priority to service-tag filtering, and reduce the default prominence of the “Counts by Category” summary.

**Reason / Goal:**
For most users, service tags are a primary way to find what they need. The sidebar should prioritize actions that support discovery over summary statistics.

**Implementation Notes:**

* Consider making “Counts by Category” collapsible by default.
* Alternatively, move “Counts by Category” lower in the sidebar or into a secondary panel.
* Preserve access to the category summary, but make it clearly secondary to service filtering.
* Rebalance vertical space so more service tags are visible without extra scrolling.

**Acceptance Criteria:**

* Users can see more service tags at once than in the current design.
* “Counts by Category” remains available but is visually secondary.
* The sidebar feels more aligned with resource-finding tasks.

---

## CR-009

**Title:** Organize service tags into clearer groups instead of a single alphabetical list

**Priority:** P1
**Effort:** Large
**Status:** Proposed

**Page / Component:** Service-tag filter section

**Current Issue:**
Service tags are currently presented as one long alphabetical list. This is systematic, but it may be hard for first-time users who do not already know what kinds of tags exist.

**Desired Change:**
Reorganize service tags into meaningful groups so users can browse them more intuitively.

**Reason / Goal:**
Grouped tags will reduce cognitive load and help users recognize relevant kinds of support more quickly.

**Implementation Notes:**

* Explore groupings such as family / children / youth, education, work and income, health and wellness, legal / civic / immigration, daily needs, technology / access, community and culture, and similar themes.
* Group names should be plain-language and easy to scan.
* Groups may be expandable/collapsible if needed.
* Avoid overcomplicating the structure; the grouping system should clarify rather than bury options.
* Revisit tag labeling if some tag names are too technical or uneven in style.

**Acceptance Criteria:**

* Service tags are easier to browse for first-time users.
* Tags are presented in a structure that feels meaningful rather than purely alphabetical.
* Users can identify relevant service areas more quickly than before.

---

## CR-010

**Title:** Review service-tag ordering to surface the most useful options earlier

**Priority:** P2
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Service-tag filter section

**Current Issue:**
Alphabetical ordering is neutral, but it may not be the most helpful ordering for users trying to quickly identify common or urgent service needs.

**Desired Change:**
Review whether service tags should be ordered by practical usefulness rather than strictly alphabetically.

**Reason / Goal:**
A more intentional order may help first-time users find common needs faster.

**Implementation Notes:**

* Test whether certain high-demand or foundational service areas should appear earlier within each group.
* Avoid introducing hidden bias or making the ordering feel arbitrary.
* If grouping is adopted, ordering may be handled at two levels: group order and tag order within group.
* Consider whether “frequently used” or “common needs” logic is appropriate, or whether a curated manual order is better.

**Acceptance Criteria:**

* The ordering feels intentional and helpful.
* Common needs are easier to spot without making the structure confusing.
* The final order is more usable than a pure alphabetical scan for first-time users.

---

## CR-011

**Title:** Explore adding search within service tags

**Priority:** P2
**Effort:** Medium
**Status:** Deferred

**Page / Component:** Service-tag filter section

**Current Issue:**
Users currently need to browse and click through the visible tag list, which may become cumbersome when there are many tags.

**Desired Change:**
Consider adding a lightweight internal search or filter for service tags in a later iteration, only if grouped browsing still feels insufficient.

**Reason / Goal:**
This could help users quickly narrow the tag list when they already have a specific need in mind, but it should not be added before evaluating grouped browsing.

**Implementation Notes:**

* Do not implement this immediately.
* Reassess after service-tag grouping is in place and tested.
* If later added, this should supplement, not replace, browseable service tags.
* A small “Search services” input could filter visible tags as the user types.
* Keep the interaction simple and immediate.

**Acceptance Criteria:**

* Decision remains deferred until grouped browsing is tested.
* Any later implementation keeps both browsing and searching available.

---

## CR-012

**Title:** Add category-based filtering controls for map and list results

**Priority:** P1
**Effort:** Medium
**Status:** Updated

**Page / Component:** Sidebar filters across Map and List views

**Current Issue:**
The current interface shows color-coded place categories in the legend, but category filtering is not exposed as a standard, shared filter control for both views.

**Desired Change:**
Add category filtering to the sidebar so it is available in both Map and List views, while keeping the map legend informational only.

**Reason / Goal:**
Category filtering should be discoverable and consistent across browsing modes. Users should not need to rely on the map legend to access an important filter.

**Implementation Notes:**

* Place category filtering in the sidebar as a secondary filter section.
* Keep service tags more prominent than category filters.
* Position category filters below the service-tag section rather than above it.
* Keep the map legend passive / informational only.
* The sidebar category filter should control both Map and List views.
* The legend can still reflect the currently visible categories, but it should not act as the filter control.
* Make category selected/unselected states clear and consistent with the overall filter system.
* Keep category filtering collapsed by default.

**Acceptance Criteria:**

* Users can filter results by category from the sidebar in both Map and List views.
* Service tags remain the more prominent primary filter.
* The legend remains informational only.
* Category filtering feels consistent and discoverable across the interface.

---

## CR-013

**Title:** Explore zoom-dependent map labels for individual places

**Priority:** P2
**Effort:** Large
**Status:** Deferred

**Page / Component:** Map rendering / marker labeling

**Current Issue:**
Individual map points currently rely on popups or selection for identification. Users cannot easily scan nearby places by name directly on the map.

**Desired Change:**
Hold off on automatic place labels for now. Continue using click-based popups as the primary way to inspect individual places.

**Reason / Goal:**
This avoids clutter in dense areas and keeps the map calm while other filtering and interaction improvements are implemented first.

**Implementation Notes:**

* Do not implement automatic place labels in the current iteration.
* Continue using the existing popup model for place details.
* Revisit only if future testing shows that users struggle to inspect nearby places efficiently.

**Acceptance Criteria:**

* Decision remains deferred.
* Place information continues to be accessed through popups after clicking markers.

---

## CR-014

**Title:** Improve clickability of overlapping points at close zoom levels

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Map marker rendering / close-zoom interaction

**Current Issue:**
Even at close zoom levels, some points still overlap visually, making it hard for users to distinguish and click separate places located at or near the same address.

**Desired Change:**
Adjust the display of overlapping points at close zoom levels so users can more easily see and click colocated or nearly colocated services.

**Reason / Goal:**
Users should be able to inspect nearby services individually without struggling to select the correct point.

**Implementation Notes:**

* Explore a slight offset or “decluttering” behavior for markers that share the same or nearly the same coordinates.
* Apply this only at sufficiently close zoom levels so the map remains geographically truthful at broader scales.
* Keep the behavior subtle and understandable; users should not feel that points are being misleadingly relocated.
* Consider techniques similar to spiderfying, small radial offsets, or expanded click targets.
* Preserve access to colocated services while still conveying that they are in the same general location.
* Ensure popup behavior remains clear when selecting one of several nearby points.

**Acceptance Criteria:**

* At close zoom, overlapping or nearly overlapping points become easier to distinguish and click individually.
* The map still communicates that the services are colocated or near-colocated.
* The interaction feels helpful rather than visually confusing.

---

## CR-015

**Title:** Refine popup card hierarchy and action layout

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Map popup card

**Current Issue:**
The popup contains the right information, but the layout feels somewhat dense and visually uneven. Contact and action items do not yet have a strong hierarchy, and some elements compete for attention.

**Desired Change:**
Refine the popup card so the place name, organization, address, actions, and service tags are easier to scan in a clear order.

**Reason / Goal:**
Users should be able to understand the place quickly and act on it immediately without needing to visually parse the whole card.

**Implementation Notes:**

* Keep the overall popup structure, but improve visual hierarchy.
* Make the place name the strongest text element.
* Keep the organization name secondary and lighter.
* Keep the address readable but visually quieter than the title and actions.
* Treat phone, website, email, and Google Maps as a clear action row or action group.
* Reduce the visual heaviness of outlined buttons if they currently compete too much with the content.
* Make action links/buttons consistent in style, spacing, and emphasis.
* Ensure the close button remains accessible without dominating the card.

**Acceptance Criteria:**

* Users can identify the place name, organization, and location at a glance.
* Contact and navigation actions are easier to notice and use.
* The popup feels cleaner and more balanced than the current version.

---

## CR-016

**Title:** Standardize primary and secondary actions within popup cards

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Map popup card actions

**Current Issue:**
Different action types such as phone, website, email, and Google Maps do not yet communicate a clear and consistent priority. The phone action currently benefits from icon treatment, while other actions feel less visually supported.

**Desired Change:**
Create a more consistent action system inside popups, with clearer action ordering and icon treatment across all available actions.

**Reason / Goal:**
Users should immediately understand what they can do next and see the most likely actions first, especially Website and Google Maps / Directions.

**Implementation Notes:**

* Use a consistent icon-plus-label treatment for popup actions rather than giving only the phone action an icon.
* Reorder actions so that Website and Google Maps / Directions appear before Phone and Email.
* Treat Website and Google Maps / Directions as the most likely first actions for users.
* Keep phone and email easily available when present, but visually secondary to browsing and navigation actions.
* Make all actions consistent in style, spacing, and emphasis.
* Avoid mixing one emphasized action with several unsupported plain-text links unless the hierarchy is intentional.
* Ensure the layout still works gracefully when some fields are missing.

**Acceptance Criteria:**

* Actions feel visually consistent across popups.
* Website and Google Maps / Directions appear before Phone and Email.
* All available actions use a coherent icon-plus-label system.
* Popups remain clean even when different organizations have different available fields.

---

## CR-017

**Title:** Improve service-tag presentation within popup cards

**Priority:** P2
**Effort:** Small
**Status:** Proposed

**Page / Component:** Map popup card service-tag chips

**Current Issue:**
The service tags are useful, but in dense popups they can feel visually busy and may compete with more urgent details such as contact actions.

**Desired Change:**
Keep service tags in the popup, but refine their presentation so they support scanning without overwhelming the card.

**Reason / Goal:**
Users should be able to quickly understand what services are offered while still keeping the popup focused on identity and action.

**Implementation Notes:**

* Keep service tags as compact chips or pills.
* Reduce visual dominance if needed through lighter borders, smaller size, or clearer spacing.
* Consider limiting the initially shown tags with an option to expand only if very long lists become visually heavy.
* Preserve full tag visibility where feasible, since the tags are core to resource understanding.

**Acceptance Criteria:**

* Service tags remain visible and useful.
* The popup feels organized rather than crowded.
* Tag styling supports readability without overpowering the rest of the card.

---

## CR-018

**Title:** Make Map/List view switch more prominent and easier to interpret

**Priority:** P2
**Effort:** Small
**Status:** Proposed

**Page / Component:** View mode toggle

**Current Issue:**
The Map/List toggle works, but it is visually modest relative to how important the view choice is. It may read more like a small local control than a major mode switch.

**Desired Change:**
Strengthen the visual treatment of the Map/List toggle so users can more quickly understand and switch between the two main browsing modes.

**Reason / Goal:**
Map and List are two primary ways of exploring results, so the control should feel appropriately important and familiar.

**Implementation Notes:**

* Keep the control compact, but give it slightly stronger prominence.
* Make the active state highly legible.
* Ensure the control still feels lightweight and not like a tab bar for the whole site.
* Consider icon-plus-label treatment if it improves clarity.

**Acceptance Criteria:**

* Users can immediately identify Map and List as the two main browsing modes.
* The active view state is obvious.
* Switching views feels straightforward and familiar.

---

## CR-019

**Title:** Clarify active filter states and deselection behavior

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Sidebar filters and selected-filter interaction

**Current Issue:**
Service tags are multi-select and can be deselected by clicking again or by using the Clear button, but this interaction may not be fully obvious to first-time users. The selected-tags summary is currently easy to miss, and users may need clearer feedback about what is active and how to remove filters.

**Desired Change:**
Make active filters more visible and make filter removal patterns feel more standard and immediately understandable.

**Reason / Goal:**
Users should never have to guess whether a filter is currently active or how to undo it.

**Implementation Notes:**

* Strengthen the selected state styling for active service tags.
* Add a clearer “selected filters” summary area near the top or bottom of the service-tag section.
* Display active filters as removable chips with an “x” so users can remove them individually.
* Preserve click-again-to-deselect behavior as a shortcut, but do not rely on it as the only cue.
* Rename the reset action from “Clear” to “Clear all.”
* Increase the visibility of the selected-filters summary text if a summary line is retained.
* Review whether category filters should follow the same selected/unselected interaction model as service tags.

**Acceptance Criteria:**

* Users can easily tell which filters are active.
* Users can remove individual filters without needing to infer hidden behavior.
* “Clear all” is easy to find and clearly understood.
* The interaction feels familiar relative to common modern filter interfaces.

---

## CR-020

**Title:** Add better empty-state and filtered-state feedback

**Priority:** P2
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Results area, sidebar, and filter feedback

**Current Issue:**
When users apply multiple filters or narrow results heavily, the interface may not yet fully communicate what combination of filters is shaping the current result set or what to do if no matches appear.

**Desired Change:**
Improve filtered-state feedback and empty-state handling so users can understand result changes and recover easily when no results match.

**Reason / Goal:**
Helpful state feedback reduces confusion and makes the interface feel more trustworthy and easier to use.

**Implementation Notes:**

* Clearly show how many filters are active and how many results remain.
* If no results match, provide a friendly empty-state message and a quick way to clear filters.
* Ensure the result count updates clearly after filtering.
* Keep the feedback calm and supportive, not error-like.

**Acceptance Criteria:**

* Users can understand why the visible results changed.
* No-results states are easy to recover from.
* Filtered states feel informative rather than opaque.

---

## CR-021

**Title:** Reconsider multi-select service-tag logic from AND to OR matching

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Service-tag filtering logic

**Current Issue:**
When users select multiple service tags, the current behavior appears to use AND logic, meaning results must match all selected tags. This can narrow results too aggressively and may not match typical user expectations for browsing support options.

**Desired Change:**
Change multi-select service-tag filtering to use OR logic by default, so results can match any selected tag rather than all selected tags.

**Reason / Goal:**
For public-facing discovery, OR logic is often more intuitive and forgiving. Users selecting several relevant needs are often trying to broaden discovery within a theme, not require every organization to offer every selected service.

**Implementation Notes:**

* Update service-tag multi-select behavior so selected tags are interpreted as any-match by default.
* Keep the result set broad enough to support exploration and reduce accidental dead ends.
* Make the filtering logic clear in the UI where appropriate, especially if multiple tags are active.
* If there is ever a need for advanced AND logic, that should be a separate, explicit future option rather than the default behavior.
* Test interaction with category filters so combined logic remains understandable.

**Acceptance Criteria:**

* Selecting multiple service tags returns organizations that match any of the selected tags.
* The behavior feels more intuitive for first-time users.
* Multi-select filtering no longer collapses the result set too aggressively in common use cases.

---

## CR-022

**Title:** Improve list-view card hierarchy and scanning

**Priority:** P1
**Effort:** Medium
**Status:** Proposed

**Page / Component:** List view result cards

**Current Issue:**
The list view is functional and information-rich, but the cards are visually dense. Hours, actions, address, and service tags all compete for attention, which can make quick scanning harder.

**Desired Change:**
Refine the list-card layout so users can scan name, organization, address, actions, and key services more quickly.

**Reason / Goal:**
List view should support fast comparison across many results, especially for users who prefer text-based browsing over map interaction.

**Implementation Notes:**

* Strengthen the hierarchy of place name, organization name, and address.
* Keep actions grouped and consistent with popup-card action styling.
* Reduce the visual weight of longer metadata such as hours.
* Consider whether hours should be collapsed, abbreviated, or moved behind a “show more” treatment in list view.
* Ensure service tags remain useful but do not overwhelm the card.
* Maintain a clean, repeatable card rhythm across long result lists.

**Acceptance Criteria:**

* Users can scan the list view more quickly.
* The most important information stands out first.
* The cards feel less dense while preserving core information.

---

## CR-023

**Title:** Align list-view actions with popup action priorities

**Priority:** P1
**Effort:** Small
**Status:** Proposed

**Page / Component:** List view result-card actions

**Current Issue:**
The list view actions work, but they should follow the same logic as the popup cards so the interface feels consistent across browsing modes.

**Desired Change:**
Use the same action hierarchy and visual language in list view as in popup cards, with Website and Google Maps / Directions prioritized ahead of Phone and Email.

**Reason / Goal:**
Consistent action patterns reduce friction and make the interface feel more polished.

**Implementation Notes:**

* Apply the same icon-plus-label system used in popup actions.
* Order actions consistently across list cards and popup cards.
* Ensure the absence of a field does not break alignment.
* Keep the action row compact enough for repeated scanning in long result lists.

**Acceptance Criteria:**

* Action ordering is consistent between list cards and popup cards.
* Actions are easy to scan and use in list view.
* Cards remain visually tidy even with variable available fields.

---

## CR-024

**Title:** Remove opening hours from list view

**Priority:** P1
**Effort:** Small
**Status:** Approved

**Page / Component:** List view result-card metadata

**Current Issue:**
Opening-hours information adds visual density to list cards and may not be reliable enough for this interface, especially when Google or building-level hours do not accurately reflect the organization itself.

**Desired Change:**
Remove opening hours from list view cards.

**Reason / Goal:**
Users are better served by going to the organization’s website or Google Maps for the most current time-related information. Removing hours will simplify the list view and reduce the risk of surfacing misleading details.

**Implementation Notes:**

* Do not show opening hours in list view cards.
* Preserve Website and Google Maps / Directions actions so users can verify current hours directly from source platforms.
* Reassess separately whether hours should appear anywhere else in the product.

**Acceptance Criteria:**

* Opening hours no longer appear in list view cards.
* List cards become visually lighter and easier to scan.
* Users still have clear pathways to verify current hours externally.

---

## CR-025

**Title:** Rename and simplify PDF export / print language

**Priority:** P1
**Effort:** Small
**Status:** Proposed

**Page / Component:** List view export control and modal

**Current Issue:**
The current control is labeled “Download PDF,” while the interaction also resembles printing/exporting. The language may be slightly more technical than necessary.

**Desired Change:**
Review whether the control and modal should use simpler, more familiar wording such as “Print or save as PDF” or “Export results.”

**Reason / Goal:**
The action should be immediately understandable to users without making them think about file formats.

**Implementation Notes:**

* Test button labels such as “Print / Save PDF,” “Save results as PDF,” or “Export results.”
* Match the button label with what actually happens in the browser flow.
* Keep the wording plain and user-facing rather than technical.
* If the primary outcome is browser print-to-PDF, say so more directly.

**Acceptance Criteria:**

* Users can quickly understand what the button does.
* The wording matches the actual behavior.
* The control feels more familiar and less technical.

---

## CR-026

**Title:** Refine export modal choices and descriptive copy

**Priority:** P1
**Effort:** Small
**Status:** Proposed

**Page / Component:** Export / print modal

**Current Issue:**
The export modal works, but the choices could be phrased more clearly and made more helpful in explaining scope.

**Desired Change:**
Refine the modal copy and option labels so users can easily distinguish between exporting the current page and exporting all filtered results.

**Reason / Goal:**
Users should feel confident about what they are exporting before they proceed.

**Implementation Notes:**

* Keep the two-scope structure: current page vs. all filtered results.
* Improve labels and helper text for clarity, for example:

  * “Current page only”
  * “All filtered results”
* Keep supporting text that states the expected number of results included.
* Ensure the selected state is obvious and accessible.
* Consider whether the modal needs a confirm button after selection, or whether selection itself should trigger the export.

**Acceptance Criteria:**

* Users can clearly distinguish the two export options.
* The option descriptions feel plain-language and unambiguous.
* The modal supports confident decision-making.

---

## CR-027

**Title:** Consider adding compact print-friendly formatting for exported results

**Priority:** P2
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Exported / printed output

**Current Issue:**
If users export many results, a visually rich card layout may produce a long or inefficient PDF.

**Desired Change:**
Use a compact, print-friendly layout for exported results rather than mirroring the full on-screen interface.

**Reason / Goal:**
A print/export document should prioritize readability, compactness, and practical use offline.

**Implementation Notes:**

* Continue omitting images from exported output.
* Prioritize organization name, place name, address, website, Google Maps / Directions, phone, email, and key service tags.
* Since list-view hours are being removed, do not include opening hours in printed output either unless there is a later reason to reintroduce them.
* Keep the export visually clean and suitable for sharing offline.
* Consider whether long tag lists should wrap more cleanly or be slightly condensed.
* Preserve the disclaimer, but ensure it does not visually dominate the page.

**Acceptance Criteria:**

* Exported results are more compact and print-friendly than the on-screen interface where appropriate.
* The exported document remains readable and useful offline.
* The layout scales reasonably for larger filtered result sets.

---

## CR-028

**Title:** Refine print layout header, result blocks, and disclaimer treatment

**Priority:** P2
**Effort:** Medium
**Status:** Proposed

**Page / Component:** Exported / printed PDF layout

**Current Issue:**
The current print layout is already clear and practical, but it could be polished further to improve readability and reduce minor formatting awkwardness across pages.

**Desired Change:**
Keep the print layout simple, but refine typography, spacing, and metadata formatting so the exported document feels more intentional and easier to use offline.

**Reason / Goal:**
Printed or saved PDFs should feel like a purposeful reference sheet, not just a browser export.

**Implementation Notes:**

* Keep the top metadata block showing generation date, export scope, and active filters.
* Ensure consistent spacing between result blocks.
* Standardize line breaks so addresses and contact fields do not wrap awkwardly.
* Consider labeling links more consistently, especially when some entries have email and others do not.
* Keep the disclaimer at the bottom of each page, but make sure it is visually secondary and compact.
* Consider adding page numbers if that is easy and does not clutter the output.
* Make sure the print layout still looks clean when only a few results appear on the final page.

**Acceptance Criteria:**

* Printed/exported results feel clean, consistent, and intentionally formatted.
* Result blocks are easy to scan across pages.
* The disclaimer remains present but visually secondary.
* Awkward wrapping and spacing issues are reduced.

---

# Notes from Feedback

* The current header feels too quiet relative to the importance of the site.
* The subtitle should communicate the purpose more strongly.
* Approved subtitle copy: “Finding welcoming services and community resources in Greater Boston.”
* The navigation labels are slightly too small.
* Adding icons may improve scanning and make the header feel more polished.
* The site needs a fallback path for users who cannot find what they need on the main map.
* The preferred placement for this is a floating callout in the top-right area above the map, also visible in List view.
* The current location-pin favicon may feel generic and could be replaced with a more distinctive open-source brand symbol.
* The current split between name search and zip-code search feels harder to understand than a unified search bar.
* Search should support partial-name matching and direct selection from suggestions.
* Zip-code and address searches should trigger a tighter, more meaningful map zoom.
* The sidebar should prioritize service-tag filtering over researcher-oriented summary statistics.
* A long alphabetical service-tag list may be hard for first-time users to browse.
* Grouping tags should be tested before adding an extra service-tag search input.
* Category filtering should live in the sidebar across both Map and List views.
* The legend should remain informational only, while reflecting the currently visible categories where appropriate.
* Automatic place labels should be deferred; click-based popups remain the preferred way to inspect places for now.
* Overlapping points at close zoom make it hard to inspect colocated services individually.
* A subtle close-zoom decluttering method may improve map usability.
* The popup card already contains the right information, but the layout could be cleaner and easier to scan.
* Popup actions should be more visually consistent and better prioritized.
* Website and Google Maps / Directions are likely more important first actions than Phone or Email for many users.
* Action icons should be applied consistently across the whole action row, not just for phone.
* The current filter interaction works, but users may need clearer cues about which filters are active and how to remove them.
* The selected-filters summary is currently too quiet and should be more noticeable.
* The reset action should read “Clear all” rather than just “Clear.”
* AND logic for multi-select service tags may be too restrictive for the site’s discovery-oriented use case.
* OR logic is likely more intuitive as the default behavior for multi-select service tags.
* The Map/List switch could be slightly more prominent.
* The list view is useful, but its cards are visually dense and could scan faster.
* Opening hours in list view are not reliable enough to justify their visual cost.
* Export/print wording should be more intuitive and aligned with the actual browser behavior.
* The export modal should clarify the difference between current-page export and all-results export.
* The current print layout is already practical because it omits images and includes export scope, filters, and a disclaimer.

