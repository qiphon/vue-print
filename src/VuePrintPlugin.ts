import { IdString, PrintOptions } from "./types"; // Import the new interface

/**
 * @class PrintPlugin
 * @classdesc A plugin for printing HTML elements, with support for previews, async content, and various HTML standards.
 */
export class PrintPlugin {
  settings:PrintOptions;
  /**
   * Creates an instance of PrintPlugin.
   * @param {PrintOptions} options - The configuration options for the print plugin.
   */
  constructor(options: PrintOptions) {
    this.standards = { strict: "strict", loose: "loose", html5: "html5" };
    this.previewBody = null;
    this.closeButtonElement = null; // Renamed from 'close'
    this.previewPrintButton = null; // Renamed from 'previewBodyUtilPrintBtn'
    this.selectArray = []; // This property is initialized but not used. Consider removing if not needed.
    this.counter = 0;
    this.settings = { standard: this.standards.html5 } as PrintOptions; // Cast to PrintOptions
    Object.assign(this.settings, options);
    this.init();
  }

  /**
   * Initializes the print plugin, setting up the print area and process.
   */
  init() {
    this.counter++;
    this.settings.id = `printArea_${this.counter}`; // Unique ID for the print iframe
    let iframeSrc = "";

    if (this.settings.url && !this.settings.asyncUrl) {
      iframeSrc = this.settings.url;
    }

    const self = this;
    if (this.settings.asyncUrl) {
      // Handle asynchronous content loading
      return void self.settings.asyncUrl(function (asyncContent) {
        const printWindowContext = self.getPrintWindow(asyncContent); // Pass content directly if it's HTML string, or handle URL if it's a URL
        if (self.settings.preview) {
          self.loadPreviewIframe();
        } else {
          self.print(printWindowContext);
        }
      }, self.settings.vue);
    }

    // Handle synchronous content or direct URL
    const printWindowContext = this.getPrintWindow(iframeSrc);
    if (!this.settings.url) {
      this.writeContentToIframe(printWindowContext.doc);
    }

    if (this.settings.preview) {
      this.loadPreviewIframe();
    } else {
      this.print(printWindowContext);
    }
  }

  /**
   * Adds an event listener to an element, cross-browser.
   * @param {HTMLElement} element - The element to attach the event to.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The callback function to execute when the event is triggered.
   */
  addEvent(element, eventName, callback) {
    if (element.addEventListener) {
      element.addEventListener(eventName, callback, false);
    } else if (element.attachEvent) {
      element.attachEvent("on" + eventName, callback);
    } else {
      element["on" + eventName] = callback; // Fallback for older browsers
    }
  }

  /**
   * Handles the loading of the iframe in preview mode and sets up event listeners.
   */
  loadPreviewIframe() {
    const previewBoxElement = document.getElementById(
      "vue-print-nb-previewBox"
    ); // Corrected ID
    if (previewBoxElement) {
      const self = this;
      const iframeElement = previewBoxElement.querySelector("iframe");

      if (this.settings.previewBeforeOpenCallback) {
        this.settings.previewBeforeOpenCallback();
      }

      this.addEvent(iframeElement, "load", function () {
        self.showPreviewBox();
        self.removeCanvasPlaceholderImages();
        if (self.settings.previewOpenCallback) {
          self.settings.previewOpenCallback();
        }
      });

      const printButton = previewBoxElement.querySelector(
        ".previewBodyUtilPrintBtn"
      );
      if (printButton) {
        // Ensure print button exists
        this.addEvent(printButton, "click", function () {
          if (self.settings.beforeOpenCallback) {
            self.settings.beforeOpenCallback();
          }
          if (self.settings.openCallback) {
            self.settings.openCallback();
          }
          iframeElement.contentWindow.print();
          if (self.settings.closeCallback) {
            self.settings.closeCallback();
          }
        });
      }
    }
  }

