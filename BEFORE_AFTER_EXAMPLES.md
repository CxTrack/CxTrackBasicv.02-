# Before/After Code Examples

This document shows actual code improvements made during the audit and recommended patterns.

---

## 1. ChatPage.tsx - Component Memoization

### Before (Potential Re-render Issues)
```tsx
{messages.map((msg) => {
  const isOwn = msg.sender_id === user?.id;
  return (
    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[70%] px-5 py-3 rounded-2xl">
        <p>{msg.content}</p>
      </div>
    </div>
  );
})}
```

### After (Optimized with React.memo)
```tsx
const MessageBubble = React.memo<{
  msg: Message;
  isOwn: boolean;
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, reactionId: string) => void;
  compact: boolean;
}>(({ msg, isOwn, onAddReaction, onRemoveReaction, compact }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
    <div className={`max-w-[70%] ${compact ? 'px-3 py-2' : 'px-5 py-3'} rounded-2xl`}>
      <p>{msg.content}</p>
      {msg.reactions && (
        <MessageReactions reactions={msg.reactions} onAddReaction={onAddReaction} />
      )}
    </div>
  </div>
));
MessageBubble.displayName = 'MessageBubble';
```

**Why:** Prevents unnecessary re-renders when parent state changes but message content hasn't.

---

## 2. Safe localStorage Access

### Before (Potential Runtime Error)
```tsx
const data = JSON.parse(localStorage.getItem('settings'));
// Crashes if 'settings' is null
```

### After (Safe Pattern)
```tsx
const data = JSON.parse(localStorage.getItem('settings') || '{}');
// Or with explicit null check:
const stored = localStorage.getItem('settings');
const data = stored ? JSON.parse(stored) : defaultSettings;
```

**Current codebase:** ✅ Already uses safe patterns throughout.

---

## 3. Error Handling Types

### Before (Using `any`)
```typescript
try {
  await supabase.from('customers').insert(data);
} catch (error: any) {
  toast.error(error.message);
}
```

### After (Type-safe)
```typescript
try {
  await supabase.from('customers').insert(data);
} catch (error: unknown) {
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
  toast.error(message);
}
```

**Why:** `any` bypasses TypeScript's type checking. `unknown` forces proper type narrowing.

---

## 4. CoPilot Button - UI Improvement

### Before (Gimmicky Float Button)
```tsx
<button
  onClick={openPanel}
  className="fixed bottom-6 right-6 z-30 p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full"
>
  <Sparkles className="w-6 h-6" />
  <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
</button>
```

### After (Sleek Side Tab)
```tsx
<button
  onClick={openPanel}
  className={`
    fixed top-1/2 right-0 z-40 
    transform -translate-y-1/2 translate-x-1 hover:translate-x-0
    py-3 px-2 pl-3 rounded-l-2xl
    backdrop-blur-md border-y border-l
    transition-all duration-300 ease-out
  `}
>
  <Sparkles className="w-4 h-4" />
</button>
```

**Why:** Less intrusive, doesn't overlap with other UI elements, cleaner aesthetic.

---

## 5. Type Definitions - From Inline to Extracted

### Before (Inline in Component)
```tsx
// In ChatPage.tsx
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
  name?: string;
  updated_at: string;
}
```

### After (Centralized in types/)
```tsx
// src/types/chat.types.ts
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  sender?: { full_name: string; avatar_url?: string; };
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// Then import where needed:
import { Message, Conversation } from '@/types/chat.types';
```

**Why:** Single source of truth, easier to update, better code organization.

---

## 6. Mock Data - From Inline to Extracted

### Before (Cluttered Component)
```tsx
// In ChatPage.tsx (70 lines of mock data)
const MOCK_USERS = [ /* ... */ ];
const MOCK_CONVERSATIONS = [ /* ... */ ];
const MOCK_MESSAGES = { /* ... */ };

export const ChatPage = () => { /* component code */ }
```

### After (Separate Data File)
```tsx
// src/data/mockChatData.ts
import { Conversation, Message, MockUser } from '@/types/chat.types';

export const MOCK_USERS: MockUser[] = [ /* ... */ ];
export const MOCK_CONVERSATIONS: Conversation[] = [ /* ... */ ];
export const MOCK_MESSAGES: Record<string, Message[]> = { /* ... */ };

// In ChatPage.tsx
import { MOCK_USERS, MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/data/mockChatData';
```

**Why:** Cleaner components, easier testing, mock data can be reused.

---

## Summary

| Pattern | Files Updated | Impact |
|---------|---------------|--------|
| React.memo | ChatPage.tsx | Performance |
| Type extraction | chat.types.ts | Maintainability |
| Mock data extraction | mockChatData.ts | Cleanliness |
| Safe localStorage | Already safe | Reliability |
| CoPilot redesign | CoPilotButton.tsx | UX |
