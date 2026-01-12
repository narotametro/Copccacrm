# Utility Functions and Hooks

This directory contains reusable utility functions, hooks, and constants to maintain code quality and consistency across the COPCCA CRM application.

## 📁 Structure

```
src/
├── hooks/           # Custom React hooks
│   ├── useForm.ts      # Form and modal state management
│   ├── useAsync.ts     # Async operations with toast notifications
│   └── index.ts        # Central export
├── lib/             # Utility functions and types
│   ├── constants.ts    # Application-wide constants
│   ├── validation.ts   # Form validation functions
│   ├── dateUtils.ts    # Date formatting and manipulation
│   ├── textFormat.ts   # Text formatting utilities
│   ├── utils.ts        # Central export
│   └── types/          # TypeScript type definitions
```

## 🎣 Custom Hooks

### `useModal<T>`
Manages modal state and form data for add/edit patterns.

```typescript
const {
  isOpen,
  formData,
  editingItem,
  openModal,
  closeModal,
  openEditModal,
  updateFormData,
  isEditing,
} = useModal<CustomerFormData>({
  name: '',
  email: '',
  phone: '',
});
```

### `useListData<T>`
Manages list data with CRUD operations.

```typescript
const {
  items,
  searchQuery,
  setSearchQuery,
  addItem,
  updateItem,
  deleteItem,
} = useListData<Customer>(initialCustomers);
```

### `useAsyncAction`
Handles async operations with automatic loading states and toast notifications.

```typescript
const { execute, isLoading } = useAsyncAction();

await execute(
  () => createCustomer(formData),
  {
    successMessage: 'Customer created successfully',
    errorMessage: 'Failed to create customer',
    onSuccess: (customer) => navigate(`/customers/${customer.id}`),
  }
);
```

## 🛠️ Utility Functions

### Constants (`constants.ts`)
- **ROLES**: User role constants (admin, manager, user)
- **STATUS**: Entity status values
- **DEAL_STAGES**: Sales pipeline stages
- **VALIDATION**: Validation rules (password length, file size, regex patterns)
- **TOAST_MESSAGES**: Standardized toast notification messages
- **FEATURES**: Feature flags for gradual rollout

### Validation (`validation.ts`)
- `isValidEmail(email)`: Email format validation
- `isValidPassword(password)`: Password strength validation with detailed errors
- `isValidPhone(phone)`: Phone number format validation
- `isValidURL(url)`: URL format validation
- `validateForm<T>(data, rules)`: Generic form validation with configurable rules

```typescript
const { isValid, errors } = validateForm(formData, {
  email: { required: true, pattern: VALIDATION.EMAIL_REGEX },
  password: { required: true, minLength: 8 },
  name: { required: true, minLength: 2, maxLength: 100 },
});
```

### Date Utilities (`dateUtils.ts`)
- `formatDate(date, format)`: Format dates to readable strings
- `formatTime(date)`: Format time to 12-hour format
- `formatDateTime(date)`: Combined date and time formatting
- `getRelativeTime(date)`: Relative time strings ("2 hours ago")
- `isToday(date)`, `isPast(date)`, `isFuture(date)`: Date comparison utilities
- `addDays(date, days)`: Date manipulation
- `daysBetween(date1, date2)`: Calculate difference between dates

### Text Formatting (`textFormat.ts`)
- `formatName(name)`: Consistent name formatting (Title Case)
- `formatRole(role)`: Role display formatting
- `formatEmail(email)`: Email normalization (lowercase)
- `toTitleCase(text)`: Convert text to Title Case

## 📋 Usage Examples

### Form with Modal and Async Operations

```typescript
import { useModal, useAsyncAction } from '@/hooks';
import { validateForm, VALIDATION } from '@/lib/utils';

function CustomerForm() {
  const { isOpen, formData, updateFormData, closeModal } = useModal({
    name: '',
    email: '',
    phone: '',
  });
  
  const { execute, isLoading } = useAsyncAction();

  const handleSubmit = async () => {
    const { isValid, errors } = validateForm(formData, {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: VALIDATION.EMAIL_REGEX },
    });

    if (!isValid) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    await execute(
      () => createCustomer(formData),
      {
        successMessage: 'Customer created',
        onSuccess: closeModal,
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <Input
        value={formData.name}
        onChange={(e) => updateFormData('name', e.target.value)}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Customer'}
      </Button>
    </Modal>
  );
}
```

### List Management with Search

```typescript
import { useListData } from '@/hooks';
import { formatDate, getRelativeTime } from '@/lib/utils';

function TaskList() {
  const { items, searchQuery, setSearchQuery, deleteItem } = useListData<Task>(tasks);

  const filteredTasks = items.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
      />
      {filteredTasks.map(task => (
        <div key={task.id}>
          <h3>{task.title}</h3>
          <p>{formatDate(task.dueDate, 'medium')}</p>
          <small>{getRelativeTime(task.createdAt)}</small>
          <Button onClick={() => deleteItem(task.id)}>Delete</Button>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Best Practices

1. **Use constants instead of magic strings**: Import from `constants.ts`
2. **Validate forms consistently**: Use `validateForm()` for all form validation
3. **Centralize async operations**: Use `useAsyncAction` for API calls
4. **Format dates consistently**: Use `dateUtils` functions instead of manual formatting
5. **Type safety**: All utilities are fully typed with TypeScript
6. **DRY principle**: Reuse hooks and utilities instead of duplicating logic

## 🔄 Migration Guide

### Before (Old Pattern)
```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '' });
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await createCustomer(formData);
    toast.success('Created');
    setIsOpen(false);
  } catch (error) {
    toast.error('Failed');
  } finally {
    setLoading(false);
  }
};
```

### After (New Pattern)
```typescript
const { isOpen, formData, updateFormData, closeModal } = useModal({ name: '' });
const { execute, isLoading } = useAsyncAction();

const handleSubmit = () => execute(
  () => createCustomer(formData),
  { successMessage: 'Created', onSuccess: closeModal }
);
```

## 📚 Additional Resources

- See [CONTRIBUTING.md](../../CONTRIBUTING.md) for code standards
- Check individual files for detailed JSDoc documentation
- All utilities are tree-shakeable for optimal bundle size
