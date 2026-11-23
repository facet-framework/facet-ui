# Changelog

## 0.1.0-rc.3

### Added

- `AppBar` for the top of `AppShell`: brand, title, meta line, centre and actions; it wraps on narrow screens. It takes `lead`, `onHome` with `homeLabel`, `stats` (a `null` figure is a dash read as "not measured"), `command` with key caps, `compact` and `onMenu`. It is a `header` landmark; the compact form leaves out `actions`, `meta`, `stats` and the centre.
- Layout components `Stack`, `Row`, `Grid` and `Page` with gaps from the spacing scale. `Grid fit` stretches columns over the full row.
- Form controls `TextInput`, `TextArea` and `Select` with `onValueChange` and `invalid`.
- Charts `Sparkline`, `BarChart` and `LineChart`. The line chart has one axis, a legend, a crosshair tooltip and a table for screen readers. `BarChart` draws bars without their own tone in one colour (`tone`, `"signal"` by default) on a visible pill track, with wrapping labels. `Sparkline` fills the area under the line by default (`area={false}` turns it off), with the `"signal"` tone and a height of 24 as defaults; a series without a measured value is named "not measured" and draws a dashed baseline, and a lone measured value between gaps is drawn as a dot.
- Charts `CalendarHeatmap` (days as a gapless grid; `count: null` is outlined as not measured), `DateHistogram` with `bucketEvents` (dated events per month or year on a gapless axis, with a caption naming total, range and peak), `BandChart` (span, target band, median and samples; `null` ends are not drawn), `Sunburst` (a visible key of the inner ring, `legend={false}` turns it into a list for screen readers only; an arc carries its label only when the whole label fits), `Treemap` with `layoutTreemap`, `Pyramid` and `ShareBar`. `categoryColor` extends the four series colours with mixes for a fifth category and beyond.
- Series colour tokens `--t-series-1` to `--t-series-4` in all four palettes.
- `RingMeter`: a share as a ring with the number in its middle, a `meter` like `Meter`; `null` draws a dashed ring and a dash.
- `Metric`: a figure with label, optional whole (`of`), unit, detail line and count-up. An unmeasured value (`null`) shows "—" and is read as "not measured", never as 0.
- Application chrome: `HistoryNav` and `HistoryMenu` (back, forward and the visited places), `NavBar` (areas with badges and a secondary group), `MobileTabBar` (its new-content dot is named for screen readers) and `MoreSheet` (remaining areas, one exclusive choice with arrow keys, actions and a footer).
- `AreaBar` and `TabPanel`: the head of an area with title, meta line, one action and a tab bar (`kind="pages"` links or `kind="tabs"` tablist) whose indicator glides to the active tab; the panel restarts its entry transition on every tab change.
- `Avatar`, `Timeline` and `Spinner` for activity and people.
- `ToastRegion`: fixed at the bottom centre, rendered into the overlay host; it adds no live region of its own.
- `ConfirmButton`: a confirmation in two presses at the same place. A press within 300 ms of arming is ignored; Escape, blur and a mouse pointer moving onto another control disarm it.
- `LoadingState` (a named skeleton in the shape of a list, table or surface) and `OfflineState` (disconnected, since when, reconnect).
- `ErrorState kind="forbidden"` with `who`: a missing right as a status with a lock instead of an alert.
- `useOverlay`, `OverlayLayer`, `overlayHostFor`, `focusableIn` and `initialFocus` for overlays an app builds itself.
- `Toolbar` with arrow-key navigation, `ToolbarSeparator` and `ColorSwatches`.
- `Segment` options take `disabled` and `reason`, and `Segment full` shares the width.
- `Tabs` take `panelId` and `idPrefix`; `tabId(idPrefix, value)` names a tab for its panel.
- `Button busy` and `Button block`; `ListRow current`; `DataTable selectedKey`.
- `BarDatum.meta`: a quiet fourth column, hidden on narrow screens. Bar rows share their columns, so every track starts and ends at the same place.
- `ChartTone` accepts `"signal"`.
- `.t-sr-only` for text that is read but not drawn, and the icons `cursor`, `note` and `offline`.
- Three example apps in `examples/`: an agent run, a feature overview and a sticky board, with screenshots in the README.

### Changed

- **Breaking:** `Metric` replaces `Stat`: `value` and `of` are numbers or `null`, `size="large"` sets the display size, and numbers are formatted for the active locale (or by `format`).
- **Breaking:** `Toast` runs an undo window: it offers "Undo" only with `onUndo`, leaves after `duration` seconds (8 by default; `null` keeps it), pauses on hover and focus, calls `onExpire` (never after an undo) and `onDismissed`. `irreversible` says the action cannot be undone.
- **Breaking:** `Dialog` and `Sheet` render into an overlay host at the palette root. A modal one takes the focus on opening, keeps Tab inside, closes on Esc and returns the focus to the trigger; the title is a heading that names the dialog (`aria-labelledby`). `Dialog inline` stays in the page flow without scrim or trap.
- **Breaking:** `ListRow` without `href` or `onClick` renders a plain row.
- `Segment` and `Tabs` have one tab stop; the arrow keys, Home and End move and choose.
- `DataTable` with `onRowClick` is a grid: rows have one tab stop, the arrows move, Enter and Space activate. The scroll box is a named, focusable region; a sortable column that is not sorted says `aria-sort="none"`.
- `ErrorState` takes an optional `title` ("Does not load" by default) and draws `reason` as code.
- `Collection` shows `LoadingState` while loading.
- `Button href` keeps every attribute and handler on the link.

### Fixed

- A chip's and a tab's count is separated from the label for assistive technology ("Open 4", not "Open4").
- A `Section` inside a stack, row or grid takes its spacing from the parent's gap.
- A `Meter` inside a row takes the free width.

## 0.1.0-rc.2

React controls, collections, overlays, layout primitives, application frame, design tokens, typography, themes and English/German localization. ESM and CommonJS entries include TypeScript declarations.
