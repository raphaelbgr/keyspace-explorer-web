/**
 * Utility function to copy text to clipboard with fallback methods
 * Handles cases where navigator.clipboard is not available (HTTP, older browsers, etc.)
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Method 1: Try modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Method 2: Fallback to execCommand (deprecated but widely supported)
    if (document.execCommand) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
    
    // Method 3: Last resort - try selection API
    if (window.getSelection) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textArea);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      textArea.setSelectionRange(0, 99999);
      const result = document.execCommand('copy');
      
      document.body.removeChild(textArea);
      return result;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Hook for copying text with user feedback
 */
export const useCopyToClipboard = () => {
  const copy = async (text: string): Promise<{ success: boolean; message: string }> => {
    const success = await copyToClipboard(text);
    
    if (success) {
      return { success: true, message: 'Copied to clipboard!' };
    } else {
      return { 
        success: false, 
        message: 'Failed to copy. Please select and copy manually.' 
      };
    }
  };
  
  return { copy };
}; 