export function generateVirtualFile(fileUrl: string, exportId: string) {
  return `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import * as mod from "${fileUrl}";

    const BladeXExport = mod?.default;
    const Page = BladeXExport?.component;
    const bladeXExportKey = ${JSON.stringify(exportId)};
    const bladeXRuntimeKey = Symbol.for("bladex.runtime");
    const bladeXDataContextKey = Symbol.for("bladex.dataContext");
    const bladeXReactKey = Symbol.for("bladex.react");

    globalThis[bladeXReactKey] = React;

    if (!Page) {
      console.error("BladeX Debug:", mod);
      throw new Error("Invalid BladeX page: missing component()");
    }

    function getBladeXDataContext() {
      globalThis[bladeXDataContextKey] ||= React.createContext(undefined);

      return globalThis[bladeXDataContextKey];
    }

    function createBladeXRuntime() {
      const exports = new Map();
      const records = new WeakMap();
      const containers = new Set();
      const diagnostics = new Map();
      const DataContext = getBladeXDataContext();
      const maxDiagnosticEntries = 50;
      let observer = null;
      let mountScheduled = false;

      class BladeXErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { error: null };
        }

        static getDerivedStateFromError(error) {
          return { error };
        }

        componentDidCatch(error) {
          this.props.onError(error);
        }

        render() {
          if (this.state.error) {
            return this.props.debug
              ? React.createElement(
                  "pre",
                  {
                    style: {
                      color: "#b91c1c",
                      whiteSpace: "pre-wrap",
                    },
                  },
                  "BladeX render failed. See console for details.",
                )
              : null;
          }

          return this.props.children;
        }
      }

      function isDebugEnabled() {
        return Boolean(globalThis.__BLADEX_DEBUG__);
      }

      function setState(container, state, errorCode) {
        container.dataset.bladexState = state;

        if (errorCode) {
          container.dataset.bladexErrorCode = errorCode;
        } else {
          delete container.dataset.bladexErrorCode;
        }
      }

      function getInstanceId(container) {
        return (
          container.dataset.bladexInstance ||
          container.dataset.bladexExport ||
          "unknown"
        );
      }

      function remember(container, patch) {
        const instanceId = getInstanceId(container);
        const previous = diagnostics.get(instanceId) || {};

        diagnostics.delete(instanceId);
        diagnostics.set(instanceId, {
          ...previous,
          instanceId,
          exportId: container.dataset.bladexExport || null,
          state: container.dataset.bladexState || "pending",
          attempts: Number(container.dataset.bladexAttempts || 0),
          connected: container.isConnected,
          updatedAt: Date.now(),
          ...patch,
        });

        pruneDiagnostics();
      }

      function pruneDiagnostics() {
        while (diagnostics.size > maxDiagnosticEntries) {
          let keyToDelete = null;

          for (const [key, value] of diagnostics) {
            if (value.state === "unmounted") {
              keyToDelete = key;
              break;
            }
          }

          diagnostics.delete(keyToDelete || diagnostics.keys().next().value);
        }
      }

      function getDirectChildren(container, selector) {
        return Array.from(container.children).filter((child) =>
          child.matches(selector),
        );
      }

      function getRootElement(container) {
        const roots = getDirectChildren(container, "[data-bladex-root]");

        if (roots.length !== 1) {
          fail(container, roots.length ? "MULTIPLE_ROOTS" : "MISSING_ROOT");
          return null;
        }

        return roots[0];
      }

      function parseProps(container) {
        const propsElement = getDirectChildren(
          container,
          "script[type='application/json'][data-bladex-props]",
        )[0];

        if (!propsElement) {
          return {};
        }

        const raw = propsElement.textContent?.trim();

        if (!raw) {
          return {};
        }

        try {
          return JSON.parse(raw);
        } catch (error) {
          fail(container, "INVALID_PROPS", error);
          return null;
        }
      }

      function fail(container, code, error) {
        setState(container, "failed", code);
        remember(container, {
          errorCode: code,
          lastError: error ? String(error?.message || error) : undefined,
        });

        if (isDebugEnabled() && error) {
          console.error("BladeX mount failed", {
            code,
            container,
            error,
          });
        }
      }

      function renderRecord(record, props, cause) {
        const entry = exports.get(record.exportId);

        if (!entry?.component) {
          fail(record.container, "UNKNOWN_EXPORT");
          return;
        }

        const onError = (error) => {
          fail(record.container, "RENDER_ERROR", error);
        };

        setState(record.container, "mounting");

        try {
          record.root.render(
            React.createElement(
              DataContext.Provider,
              { value: props },
              React.createElement(
                BladeXErrorBoundary,
                {
                  debug: isDebugEnabled(),
                  onError,
                  key:
                    record.instanceId +
                    ":" +
                    record.attempts +
                    ":" +
                    entry.version,
                },
                React.createElement(entry.component),
              ),
            ),
          );

          record.container.dataset.bladexMounted = "true";
          setState(record.container, "mounted");
          remember(record.container, {
            lastCause: cause,
            lastError: undefined,
            mountedAt: record.mountedAt,
          });
        } catch (error) {
          fail(record.container, "RENDER_ERROR", error);
        }
      }

      function mountContainer(container, cause = "manual") {
        if (!(container instanceof HTMLElement)) {
          return;
        }

        if (!container.isConnected && !container.dataset.bladexAllowDisconnected) {
          fail(container, "DISCONNECTED");
          return;
        }

        const exportId = container.dataset.bladexExport;
        const instanceId = container.dataset.bladexInstance;

        if (!exportId) {
          fail(container, "MISSING_EXPORT_ID");
          return;
        }

        if (!instanceId) {
          fail(container, "MISSING_INSTANCE_ID");
          return;
        }

        containers.add(container);

        if (!exports.has(exportId)) {
          setState(container, "pending");
          remember(container, {
            errorCode: undefined,
            lastCause: cause,
          });
          return;
        }

        const rootElement = getRootElement(container);

        if (!rootElement) {
          return;
        }

        const props = parseProps(container);

        if (props === null) {
          return;
        }

        let record = records.get(container);

        if (record && record.rootElement !== rootElement) {
          unmountContainer(container);
          record = undefined;
        }

        if (record && container.dataset.bladexState === "failed") {
          unmountContainer(container);
          record = undefined;
        }

        if (!record) {
          setState(container, "loading");

          const attempts = Number(container.dataset.bladexAttempts || 0) + 1;
          container.dataset.bladexAttempts = String(attempts);

          record = {
            root: createRoot(rootElement),
            container,
            rootElement,
            exportId,
            instanceId,
            mountedAt: Date.now(),
            attempts,
          };

          records.set(container, record);
        }

        renderRecord(record, props, cause);
      }

      function findContainers(root = document) {
        const found = [];

        if (
          root instanceof HTMLElement &&
          root.matches("[data-bladex-component]")
        ) {
          found.push(root);
        }

        if ("querySelectorAll" in root) {
          found.push(...root.querySelectorAll("[data-bladex-component]"));
        }

        return found;
      }

      function unmountContainer(container) {
        const record = records.get(container);

        containers.delete(container);

        if (!record) {
          setState(container, "unmounted");
          remember(container, { lastCause: "unmount" });
          return;
        }

        try {
          record.root.unmount();
        } catch (error) {
          fail(container, "UNMOUNT_ERROR", error);
        } finally {
          records.delete(container);
          delete container.dataset.bladexMounted;
          setState(container, "unmounted");
          remember(container, { lastCause: "unmount" });
        }
      }

      function unmountRemovedNode(node) {
        if (!(node instanceof HTMLElement)) {
          return;
        }

        if (node.matches("[data-bladex-component]")) {
          unmountContainer(node);
        }

        node
          .querySelectorAll("[data-bladex-component]")
          .forEach((container) => unmountContainer(container));
      }

      function cleanupDisconnected() {
        Array.from(containers).forEach((container) => {
          if (!document.contains(container)) {
            unmountContainer(container);
          }
        });
      }

      function mountAll(root = document, cause = "manual") {
        cleanupDisconnected();
        findContainers(root).forEach((container) =>
          mountContainer(container, cause),
        );
      }

      function scheduleMount(root = document, cause = "mutation") {
        if (mountScheduled) {
          return;
        }

        mountScheduled = true;
        queueMicrotask(() => {
          mountScheduled = false;
          mountAll(root, cause);
        });
      }

      function startObserver() {
        if (observer || typeof MutationObserver === "undefined") {
          return;
        }

        const target = document.documentElement || document.body;

        if (!target) {
          return;
        }

        observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            mutation.removedNodes.forEach(unmountRemovedNode);

            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                scheduleMount(node, "mutation");
              }
            });
          }
        });

        observer.observe(target, {
          childList: true,
          subtree: true,
        });
      }

      function stopObserver() {
        observer?.disconnect();
        observer = null;
      }

      function registerExport(exportId, entry) {
        if (!entry?.component) {
          console.error("BladeX Debug: invalid export", exportId, entry);
          return;
        }

        const previous = exports.get(exportId);

        exports.set(exportId, {
          ...entry,
          version: (previous?.version || 0) + 1,
        });

        mountAll(document, "register");
      }

      function inspect() {
        return {
          version: "0.1.10",
          exports: Array.from(exports.keys()),
          instances: Array.from(diagnostics.values()),
        };
      }

      return {
        registerExport,
        mountAll,
        mountContainer,
        unmountContainer,
        inspect,
        startObserver,
        stopObserver,
      };
    }

    const runtime = globalThis[bladeXRuntimeKey] ||= createBladeXRuntime();

    runtime.startObserver();

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => runtime.mountAll(document, "dom-ready"),
        { once: true },
      );
    }

    const remount = () => runtime.mountAll(document, "navigation");

    if (!globalThis.__BLADEX_RUNTIME_EVENTS__) {
      globalThis.__BLADEX_RUNTIME_EVENTS__ = true;

      document.addEventListener("livewire:navigated", remount);
      document.addEventListener("turbo:load", remount);
      document.addEventListener("htmx:afterSwap", remount);
      window.addEventListener("pageshow", remount);
    }

    runtime.registerExport(bladeXExportKey, {
      component: Page,
      kind: BladeXExport.__bladex_component ? "component" : "page",
    });

    export * from "${fileUrl}";
  `;
}
