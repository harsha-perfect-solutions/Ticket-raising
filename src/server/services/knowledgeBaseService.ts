export interface KBArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  content: string;
}

export const KNOWLEDGE_BASE_ARTICLES: KBArticle[] = [
  {
    id: 'kb-pwd-reset',
    title: 'How to Reset Your Corporate Account Password',
    summary: 'Self-service instructions to reset your network and portal password without waiting for IT.',
    category: 'Account Access & Security',
    tags: ['password', 'reset', 'forgot', 'login', 'credentials', 'access', 'auth'],
    readTimeMinutes: 2,
    content: `### Self-Service Password Reset Guide

If you have forgotten your password or received an expiration notice, follow these steps:

1. **Access Identity Portal**: Navigate to the corporate self-service portal at \`https://identity.supportpro.internal\`.
2. **Verify Identity via 2FA**: Enter your corporate email address and verify with your registered authenticator app or SMS code.
3. **Select New Password**: Choose a password that satisfies our enterprise security policy:
   - Minimum 10 characters
   - At least one uppercase and one lowercase letter
   - At least one number and one special symbol (\`!@#$%^&*\`)
   - Cannot match your last 3 previous passwords
4. **Synchronize Devices**: After resetting, restart your computer and reconnect to Wi-Fi to sync your local login credentials.

*If you are completely locked out of 2FA, contact the telecaller desk or raise an Account Access ticket.*`,
  },
  {
    id: 'kb-account-locked',
    title: 'Account Locked Out: Steps to Unlock & Re-authenticate',
    summary: 'Troubleshooting repeated invalid login attempts and automatic 15-minute lockouts.',
    category: 'Account Access & Security',
    tags: ['locked', 'lockout', 'attempts', 'disabled', 'blocked', '2fa', 'security'],
    readTimeMinutes: 3,
    content: `### Resolving Account Lockouts

Accounts automatically lock for 15 minutes after 5 consecutive failed login attempts for security protection.

#### Quick Resolution Steps:
1. **Wait 15 Minutes**: In most cases, standard security locks automatically release after a 15-minute cool-down period.
2. **Check Cached Mobile Credentials**: Ensure older passwords are not saved on your mobile mail client (Outlook / iOS Mail) repeatedly failing in the background.
3. **Disconnect Stale VPN Sessions**: An open VPN connection attempting to reconnect with an old credential can trigger immediate relocking.
4. **Request Security Unlock**: If the lockout persists after 30 minutes, an Admin or Manager can instantly reset your status via the User Directory.`,
  },
  {
    id: 'kb-vpn-disconnect',
    title: 'Troubleshooting Corporate VPN Connection Failures',
    summary: 'Resolve common VPN errors, handshake timeouts, and split-tunneling disconnection issues.',
    category: 'Technical Support',
    tags: ['vpn', 'network', 'connection', 'remote', 'tunnel', 'disconnect', 'wifi', 'gateway'],
    readTimeMinutes: 3,
    content: `### VPN Troubleshooting Checklist

When experiencing VPN disconnections, timeout errors, or server unreachable alerts:

1. **Verify Local Internet**: Ensure you can access external websites before connecting to the corporate VPN.
2. **Flush DNS Cache**:
   - **Windows**: Open Command Prompt / PowerShell as Administrator and run:
     \`\`\`cmd
     ipconfig /flushdns
     ipconfig /renew
     \`\`\`
   - **macOS**: In Terminal, run:
     \`\`\`bash
     sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
     \`\`\`
3. **Change Gateway Server**: In your VPN client, switch from "Automatic / Primary" to "Secondary Gateway" (e.g., \`vpn-east.supportpro.com\` or \`vpn-west.supportpro.com\`).
4. **Disable Hotspot Throttling**: Some mobile hotspots block IPSec/IKEv2 protocols; ensure SSL/TCP mode is toggled on in the VPN client settings.`,
  },
  {
    id: 'kb-software-install',
    title: 'Self-Service Software Portal & License Installation',
    summary: 'How to install approved corporate applications without local administrator privileges.',
    category: 'Software Glitch & Bug',
    tags: ['software', 'install', 'application', 'license', 'download', 'admin', 'portal'],
    readTimeMinutes: 2,
    content: `### Installing Approved Enterprise Software

Employees can install standard workplace software without submitting an IT ticket:

1. **Open Company Portal**:
   - **Windows**: Search for "Company Portal" in the Start Menu.
   - **macOS**: Open "Self Service" from Applications.
2. **Search Catalog**: Search for the software you need (e.g., Slack, Zoom, VS Code, Docker Desktop, Microsoft 365).
3. **Click Install**: Pre-approved software will install silently in the background with approved corporate configurations.
4. **Specialized Licenses**: If the app requires a paid license (e.g. Adobe Creative Cloud, JetBrains), submit an Access Request ticket with your manager's written approval.`,
  },
  {
    id: 'kb-wifi-network',
    title: 'Connecting to Corporate Wi-Fi & Office Network Setup',
    summary: 'Configuration guidelines for SupportPro-Corp and 802.1X certificate-based networks.',
    category: 'Technical Support',
    tags: ['wifi', 'network', 'internet', 'office', 'ethernet', 'connection', 'dns', 'router'],
    readTimeMinutes: 2,
    content: `### Office Wi-Fi Setup

To connect your work laptop or mobile device to the secure corporate Wi-Fi:

1. Select **SupportPro-Corp** from your network list.
2. Set EAP Method to **PEAP** and Phase 2 Authentication to **MSCHAPv2**.
3. Under CA Certificate, select **Use System Certificates** or select the pre-installed SupportPro Root CA.
4. Enter your corporate email and current password.
5. If authentication fails, reconnect to the guest network **SupportPro-Guest** and check for pending security certificate updates in the Company Portal.`,
  },
  {
    id: 'kb-email-sync',
    title: 'Fixing Outlook & Email Syncing Issues',
    summary: 'Steps to resolve missing emails, mailbox full warnings, and Outlook disconnected status.',
    category: 'Technical Support',
    tags: ['email', 'outlook', 'mail', 'sync', 'inbox', 'exchange', 'calendar'],
    readTimeMinutes: 2,
    content: `### Resolving Outlook Email Sync Issues

1. **Check Webmail**: Visit \`https://outlook.office.com\` to verify if emails are arriving on the server. If webmail works, the issue is local to your desktop client.
2. **Toggle Offline Mode**: In Outlook, go to the **Send / Receive** tab and ensure **Work Offline** is not activated.
3. **Repair Data File**:
   - Go to **File** > **Account Settings** > **Account Settings**.
   - Select your email address and click **Repair**.
4. **Clear OST Cache**: Close Outlook, press \`Win + R\`, type \`%localappdata%\\Microsoft\\Outlook\`, and rename your \`.ost\` file to \`.ost.old\`. Reopen Outlook to re-sync a clean mailbox.`,
  },
  {
    id: 'kb-app-crash',
    title: 'Resolving Application 500 Errors & Browser Cache Corruptions',
    summary: 'Immediate fixes for HTTP 500 internal server errors, white screens, and stale session states.',
    category: 'Software Glitch & Bug',
    tags: ['crash', 'error', '500', 'glitch', 'bug', 'blank', 'freeze', 'reload'],
    readTimeMinutes: 2,
    content: `### Application Crash & Error 500 Recovery

1. **Hard Refresh Browser**: Press \`Ctrl + Shift + R\` (Windows) or \`Cmd + Shift + R\` (macOS) to force fetch fresh frontend assets without browser cache.
2. **Incognito / Private Window**: Test the application in an incognito window to verify if third-party browser extensions (ad blockers, script modifiers) are interfering.
3. **Clear Local Application Storage**:
   - Press \`F12\` to open Developer Tools.
   - Go to the **Application** tab > **Storage**.
   - Click **Clear site data**.
4. **Verify Backend Status**: Check the application health endpoint at \`/api/health\` to ensure backend microservices are operational.`,
  },
  {
    id: 'kb-hardware-peripherals',
    title: 'Laptop Hardware & Docking Station Troubleshooting',
    summary: 'Troubleshooting external monitor detection, docking station power, and USB peripherals.',
    category: 'Technical Support',
    tags: ['hardware', 'laptop', 'monitor', 'screen', 'dock', 'display', 'keyboard', 'mouse', 'usb'],
    readTimeMinutes: 3,
    content: `### Docking Station & External Display Fixes

1. **Power Cycle Dock**: Unplug the power cable from your USB-C / Thunderbolt docking station for 15 seconds, then plug it back in.
2. **Display Detection**:
   - **Windows**: Right-click desktop > **Display settings** > click **Detect**.
   - **macOS**: Open **System Settings** > **Displays** > hold \`Option\` key and click **Detect Displays**.
3. **Check Cable Seating**: Ensure the USB-C / HDMI cable is firmly seated and not connected through unauthorized splitters.
4. If the dock still fails to charge or detect monitors, submit a Hardware Issue ticket specifying your dock model and asset tag.`,
  },
  {
    id: 'kb-billing-invoices',
    title: 'How to Download Invoices & Update Billing Information',
    summary: 'Self-service account management for payment methods, receipts, and VAT tax details.',
    category: 'Billing Inquiry & Invoices',
    tags: ['billing', 'invoice', 'payment', 'charge', 'card', 'receipt', 'subscription'],
    readTimeMinutes: 2,
    content: `### Billing & Invoices Guide

Account owners and billing managers can manage invoices directly:

1. **Billing History**: Navigate to **Billing & Subscriptions** in your account settings.
2. **Download PDF Receipts**: All past tax invoices and payment receipts are available for instant PDF export with breakdown of VAT/GST charges.
3. **Update Payment Card**: Click **Payment Methods** > **Add New Card** before removing the expired card.
4. **Duplicate Charges**: If you noticed a dual charge for a single renewal, submit a Billing Inquiry ticket with the transaction reference for an automated refund verification.`,
  },
];

