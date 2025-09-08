# Webhook Fixes Needed

## Issue 1: Auto-replies going to separate "AI Assistant" chat

**Problem:** Auto-replies are being saved with `from: 'system'` and `contactName: 'AI Assistant'`, creating a separate chat.

**Fix:** Change the auto-reply data to be associated with the original user:

```typescript
// Current (WRONG):
const autoReplyData = {
  id: `auto_${Date.now()}`,
  text: responseMessage,
  timestamp: new Date(),
  from: 'system',  // ❌ This creates separate chat
  contactName: 'AI Assistant',  // ❌ This creates separate chat
  type: 'text',
  direction: 'outbound' as const,
  phoneNumberId: phoneNumberId,
  originalMessage: messageBody
};

// Fixed (CORRECT):
const autoReplyData = {
  id: `auto_${Date.now()}`,
  text: responseMessage,
  timestamp: new Date(),
  from: waId,  // ✅ Associate with original user
  contactName: `Bot Reply to ${contactName}`,  // ✅ Show it's a bot reply
  type: 'text',
  direction: 'outbound' as const,
  phoneNumberId: phoneNumberId,
  originalMessage: messageBody
};
```

## Issue 2: Contact name fallback issue

**Problem:** When `message.profile?.name` is not available, it falls back to `User ${waId}`.

**Fix:** Try to get the contact name from the contacts array in the webhook payload:

```typescript
// Current:
const contactName = message.profile?.name || `User ${waId}`;

// Fixed:
let contactName = message.profile?.name;
if (!contactName && value.contacts && value.contacts.length > 0) {
  const contact = value.contacts.find(c => c.wa_id === waId);
  contactName = contact?.profile?.name || `User ${waId}`;
} else {
  contactName = contactName || `User ${waId}`;
}
```

## Issue 3: Input text color

**Problem:** Input text color is not visible.

**Fix:** Add proper CSS styling to the input field in the chats page.

## Files to modify:
1. `/src/app/api/webhook/route.ts` - Fix auto-reply association and contact name
2. `/src/app/chats/page.tsx` - Fix input text color and timestamp parsing
