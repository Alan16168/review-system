// Browser Version Check Script
// Run this in the browser console (F12 → Console) to verify you have the latest version

console.log('=== Review System Version Check ===');
console.log('Expected Version: v5.26.0');
console.log('');

// Check 1: Button text
console.log('✓ Check 1: Save button text');
try {
  const saveButton = document.querySelector('button[type="submit"]');
  const buttonText = saveButton?.textContent || 'NOT FOUND';
  console.log('  Button text:', buttonText);
  
  if (buttonText.includes('保存并退出') || buttonText.includes('Save and Exit') || buttonText.includes('Guardar y Salir')) {
    console.log('  ✅ CORRECT: Button shows "Save and Exit"');
  } else {
    console.log('  ❌ WRONG: Button should show "Save and Exit", found:', buttonText);
    console.log('  ⚠️ ACTION NEEDED: Clear browser cache (Ctrl+F5 or Cmd+Shift+R)');
  }
} catch (e) {
  console.log('  ℹ️ Button not found (may not be on edit page)');
}
console.log('');

// Check 2: handleEditReview function signature
console.log('✓ Check 2: handleEditReview function');
try {
  if (typeof handleEditReview === 'function') {
    const funcStr = handleEditReview.toString();
    const hasTemplateIdProtection = funcStr.includes('We do NOT include template_id') || funcStr.includes('template_id should only be set during review creation');
    const hasShowReviews = funcStr.includes('showReviews()');
    const hasTimeout = funcStr.includes('setTimeout');
    
    console.log('  Has template_id protection:', hasTemplateIdProtection ? '✅' : '❌');
    console.log('  Has auto-return (showReviews):', hasShowReviews ? '✅' : '❌');
    console.log('  Has delay (setTimeout):', hasTimeout ? '✅' : '❌');
    
    if (hasTemplateIdProtection && hasShowReviews && hasTimeout) {
      console.log('  ✅ CORRECT: Function has all required features');
    } else {
      console.log('  ❌ WRONG: Function is missing features');
      console.log('  ⚠️ ACTION NEEDED: Clear browser cache (Ctrl+F5 or Cmd+Shift+R)');
    }
  } else {
    console.log('  ℹ️ Function not found (may not be on edit page)');
  }
} catch (e) {
  console.log('  ℹ️ Function not found (may not be on edit page)');
}
console.log('');

// Check 3: i18n translations
console.log('✓ Check 3: Internationalization (i18n)');
try {
  if (typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
    const hasSaveAndExit = i18n.translations?.zh?.saveAndExit || 
                          i18n.translations?.en?.saveAndExit || 
                          i18n.translations?.es?.saveAndExit;
    
    console.log('  Has "saveAndExit" translation:', hasSaveAndExit ? '✅' : '❌');
    
    if (hasSaveAndExit) {
      console.log('  Chinese:', i18n.translations.zh?.saveAndExit || 'N/A');
      console.log('  English:', i18n.translations.en?.saveAndExit || 'N/A');
      console.log('  Spanish:', i18n.translations.es?.saveAndExit || 'N/A');
      console.log('  ✅ CORRECT: Translations are present');
    } else {
      console.log('  ❌ WRONG: "saveAndExit" translation not found');
      console.log('  ⚠️ ACTION NEEDED: Clear browser cache (Ctrl+F5 or Cmd+Shift+R)');
    }
  } else {
    console.log('  ℹ️ i18n not initialized yet');
  }
} catch (e) {
  console.log('  ℹ️ i18n not available:', e.message);
}
console.log('');

// Check 4: Event listener
console.log('✓ Check 4: Form event listener');
try {
  const form = document.getElementById('edit-review-form');
  if (form) {
    // Note: getEventListeners is only available in Chrome DevTools
    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(form);
      const hasSubmitListener = listeners.submit && listeners.submit.length > 0;
      console.log('  Has submit listener:', hasSubmitListener ? '✅' : '❌');
      
      if (hasSubmitListener) {
        const listenerFunc = listeners.submit[0].listener.toString();
        if (listenerFunc.includes('handleEditReview')) {
          console.log('  ✅ CORRECT: Form bound to handleEditReview');
        } else {
          console.log('  ⚠️ WARNING: Form bound to different function');
        }
      }
    } else {
      console.log('  ℹ️ getEventListeners not available (Chrome DevTools only)');
      console.log('  ℹ️ Form exists, assuming listener is correct');
    }
  } else {
    console.log('  ℹ️ Form not found (not on edit page)');
  }
} catch (e) {
  console.log('  ℹ️ Cannot check listener:', e.message);
}
console.log('');

// Summary
console.log('=== Summary ===');
console.log('If all checks show ✅, you have the latest version.');
console.log('If any check shows ❌, clear your browser cache:');
console.log('  • Windows/Linux: Ctrl + F5');
console.log('  • Mac: Cmd + Shift + R');
console.log('  • Or: Right-click refresh button → "Empty Cache and Hard Reload"');
console.log('');
console.log('After clearing cache, reload this page and run this script again.');