  /**
   * Removes images generated from canvas elements after printing or previewing.
   */
  removeCanvasPlaceholderImages() {
    const self = this;
    try {
      if (self.elsdom) {
        // elsdom is the cloned element to be printed
        const canvasImages = self.elsdom.querySelectorAll(".canvasImg");
        for (let i = 0; i < canvasImages.length; i++) {
          canvasImages[i].remove();
        }
      }
    } catch (error) {
      console.error("Error removing canvas images:", error);
    }
  }

  /**
   * Initiates the print process for the generated iframe content.
   * @param {object} printWindowContext - The context of the print window.
   * @param {HTMLIFrameElement} printWindowContext.f - The iframe element.
   * @param {Window} printWindowContext.win - The window object of the iframe.
   * @param {Document} printWindowContext.doc - The document object of the iframe.
   */
  print(printWindowContext: {
    f: HTMLIFrameElement;
    win: Window;
    doc: Document;
  }) {
    const self = this;
    const iframeElement =
      document.getElementById(this.settings.ids) || printWindowContext.f;
    const iframeWindow = iframeElement.contentWindow;

    if (self.settings.beforeOpenCallback) {
      self.settings.beforeOpenCallback();
    }

    // The 'load' event might not be reliable here if content is already written or src is about:blank
    // It's better to ensure content is ready before calling print.
    // For direct write, it's synchronous. For URL, 'load' on iframe creation is better.
    function triggerPrint() {
      iframeWindow.focus();
      if (self.settings.openCallback) {
        self.settings.openCallback();
      }
      iframeWindow.print();
      iframeElement.remove(); // Clean up iframe after printing
      if (self.settings.closeCallback) {
        self.settings.closeCallback();
      }
      self.removeCanvasPlaceholderImages(); // Clean up canvas images
    }

    if (iframeElement.src && iframeElement.src !== "about:blank") {
      this.addEvent(iframeElement, "load", triggerPrint);
    } else {
      // If content is written directly or src is blank, trigger print after a short delay
      // to ensure DOM is ready, though direct write should be synchronous.
      setTimeout(triggerPrint, 0);
    }
  }

  /**
   * Writes the HTML content to the iframe's document.
   * @param {Document} doc - The document object of the iframe.
   */
  writeContentToIframe(doc: Document) {
    doc.open();
    doc.write(
      `${this.generateDocType()}<html>${this.generateHeadHtml()}${this.generateBodyHtml()}</html>`
    );
    doc.close();
  }

  /**
   * Generates the DOCTYPE string based on the configured standard.
   * @returns {string} The DOCTYPE string.
   */
  generateDocType() {
    if (this.settings.standard === this.standards.html5) {
      return "<!DOCTYPE html>";
    } else {
      const type =
        this.settings.standard === this.standards.loose ? " Transitional" : "";
      const dtd =
        this.settings.standard === this.standards.loose ? "loose" : "strict";
      return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01${type}//EN" "http://www.w3.org/TR/html4/${dtd}.dtd">`;
    }
  }

