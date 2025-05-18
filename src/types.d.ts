export type IdString = `#{string}`

export interface PrintOptions {
  /**
   * The ID of the HTML element to print.
   */
  ids: IdString;
  /**
   * The override styles, used when printing the HTML element.
   */
  styleString?: string;
  /**
   * The HTML standard to use ('strict', 'loose', 'html5').
   */
  standard?: 'strict' | 'loose' | 'html5';
  /**
   * URL to load in the iframe for printing.
   */
  url?: string;
  /**
   * Function to asynchronously load content for printing.
   * Takes a callback function and the Vue instance as arguments.
   */
  asyncUrl?: (callback: (content: string | void) => void, vueInstance: any) => void;
  /**
   * Whether to show a print preview.
   */
  preview?: boolean;
  /**
   * Title for the print window or preview.
   */
  popTitle?: string;
  /**
   * Extra HTML content to add to the <head> of the print document.
   */
  extraHead?: string;
  /**
   * Comma-separated list of CSS file URLs to include.
   */
  extraCss?: string;
  /**
   * z-index for the preview box.
   */
  zIndex?: number;
  /**
   * Title for the preview box header.
   */
  previewTitle?: string;
  /**
   * Label for the print button in the preview box.
   */
  previewPrintBtnLabel?: string;
  /**
   * Callback before the preview is opened.
   */
  previewBeforeOpenCallback?: () => void;
  /**
   * Callback after the preview is opened.
   */
  previewOpenCallback?: () => void;
  /**
   * Callback after the print dialog is opened.
   */
  openCallback?: () => void;
  /**
   * Callback after the print dialog is closed.
   */
  closeCallback?: () => void;
  /**
   * Callback before the print dialog is opened (for non-preview).
   */
  beforeOpenCallback?: () => void;
  /**
   * run when click trigger 
   * can remove some dom on this function
   */
  beforePrintCallback?: () => void;
  /**
   * Vue instance, if used within a Vue environment.
   */
  vue?: any; // Use a more specific Vue instance type if available in your project
}