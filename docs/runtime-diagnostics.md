# BladeX Runtime Diagnostics

This document is for debugging generated BladeX views in browsers, especially
inside DOM-swapping environments such as Filament SPA mode, Livewire
`wire:navigate`, Turbo, HTMX, or custom client-side replacements.

These diagnostics are built into the self-contained generated Blade files. They
do not require an extra runtime file or any Laravel-side installation.

## Enable Debug Logging

Run this in the browser console before reproducing the issue:

```js
window.__BLADEX_DEBUG__ = true;
```

With debug enabled, BladeX logs mount and render failures to the console. Without
debug mode, BladeX keeps error details out of DOM attributes and only exposes
short error codes.

## Inspect Runtime State

Run:

```js
window[Symbol.for("bladex.runtime")]?.inspect();
```

The snapshot contains:

- `version`: BladeX runtime version.
- `exports`: registered opaque BladeX export IDs.
- `instances`: known component instances with lifecycle status, attempts,
  connection state, and last known error code. This list is capped to the latest
  50 diagnostic entries and prefers pruning old `unmounted` entries first.

Example:

```js
{
  version: "0.x.x",
  exports: ["bx-pch047"],
  instances: [
    {
      instanceId: "bx-abc123",
      exportId: "bx-pch047",
      state: "mounted",
      attempts: 1,
      connected: true,
      lastCause: "register",
      mountedAt: 1760000000000,
      updatedAt: 1760000000100
    }
  ]
}
```

## DOM Attributes

Each generated BladeX container exposes a small lifecycle surface:

```html
<div
  data-bladex-component
  data-bladex-export="bx-pch047"
  data-bladex-instance="bx-abc123"
  data-bladex-state="mounted"
  data-bladex-mounted="true"
  data-bladex-attempts="1"
>
  <script type="application/json" data-bladex-props>
    {}
  </script>
  <div data-bladex-root></div>
</div>
```

`data-bladex-export` is an opaque generated ID. It does not expose the source
file path.

`data-bladex-instance` identifies one rendered Blade component instance.

`data-bladex-state` shows the current lifecycle state.

`data-bladex-error-code` is added only when mounting fails.

## Lifecycle States

| State       | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| `pending`   | Container exists, but its export is not registered yet.      |
| `loading`   | BladeX is creating a React root for this container.          |
| `mounting`  | React render has been requested.                             |
| `mounted`   | The component was rendered into its root element.            |
| `failed`    | Validation, props parsing, mount, render, or cleanup failed. |
| `unmounted` | BladeX unmounted and cleaned up this container.              |

## Error Codes

| Code                  | Meaning                                                       |
| --------------------- | ------------------------------------------------------------- |
| `DISCONNECTED`        | The container is not connected to the document.               |
| `MISSING_EXPORT_ID`   | `data-bladex-export` is missing.                              |
| `MISSING_INSTANCE_ID` | `data-bladex-instance` is missing.                            |
| `UNKNOWN_EXPORT`      | No registered component export matches this container.        |
| `MISSING_ROOT`        | No direct `[data-bladex-root]` child was found.               |
| `MULTIPLE_ROOTS`      | More than one direct `[data-bladex-root]` child was found.    |
| `INVALID_PROPS`       | The embedded JSON props could not be parsed.                  |
| `RENDER_ERROR`        | React rendering failed or the Error Boundary caught an error. |
| `UNMOUNT_ERROR`       | React root cleanup threw an error.                            |

## SPA Mounting Behavior

The runtime automatically:

- mounts existing BladeX containers when an export registers;
- observes newly added BladeX containers with `MutationObserver`;
- unmounts React roots when containers are removed;
- remounts after `livewire:navigated`, `turbo:load`, `htmx:afterSwap`, and
  `pageshow`;
- skips already mounted containers unless the root changed or a retry is needed.

## Sensitive Data Notes

Generated BladeX files are self-contained, so any data passed to a BladeX
component through Blade props must be present in the HTML as JSON. Do not pass
secrets, API tokens, private server-only state, or data the current user should
not be allowed to inspect.

BladeX serializes the normal Blade view data available to the generated view.
In framework-heavy contexts such as Filament or Livewire, this can include
ambient view data in addition to the values you explicitly care about.

BladeX avoids exposing source file paths in DOM attributes by using opaque export
IDs, but component props remain client-visible by design.

## Quick Checklist

When a component does not appear:

1. Enable debug logging:

   ```js
   window.__BLADEX_DEBUG__ = true;
   ```

2. Trigger the navigation or DOM update again.

3. Inspect the runtime:

   ```js
   window[Symbol.for("bladex.runtime")]?.inspect();
   ```

4. Check the component wrapper:

   ```js
   document.querySelectorAll("[data-bladex-component]");
   ```

5. Look for `data-bladex-state="failed"` and `data-bladex-error-code`.