  /**
   * Generates the HTML <head> content for the print iframe.
   * @returns {string} The HTML string for the <head> section.
   */
  generateHeadHtml() {
    let extraHeadContent = "";
    let styleLinks = "";
    let inlineStyles = `${this.settings.styleString ?? ""};.hide-on-print { display: none !important; };`;

    if (this.settings.extraHead) {
      // Assuming extraHead is a string of HTML tags
      extraHeadContent = this.settings.extraHead;
    }

    // Collect <link> tags from the main document
    document
      .querySelectorAll("link[rel='stylesheet']")
      .forEach((linkElement) => {
        if (linkElement.href) {
          styleLinks += `<link type="text/css" rel="stylesheet" href="${linkElement.href}" >`;
        }
      });

    // Collect <style> tags content from the main document
    const styleSheets = document.styleSheets;
    if (styleSheets) {
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const currentStyleSheet = styleSheets[i];
          if (currentStyleSheet.cssRules || currentStyleSheet.rules) {
            const rules = currentStyleSheet.cssRules || currentStyleSheet.rules;
            for (let j = 0; j < rules.length; j++) {
              inlineStyles += rules[j].cssText;
            }
          }
        } catch (error) {
          // Log error if a stylesheet is inaccessible (e.g., CORS)
          console.warn(
            `Could not access stylesheet: ${styleSheets[i].href}`,
            error
          );
        }
      }
    }

    // Add extra CSS files specified in settings
    if (this.settings.extraCss) {
      const cssFiles = this.settings.extraCss.split(",");
      cssFiles.forEach((cssFile) => {
        styleLinks += `<link type="text/css" rel="stylesheet" href="${cssFile.trim()}">`;
      });
    }

    return `<head><title>${this.settings.popTitle || ""}</title>${extraHeadContent}${styleLinks}<style type="text/css">${inlineStyles}</style></head>`;
  }

  /**
   * Generates the HTML <body> content for the print iframe.
   * @returns {string} The HTML string for the <body> section.
   */
  generateBodyHtml() {
    let elementId = this.settings.ids;
    if (!elementId) {
      console.error("No element ID specified for printing.");
      return "<body>Error: No element ID specified.</body>";
    }
    elementId = elementId.replace(new RegExp("#", "g"), ""); // Remove # if present
    const targetElement = document.getElementById(elementId);

    if (!targetElement) {
      console.error(`Element with id '${elementId}' not found.`);
      return `<body>Error: Element with id '${elementId}' not found.</body>`;
    }

    this.elsdom = this.preprocessElementForPrint(targetElement);
    return "<body>" + this.getPreparedElementHtml(this.elsdom) + "</body>";
  }

  /**
   * Pre-processes the HTML element to be printed, primarily converting canvas elements to images.
   * @param {HTMLElement} element - The HTML element to process.
   * @returns {HTMLElement} The processed HTML element (actually, a clone is processed, original is returned for chaining if needed, but current use is with a clone).
   */
  preprocessElementForPrint(element: HTMLElement): HTMLElement {
    const clonedElement = element.cloneNode(true); // Work on a clone to avoid modifying the original DOM
    const canvasElements = clonedElement.querySelectorAll("canvas");

    for (let i = 0; i < canvasElements.length; i++) {
      const canvas = canvasElements[i];
      // Check if canvas is visible (not display: none)
      const canvasStyle = window.getComputedStyle(
        element.querySelectorAll("canvas")[i]
      ); // Check original canvas visibility
      if (canvasStyle.display !== "none") {
        const parent = canvas.parentNode;
        try {
          const imageDataUrl = canvas.toDataURL("image/png");
          const img = new Image();
          img.className = "canvasImg"; // Class for later identification if needed
          img.style.display = "none"; // Initially hidden, will be shown by getPreparedElementHtml
          img.src = imageDataUrl;
          parent.insertBefore(img, canvas); // Insert image before the canvas
          canvas.style.display = "none"; // Hide the original canvas in the clone
        } catch (e) {
          console.error("Canvas toDataURL error:", e);
          // If canvas is tainted, it cannot be converted to image.
        }
      }
    }
    return clonedElement;
  }

  /**
   * Clones the element and prepares its form data for printing (e.g., sets input values, selected options).
   * This also makes canvas-generated images visible and removes original canvas elements from the clone.
   * @param {HTMLElement} processedClonedElement - The cloned and preprocessed HTML element.
   * @returns {string} The outerHTML of the fully prepared element.
   */
  getPreparedElementHtml(processedClonedElement: HTMLElement): string {
    const finalClonedElement = processedClonedElement.cloneNode(true); // Clone again to isolate form processing
    const originalElement = document.getElementById(
      this.settings.ids.replace("#", "")
    ); // Get original element for form values

    const formInputsInClone = finalClonedElement.querySelectorAll(
      "input,select,textarea"
    );
    const originalFormInputs = originalElement
      ? originalElement.querySelectorAll("input,select,textarea")
      : [];

    const canvasAndImages =
      finalClonedElement.querySelectorAll(".canvasImg,canvas");

    // Handle canvas and canvas-generated images in the final clone
    for (let i = 0; i < canvasAndImages.length; i++) {
      const item = canvasAndImages[i];
      if (item.tagName.toLowerCase() === "canvas") {
        item.remove(); // Remove original canvas elements from the final print version
      } else if (item.classList.contains("canvasImg")) {
        item.style.display = "block"; // Make canvas-generated images visible
      }
    }

    // Process form inputs to reflect current values from original form
    formInputsInClone.forEach((clonedInput, index) => {
      const originalInput = originalFormInputs[index];
      if (!originalInput) return;

      const tagName = clonedInput.tagName.toLowerCase();
      const type = clonedInput.getAttribute("type")
        ? clonedInput.getAttribute("type").toLowerCase()
        : null;

      if (tagName === "input") {
        if (type === "radio" || type === "checkbox") {
          if (originalInput.checked) {
            clonedInput.setAttribute("checked", "checked");
          } else {
            clonedInput.removeAttribute("checked");
          }
        } else {
          clonedInput.setAttribute("value", originalInput.value);
        }
      } else if (tagName === "select") {
        const selectedIndex = originalInput.selectedIndex;
        if (selectedIndex > -1 && clonedInput.options[selectedIndex]) {
          // Remove selected from all options first
          for (let k = 0; k < clonedInput.options.length; k++) {
            clonedInput.options[k].removeAttribute("selected");
          }
          clonedInput.options[selectedIndex].setAttribute("selected", true);
        }
      } else if (tagName === "textarea") {
        clonedInput.textContent = originalInput.value;
      }
    });

    return finalClonedElement.outerHTML;
  }

  /**
   * Creates or gets the print iframe window and its document.
   * @param {string} iframeSrc - The source URL for the iframe. If empty, 'about:blank' is used.
   * @returns {object} An object containing the iframe element (f), its window (win), and its document (doc).
   */
  getPrintWindow(iframeSrc: string): {
    f: HTMLIFrameElement;
    win: Window;
    doc: Document;
  } {
    const iframeElement = this.createIframeElement(
      iframeSrc || `about:blank?timestamp=${new Date().getTime()}`
    );
    return {
      f: iframeElement,
      win: iframeElement.contentWindow,
      doc: iframeElement.contentWindow.document,
    };
  }

  /**
   * Shows the preview box.
   */
  showPreviewBox() {
    const previewBoxElement = document.getElementById(
      "vue-print-nb-previewBox"
    ); // Corrected ID
    if (previewBoxElement) {
      document.documentElement.style.overflow = "hidden"; // Use documentElement for html tag
      previewBoxElement.style.display = "block";
    }
  }

  /**
   * Hides the preview box and cleans up the iframe.
   */
  hidePreviewBox() {
    const previewBoxElement = document.getElementById(
      "vue-print-nb-previewBox"
    ); // Corrected ID
    if (previewBoxElement) {
      document.documentElement.style.overflow = "visible";
      const iframe = previewBoxElement.querySelector("iframe");
      if (iframe) {
        iframe.remove();
      }
      previewBoxElement.style.display = "none";
    }
  }

  /**
   * Creates or retrieves the preview box DOM elements.
   * @returns {object} An object containing references to the close button and preview body element.
   */
  createOrGetPreviewBox(): {
    closeButton: HTMLElement | null;
    previewBody: HTMLElement | null;
  } {
    let previewBoxElement = document.getElementById("vue-print-nb-previewBox"); // Corrected ID
    const previewBodyClassName = "previewBody";

    if (previewBoxElement) {
      const iframe = previewBoxElement.querySelector("iframe");
      if (iframe) {
        // If reusing, ensure old iframe is removed before new one is added by createIframeElement
        iframe.remove();
      }
      return {
        closeButton: previewBoxElement.querySelector(".previewClose"),
        previewBody: previewBoxElement.querySelector(".previewBody"),
      };
    }

    // Create preview box container
    previewBoxElement = document.createElement("div");
    previewBoxElement.setAttribute("id", "vue-print-nb-previewBox"); // Corrected ID
    previewBoxElement.style.cssText =
      "position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background: white; display:none;";
    previewBoxElement.style.zIndex = this.settings.zIndex || 20000;

    // Create header
    const headerElement = document.createElement("div");
    headerElement.setAttribute("class", "previewHeader");
    headerElement.style.cssText =
      "padding: 5px 20px; border-bottom: 1px solid #ccc;"; // Added border
    headerElement.innerHTML = this.settings.previewTitle || "Preview";
    previewBoxElement.appendChild(headerElement);

    // Create close button
    this.closeButtonElement = document.createElement("div");
    const closeButton = this.closeButtonElement;
    closeButton.setAttribute("class", "previewClose");
    closeButton.style.cssText =
      "position: absolute; top: 5px; right: 20px; width: 25px; height: 20px; cursor: pointer;";

    const closeIconBefore = document.createElement("div");
    closeIconBefore.setAttribute("class", "closeBefore");
    closeIconBefore.style.cssText =
      "position: absolute; width: 3px; height: 100%; background: #040404; transform: rotate(45deg); top: 0px; left: 50%; margin-left: -1.5px;"; // Centered icon

    const closeIconAfter = document.createElement("div");
    closeIconAfter.setAttribute("class", "closeAfter");
    closeIconAfter.style.cssText =
      "position: absolute; width: 3px; height: 100%; background: #040404; transform: rotate(-45deg); top: 0px; left: 50%; margin-left: -1.5px;"; // Centered icon

    closeButton.appendChild(closeIconBefore);
    closeButton.appendChild(closeIconAfter);
    headerElement.appendChild(closeButton);

    // Create utility bar for print button
    const utilBar = document.createElement("div");
    utilBar.setAttribute("class", "previewBodyUtil");
    utilBar.style.cssText =
      "height: 32px; background: #474747; position: relative; padding: 0 20px;"; // Added padding
    previewBoxElement.appendChild(utilBar);

    // Create print button in utility bar
    this.previewPrintButton = document.createElement("div");
    const printButtonElement = this.previewPrintButton;
    printButtonElement.setAttribute("class", "previewBodyUtilPrintBtn");
    printButtonElement.innerHTML =
      this.settings.previewPrintBtnLabel || "Print";
    printButtonElement.style.cssText =
      "position: absolute; top: 50%; transform: translateY(-50%); padding: 2px 10px; font-size: 14px; color: white; cursor: pointer; background-color: rgba(0,0,0,.12); background-image: linear-gradient(hsla(0,0%,100%,.05),hsla(0,0%,100%,0)); background-clip: padding-box; border: 1px solid rgba(0,0,0,.35); border-color: rgba(0,0,0,.32) rgba(0,0,0,.38) rgba(0,0,0,.42); box-shadow: inset 0 1px 0 hsla(0,0%,100%,.05), inset 0 0 1px hsla(0,0%,100%,.15), 0 1px 0 hsla(0,0%,100%,.05);"; // Centered button vertically
    utilBar.appendChild(printButtonElement);

    // Create preview body
    this.previewBody = document.createElement("div");
    const previewBodyElement = this.previewBody;
    previewBodyElement.setAttribute("class", previewBodyClassName);
    // Calculate height considering header and utilBar
    previewBodyElement.style.cssText =
      "display: flex; flex-direction: column; height: calc(100% - (20px + 10px + 1px) - 32px); overflow: auto;"; // Adjusted height, added overflow
    previewBoxElement.appendChild(previewBodyElement);

    document.body.appendChild(previewBoxElement);

    return {
      closeButton: this.closeButtonElement,
      previewBody: this.previewBody,
    };
  }

  /**
   * Creates a hidden iframe element for printing or a visible one for preview.
   * @param {string} iframeId - The ID for the iframe.
   * @param {string} iframeSrc - The source URL for the iframe.
   * @returns {HTMLIFrameElement} The created iframe element.
   */
  createBaseIframe(iframeId, iframeSrc) {
    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("id", iframeId);
    iframeElement.setAttribute("src", iframeSrc);
    if (!this.settings.preview) {
      // Hidden iframe for direct printing
      iframeElement.style.border = "0px";
      iframeElement.style.position = "absolute";
      iframeElement.style.width = "0px";
      iframeElement.style.height = "0px";
      iframeElement.style.right = "0px";
      iframeElement.style.top = "0px";
    }
    return iframeElement;
  }

  /**
   * Creates and configures the main iframe for printing or previewing.
   * @param {string} iframeSrcParam - The source URL for the iframe.
   * @returns {HTMLIFrameElement} The configured iframe element.
   * @throws {Error} If iframes are not supported or the iframe document cannot be found.
   */
  createIframeElement(iframeSrcParam) {
    const iframeId = this.settings.ids;
    const iframeSrc =
      iframeSrcParam || `about:blank?timestamp=${new Date().getTime()}`; // Ensure unique src if none provided
    const self = this;
    const iframeElement = this.createBaseIframe(iframeId, iframeSrc);

    try {
      if (this.settings.preview) {
        iframeElement.style.cssText =
          "border: 0px; flex: 1; width: 100%; height: 100%;"; // Fill preview body
        const previewElements = this.createOrGetPreviewBox();
        previewElements.previewBody.appendChild(iframeElement);
        this.addEvent(previewElements.closeButton, "click", function () {
          self.hidePreviewBox();
        });
      } else {
        document.body.appendChild(iframeElement);
      }

      // Accessing contentDocument/contentWindow might fail if src is cross-origin and not loaded yet.
      // For about:blank or same-origin, this should be fine.
      if (
        !iframeElement.contentWindow ||
        !iframeElement.contentWindow.document
      ) {
        throw new Error(
          "Cannot access iframe content. If using a URL, ensure it's same-origin or iframe is loaded."
        );
      }
      // iframeElement.doc is a custom property, standard is contentDocument or contentWindow.document
      // We'll rely on contentWindow.document directly in getPrintWindow
    } catch (error) {
      console.error("Iframe creation/access error:", error);
      throw new Error(
        error + ". Iframes may not be supported or content is inaccessible."
      );
    }

    return iframeElement;
  }
}

