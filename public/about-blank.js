/**
 * About:Blank Launcher - A general-purpose script to launch content in an about:blank popup
 * Provides stealth browsing by hiding content inside an about:blank page
 * 
 * Usage: Include this script in your HTML page and it will automatically launch in about:blank
 * Configure options by setting window.aboutBlankConfig before including this script
 */

(function() {
  'use strict';

  // Default configuration - can be overridden by setting window.aboutBlankConfig
  const defaultConfig = {
    enabled: true,                    // Whether to enable about:blank cloaking
    skipFirefox: true,               // Skip Firefox due to popup restrictions
    skipIframes: true,               // Skip if already in an iframe
    
    // Disguise settings for the popup window
    disguise: {
      title: "My Drive - Google Drive",
      favicon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png"
    },
    
    // Redirect settings for original tab
    redirect: {
      enabled: true,
      urls: [
        "https://classroom.google.com",
        "https://drive.google.com", 
        "https://google.com",
        "https://docs.google.com",
        "https://slides.google.com",
        "https://kahoot.it",
        "https://clever.com",
        "https://khanacademy.org",
        "https://wikipedia.org"
      ]
    },
    
    // Additional popup protection
    protection: {
      exitConfirmation: true,
      confirmationMessage: "Leave Site?"
    }
  };

  // Merge user configuration with defaults
  const config = Object.assign({}, defaultConfig, window.aboutBlankConfig || {});
  config.disguise = Object.assign({}, defaultConfig.disguise, (window.aboutBlankConfig && window.aboutBlankConfig.disguise) || {});
  config.redirect = Object.assign({}, defaultConfig.redirect, (window.aboutBlankConfig && window.aboutBlankConfig.redirect) || {});
  config.protection = Object.assign({}, defaultConfig.protection, (window.aboutBlankConfig && window.aboutBlankConfig.protection) || {});

  /**
   * Check if we're running inside an iframe
   */
  function isInFrame() {
    try {
      return window !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Check if browser is Firefox
   */
  function isFirefox() {
    return navigator.userAgent.includes("Firefox");
  }

  /**
   * Get a random redirect URL
   */
  function getRandomRedirectUrl() {
    const urls = config.redirect.urls;
    return urls[Math.floor(Math.random() * urls.length)];
  }

  /**
   * Create and configure the iframe inside the popup
   */
  function setupIframe(doc, currentUrl) {
    const iframe = doc.createElement("iframe");
    const style = iframe.style;

    // Make iframe fill the entire popup window
    style.position = "fixed";
    style.top = "0";
    style.bottom = "0";
    style.left = "0";
    style.right = "0";
    style.border = "none";
    style.outline = "none";
    style.width = "100%";
    style.height = "100%";
    style.margin = "0";
    style.padding = "0";

    // Load the current page in the iframe
    iframe.src = currentUrl;
    
    return iframe;
  }

  /**
   * Setup the disguise (title and favicon) for the popup
   */
  function setupDisguise(doc) {
    // Set title
    doc.title = config.disguise.title;

    // Set favicon
    if (config.disguise.favicon) {
      const link = doc.createElement("link");
      link.rel = "icon";
      link.href = config.disguise.favicon;
      doc.head.appendChild(link);
    }
  }

  /**
   * Add exit protection to the popup
   */
  function addExitProtection(doc) {
    if (!config.protection.exitConfirmation) return;

    const script = doc.createElement("script");
    script.textContent = `
      window.onbeforeunload = function (event) {
        const confirmationMessage = '${config.protection.confirmationMessage}';
        (event || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
      };
    `;
    doc.head.appendChild(script);
  }

  /**
   * Main function to launch content in about:blank
   */
  function launchInAboutBlank() {
    // Check if feature is enabled
    if (!config.enabled) {
      console.log("About:blank launcher is disabled");
      return;
    }

    // Skip if in iframe and configured to do so
    if (config.skipIframes && isInFrame()) {
      console.log("Skipping about:blank launch - already in iframe");
      return;
    }

    // Skip Firefox if configured to do so
    if (config.skipFirefox && isFirefox()) {
      console.log("Skipping about:blank launch - Firefox detected");
      return;
    }

    const currentUrl = window.location.href;

    try {
      // Open about:blank popup
      const popup = window.open("about:blank", "_blank");
      
      if (!popup || popup.closed) {
        alert("Please allow popups to use about:blank mode. The page will load normally in about:blank and prevents it from going in your history. Also, no extensions will be able to see the content.");
        return;
      }

      const doc = popup.document;

      // Setup the popup
      setupDisguise(doc);
      const iframe = setupIframe(doc, currentUrl);
      addExitProtection(doc);

      // Add iframe to popup
      doc.body.style.margin = "0";
      doc.body.style.padding = "0";
      doc.body.appendChild(iframe);

      // Close or redirect original tab if enabled
      if (config.redirect.enabled) {
        // Try to close the original tab first
        window.close();
        
        // If closing fails (e.g., tab wasn't opened by script), redirect to new tab page as fallback
        setTimeout(() => {
          if (!window.closed) {
            console.log("Could not close tab, redirecting to new tab page");
            // Try browser-specific new tab pages, fallback to about:blank
            try {
              window.location.replace("chrome://newtab/");
            } catch (e) {
              try {
                window.location.replace("about:newtab");
              } catch (e2) {
                window.location.replace("about:blank");
              }
            }
          }
        }, 100);
      }

    } catch (error) {
      console.error("Failed to launch about:blank popup:", error);
      alert("Failed to open stealth mode. The page will load normally.");
    }
  }

  /**
   * Public API
   */
  window.AboutBlankLauncher = {
    launch: launchInAboutBlank,
    config: config,
    
    // Utility functions
    setConfig: function(newConfig) {
      Object.assign(config, newConfig);
    },
    
    enable: function() {
      config.enabled = true;
    },
    
    disable: function() {
      config.enabled = false;
    },
    
    isSupported: function() {
      return !isInFrame() && (!config.skipFirefox || !isFirefox());
    }
  };

  // Auto-launch when script loads (can be disabled by setting config.enabled = false)
  if (config.enabled) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', launchInAboutBlank);
    } else {
      // DOM is already ready
      setTimeout(launchInAboutBlank, 100);
    }
  }

})();
