# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing with React Testing Library for component testing.

## Setup

Tests are configured in `vitest.config.ts` and use:
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **jsdom** - Browser environment simulation
- **@testing-library/jest-dom** - Custom DOM matchers

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage (requires @vitest/coverage)
npm run test:coverage
```

## Test Structure

Tests are organized alongside source files using the `__tests__` directory pattern:

```
src/
  lib/
    __tests__/
      aiAnalysis.test.ts
      supabaseBrowser.test.ts
  store/
    __tests__/
      useAlbumStore.test.ts
      useAlbumStore.fetchPhotos.test.ts
      useAlbumStore.generateAlbum.test.ts
```

## Test Coverage

### AI Analysis (`src/lib/__tests__/aiAnalysis.test.ts`)
- ✅ Singleton pattern
- ✅ Photo analysis API calls
- ✅ Batch photo analysis
- ✅ Album curation algorithms (best-shots, chronological, color-story, artistic-flow)
- ✅ Album title generation
- ✅ Album description generation

### Album Store (`src/store/__tests__/`)
- ✅ Initial state
- ✅ Photo management (add, remove, update, reorder)
- ✅ Photo selection (toggle, select all, clear)
- ✅ Upload progress tracking
- ✅ UI state management
- ✅ Album generation with different algorithms
- ✅ Photo fetching from API
- ✅ Error handling

### Supabase Client (`src/lib/__tests__/supabaseBrowser.test.ts`)
- ✅ Client initialization
- ✅ Singleton pattern

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { functionToTest } from '../module'

describe('ModuleName', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = functionToTest(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Mocking

The test setup includes:
- `URL.createObjectURL` mock for File handling
- `fetch` global mock for API calls
- React Testing Library cleanup

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Mock API calls, file system, etc.
5. **Test Edge Cases**: Include error cases and boundary conditions

## CI/CD Integration

Tests should run automatically in CI/CD pipelines. Add to your workflow:

```yaml
- name: Run tests
  run: npm test
```

## Future Test Additions

Consider adding:
- Component tests for React components
- Integration tests for API routes
- E2E tests with Playwright or Cypress
- Visual regression tests

