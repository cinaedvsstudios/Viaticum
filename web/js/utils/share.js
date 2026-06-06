export async function shareText(title, text) { if (navigator.share) return navigator.share({ title, text }); await navigator.clipboard?.writeText(text); alert('Copied to clipboard'); }