/**
 * Searches the Knowledge Base with token matching, keyword weighting, and optional category filtering.
 */
export function searchKnowledgeBase(query?: string, categoryName?: string): KBArticle[] {
  if (!query || query.trim().length < 2) {
    if (categoryName) {
      return KNOWLEDGE_BASE_ARTICLES.filter(
        (a) => a.category.toLowerCase().includes(categoryName.toLowerCase())
      ).slice(0, 3);
    }
    return [];
  }

  const cleanQuery = query.toLowerCase().trim();
  const tokens = cleanQuery
    .split(/[\s,._-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  const scored = KNOWLEDGE_BASE_ARTICLES.map((article) => {
    let score = 0;

    // 1. Direct title match
    if (article.title.toLowerCase().includes(cleanQuery)) {
      score += 25;
    }

    // 2. Token matches in title
    tokens.forEach((token) => {
      if (article.title.toLowerCase().includes(token)) {
        score += 10;
      }
    });

    // 3. Tag matches (high signal)
    tokens.forEach((token) => {
      if (article.tags.some((tag) => tag.toLowerCase().includes(token) || token.includes(tag.toLowerCase()))) {
        score += 8;
      }
    });

    // 4. Summary & content match
    tokens.forEach((token) => {
      if (article.summary.toLowerCase().includes(token)) {
        score += 4;
      }
      if (article.content.toLowerCase().includes(token)) {
        score += 2;
      }
    });

    // 5. Category boost
    if (categoryName && article.category.toLowerCase().includes(categoryName.toLowerCase())) {
      score += 5;
    }

    return { article, score };
  });

  return scored
    .filter((item) => item.score >= 6)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.article)
    .slice(0, 4);
}

export function getArticleById(id: string): KBArticle | null {
  return KNOWLEDGE_BASE_ARTICLES.find((a) => a.id === id) || null;
}
