window.clipboardFunctions = {
    copyText: async function (text) {
        if (!navigator.clipboard) {
            console.error("Clipboard API not available. Ensure you are in a secure context (HTTPS/localhost).");
            // Fallback for older browsers or insecure contexts if needed, but per specs we just need to warn
            return false;
        }
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error("Failed to copy text: ", err);
            return false;
        }
    }
};
