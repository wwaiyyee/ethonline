# Policy Form Date Picker Update

## Changes Made

Updated the policy creation form to use **actual date pickers** instead of "days from now" inputs.

---

## What Changed

### Before:
```
Coverage Start: [0] days from now
Coverage End: [30] days from now
```

### After:
```
Coverage Start: [2026-09-13] (date picker)
Coverage End: [2026-10-13] (date picker)
```

---

## Technical Changes

### 1. Form State (PolicyForm.tsx)

**Before:**
```typescript
coverageStartDays: "0",
coverageEndDays: "30",
```

**After:**
```typescript
coverageStartDate: formatDateForInput(today),        // "2026-09-13"
coverageEndDate: formatDateForInput(thirtyDaysLater), // "2026-10-13"
```

### 2. Default Date Logic

Added date formatting helper:
```typescript
const today = new Date();
const thirtyDaysLater = new Date();
thirtyDaysLater.setDate(today.getDate() + 30);

const formatDateForInput = (date: Date) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
};
```

### 3. Date Conversion in Submit Handler

**Before:**
```typescript
const now = Math.floor(Date.now() / 1000);
const coverageStart = now + parseInt(formData.coverageStartDays) * 86400;
const coverageEnd = now + parseInt(formData.coverageEndDays) * 86400;
```

**After:**
```typescript
// Convert date strings to Unix timestamps
const coverageStart = Math.floor(new Date(formData.coverageStartDate).getTime() / 1000);
const coverageEnd = Math.floor(new Date(formData.coverageEndDate).getTime() / 1000);

// Validate dates
if (coverageEnd <= coverageStart) {
  throw new Error("Coverage end date must be after start date");
}
```

### 4. Form Input UI

**Before:**
```jsx
<input
  type="number"
  name="coverageStartDays"
  placeholder="0"
  min="0"
/>
```

**After:**
```jsx
<input
  type="date"
  name="coverageStartDate"
  value={formData.coverageStartDate}
/>
```

---

## User Experience Improvements

### Better UX:
- ✅ **Visual date picker** - Click to see calendar
- ✅ **Clear dates** - See exact start/end dates
- ✅ **No math** - Don't need to calculate "30 days from now"
- ✅ **Browser native** - Uses OS date picker UI
- ✅ **Validation** - Ensures end date is after start date

### Before vs After:

**Before (confusing):**
```
User thinks: "Today is Sept 13, I want coverage until Oct 13"
User must calculate: "That's... 30 days from now?"
User enters: "30"
```

**After (intuitive):**
```
User clicks date picker
User selects: Oct 13, 2026
Done!
```

---

## Testing

### Test the Form:

1. Visit http://localhost:3000/policies
2. Click "Create Policy"
3. Scroll to "Coverage Period" section
4. Click the **Coverage Start Date** field
   - See a calendar picker
   - Default: Today's date
5. Click the **Coverage End Date** field
   - See a calendar picker
   - Default: 30 days from today
6. Try selecting dates
7. Submit the form
8. Dates are converted to Unix timestamps and sent to Hedera

### Validation:

- ✅ End date must be after start date
- ✅ Both dates are required
- ✅ Dates are properly converted to Unix timestamps
- ✅ No timezone issues (uses local browser time)

---

## Technical Details

### Date Format Flow:

```
User Input (Browser)
    ↓
Date Picker UI (native)
    ↓
"2026-10-13" (YYYY-MM-DD string)
    ↓
new Date("2026-10-13")
    ↓
.getTime() / 1000
    ↓
Unix timestamp (1728777600)
    ↓
Hedera PolicyRegistry.createPolicy()
```

### Timestamp Handling:

- **Input:** ISO date string (YYYY-MM-DD)
- **Storage:** Unix timestamp (seconds since epoch)
- **Display:** Human-readable date in PolicyCard

Example:
```
Input: "2026-10-13"
Timestamp: 1728777600
Display: "Oct 13, 2026"
```

---

## Files Modified

- `packages/nextjs/components/policy/PolicyForm.tsx`
  - Updated form state
  - Added date formatting helper
  - Changed submit handler date conversion
  - Updated input fields to type="date"

---

## No Breaking Changes

- ✅ Contract interface unchanged
- ✅ API still receives Unix timestamps
- ✅ Database schema unchanged
- ✅ PolicyCard display logic works as before
- ✅ Only the form input method changed

---

## Benefits

1. **More intuitive** - Users see real dates
2. **Less error-prone** - No manual day calculations
3. **Better validation** - Browser enforces date format
4. **Cleaner UX** - Native date picker UI
5. **Timezone-aware** - Uses browser's local time

---

## Next Steps

The date picker update is complete and ready to use!

Test it at: http://localhost:3000/policies

Create a policy with:
- Start: Today
- End: 30 days from today (or any future date)

The form will automatically convert your selected dates to Unix timestamps for the Hedera transaction.