export const VuePrintPlugin = {
  directiveName: "printv1", // Default directive name

  /**
   * Vue directive mounted hook (Vue 2 syntax).
   * For Vue 3, use `mounted` inside `createApp({...}).directive(...)` or a global directive.
   * @param {HTMLElement} el - The element the directive is bound to.
   * @param {object} binding - An object containing the directive's arguments and modifiers.
   */
  mounted(el, binding: IdString | PrintOptions) {
    // In Vue 3, `binding.instance` is not available directly in `mounted` for global directives.
    // `vnode.componentInstance` (Vue 2) or `vnode.component.proxy` (Vue 3 options API) or `getCurrentInstance` (Composition API) might be needed.
    // For simplicity, assuming `binding.instance` works or Vue instance is passed in options if needed by callbacks.
    const vueInstance = binding.instance;
    let targetElementId = "";

    const eventName = "click";
    const eventHandler = () => {
      const bindingValue = binding.value;
      let printOptionsFromBinding = {};

      if (typeof bindingValue === "string") {
        targetElementId = bindingValue;
        printOptionsFromBinding = { ids: targetElementId };
      } else if (typeof bindingValue === "object" && bindingValue !== null) {
        targetElementId = bindingValue.ids;
        printOptionsFromBinding = { ...bindingValue }; // Spread all options from binding
        if (!targetElementId) {
          console.warn(
            "VuePrintPlugin: 'id' is missing in the binding value object. Printing the whole window as a fallback or doing nothing."
          );
          // window.print(); // Or decide to do nothing / throw error
          return;
        }
        const cleanId = targetElementId.replace(new RegExp("#", "g"), "");
        if (!document.getElementById(cleanId)) {
          console.error(
            `VuePrintPlugin: Print target element with ID '${cleanId}' not found.`
          );
          return;
        }
      } else {
        console.warn(
          "VuePrintPlugin: Invalid binding value. Expected a string (element ID) or an object with options including 'id'."
        );
        // window.print(); // Fallback to print entire window if configuration is invalid
        return;
      }

      initializePrint(printOptionsFromBinding);
    };

    el.addEventListener(eventName, eventHandler, false);
    // Store the handler to remove it in `unmounted` if needed
    el._vuePrintEventHandler = eventHandler;

    const initializePrint = (optionsFromBinding) => {
      // Default options, can be overridden by optionsFromBinding
      const defaultPrintOptions = {
        standard: "html5",
        zIndex: 20002,
        previewTitle: "打印预览",
        previewPrintBtnLabel: "打印",
        preview: false,
        // Callbacks need to be wrapped to pass the Vue instance if provided in binding.value
        previewBeforeOpenCallback: optionsFromBinding.previewBeforeOpenCallback
          ? () => optionsFromBinding.previewBeforeOpenCallback(vueInstance)
          : null,
        previewOpenCallback: optionsFromBinding.previewOpenCallback
          ? () => optionsFromBinding.previewOpenCallback(vueInstance)
          : null,
        openCallback: optionsFromBinding.openCallback
          ? () => optionsFromBinding.openCallback(vueInstance)
          : null,
        closeCallback: optionsFromBinding.closeCallback
          ? () => optionsFromBinding.closeCallback(vueInstance)
          : null,
        beforeOpenCallback: optionsFromBinding.beforeOpenCallback
          ? () => optionsFromBinding.beforeOpenCallback(vueInstance)
          : null,
      };

      const printSettings = {
        ...defaultPrintOptions, // Start with defaults
        ...optionsFromBinding, // Override with options from directive binding
        vue: vueInstance, // Pass Vue instance if needed by plugin internals or callbacks
      };

      return new Promise((r) => {
        console.log(printSettings);
        printSettings?.beforePrintCallback?.();
        setTimeout(() => {
          r("");
        }, 100);
      }).then(() => {
        new PrintPlugin(printSettings);
      });
    };
  },

  /**
   * Vue directive unmounted hook (Vue 2: unbind, Vue 3: unmounted).
   * @param {HTMLElement} el - The element the directive is bound to.
   */
  unmounted(el) {
    // Vue 3 syntax. For Vue 2, this would be `unbind`.
    if (el._vuePrintEventHandler) {
      el.removeEventListener("click", el._vuePrintEventHandler, false);
      delete el._vuePrintEventHandler;
    }
  },

  /**
   * Vue plugin install function.
   * @param {object} App - The Vue application instance (Vue 3) or Vue constructor (Vue 2).
   * @param {object} [options] - Optional plugin options.
   */
  install: function (App, options) {
    // `App` is Vue constructor in Vue 2, App instance in Vue 3
    const directiveName =
      (options && options.directiveName) ||
      VuePrintPlugin.directiveName ||
      "printv1";
    // Vue 2: App.directive(directiveName, VuePrintPlugin);
    // Vue 3: App.directive(directiveName, VuePrintPlugin);
    if (typeof App.directive === "function") {
      // Check if App is Vue or an App instance with .directive
      App.directive(directiveName, VuePrintPlugin);
    } else {
      console.error(
        "VuePrintPlugin: Could not register directive. Invalid Vue instance or constructor provided."
      );
    }
  },
};
