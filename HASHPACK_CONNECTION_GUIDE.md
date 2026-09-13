# HashPack Connection Guide

This guide explains the HashPack wallet connection issue and provides workarounds.

## The Issue

When clicking "Connect HashPack" on desktop browsers, you see a modal with three options:
- 📱 Mobile
- 💻 Webapp  
- 🌐 Browser

If you click the "Open" button, it tries to launch the HashPack mobile app via deep link, but this fails on desktop because:
1. The mobile app isn't installed on your computer
2. The deep link only works on mobile devices with HashPack installed

This results in the spinning loader with "Continue in HashPack" that never completes.

## Recommended Solutions

### Solution 1: Use the Browser Extension (Easiest)

1. **Install HashPack Browser Extension**
   - Chrome/Brave: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/hashpack/
   - Edge: https://microsoftedge.microsoft.com/addons/detail/hashpack/

2. **Click "Browser" tab** in the connection modal
   - This will use the extension instead of trying to launch the mobile app
   - The extension will prompt you to approve the connection
   - Much faster and more reliable on desktop

3. **Allow the connection** in the HashPack extension popup

### Solution 2: Use Mobile Browser (For Mobile Users)

If you're on a mobile device:

1. **Install HashPack Mobile App**
   - iOS: https://apps.apple.com/app/hashpack/id1528751703
   - Android: https://play.google.com/store/apps/details?id=com.hashpack.mobile

2. **Open the dApp in your mobile browser** (Safari, Chrome, etc.)

3. **Click "Connect HashPack"** and select the "Mobile" tab

4. **Click "Open"** - this time it will correctly launch the HashPack app

5. **Approve the connection** in the HashPack app

6. You'll be redirected back to the browser with the wallet connected

### Solution 3: Use WalletConnect QR Code (Alternative)

If the above methods don't work:

1. Open HashPack mobile app
2. Go to "WalletConnect" in the app
3. Scan the QR code from the connection modal (if provided)
4. Approve the connection in the app

## Why This Happens

The Reown AppKit (formerly WalletConnect) tries to provide a universal connection flow that works on both desktop and mobile. However:

- **Desktop users** should use the Browser Extension (not the mobile app deep link)
- **Mobile users** should use the Mobile App (the deep link works there)
- The modal doesn't auto-detect which method to show first

This is a known UX issue with wallet connection modals across the Web3 ecosystem.

## Developer Notes

The current implementation uses `@reown/appkit-adapter-hedera` with the following configuration:

```typescript
const metadata = {
  name: "EdGraph",
  description: "Coverage operations on Hedera",
  url: origin,
  icons: [`${origin}/logo.png`],
};

const modal = createAppKit({
  adapters: [hederaAdapter],
  networks: hederaNetworks,
  metadata,
  projectId,
  features: {
    analytics: false,
  },
});
```

### Potential Improvements

To improve the UX, we could:

1. **Detect platform** and show the appropriate tab first:
   ```typescript
   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
   // Show "Mobile" tab first on mobile, "Browser" tab first on desktop
   ```

2. **Add helper text** above the connection modal:
   - "Desktop users: Click the 'Browser' tab and use the HashPack extension"
   - "Mobile users: Click the 'Mobile' tab and open in the HashPack app"

3. **Auto-hide tabs** based on platform:
   - On desktop: Hide or disable the "Mobile" tab
   - On mobile: Hide or disable the "Browser" tab (if extension not detected)

However, these changes would require modifying the `@reown/appkit` modal, which is a third-party component.

## Quick Reference

| Your Device | Best Method | Tab to Click |
|-------------|-------------|--------------|
| Desktop (Mac/Windows/Linux) | Browser Extension | 🌐 Browser |
| iPhone/iPad | Mobile App | 📱 Mobile |
| Android Phone/Tablet | Mobile App | 📱 Mobile |
| Desktop without Extension | Install Extension First | 🌐 Browser |

## Common Errors

### "Failed to open HashPack"
- **Cause**: HashPack app not installed on mobile device
- **Fix**: Install the HashPack mobile app first

### Spinning loader that never completes
- **Cause**: Clicked "Mobile" tab on desktop or "Open" button without the app
- **Fix**: Close the modal, click "Browser" tab instead, use the extension

### "Extension not found"
- **Cause**: HashPack browser extension not installed
- **Fix**: Install the extension from the Chrome/Firefox/Edge store

### Connection approved but wallet still shows "disconnected"
- **Cause**: Network mismatch or page needs refresh
- **Fix**: Refresh the page and reconnect, ensure you're on Hedera testnet

## Support Links

- **HashPack Website**: https://www.hashpack.app/
- **HashPack Docs**: https://docs.hashpack.app/
- **Reown AppKit Docs**: https://docs.reown.com/appkit/overview
- **GitHub Issues**: Report issues at your project's GitHub repository

---

**TL;DR**: On desktop, click the **"Browser" tab** and use the HashPack browser extension. Don't click "Open" on the "Mobile" tab unless you're on a mobile device with the HashPack app installed.
