import { configureNunjucks } from '../../src/nunjucks.js';
import { beforeAll, jest}  from '@jest/globals'

describe('Nunjucks Custom Filters', () => {
  let env;

  beforeAll(() => {
    const mockExpressApp = {
      set: jest.fn()
    };
    env = configureNunjucks(mockExpressApp);
    expect(env).toBeDefined();
  });

  describe('back link text on the training provider trainee page', () => {
    const renderBackText = (returnParam) => env.renderString(
      '{{ "Back" if query.return | isLocalUrl else "Back to provider" }}',
      { query: { return: returnParam } }
    )

    it('uses "Back" when the return URL is local', () => {
      expect(renderBackText('/trainee-retention-review')).toBe('Back')
    })

    it.each([
      [undefined],
      ['https://evil.example'],
      ['//evil.example']
    ])('falls back to the provider text when the return URL is %p', (returnParam) => {
      expect(renderBackText(returnParam)).toBe('Back to provider')
    })
  })

  describe('currencyUK filter', () => {
    let currencyUK;

    beforeAll(() => {
      currencyUK = env.getFilter('currencyUK');
    })

    it('should format standard numbers to GBP', () => {
      expect(currencyUK(1234.5)).toMatch(/£1,234\.50/);
    })

    it('should format negative numbers to GBP', () => {
      expect(currencyUK(-1234.5)).toMatch(/-£1,234\.50/);
    })

    it('should handle zero correctly', () => {
      expect(currencyUK(0)).toMatch(/£0\.00/);
    })

    it('should ignore empty strings and nulls gracefully', () => {
      expect(currencyUK(null)).toMatch(/£0\.00/);
      expect(currencyUK('')).toMatch(/£0\.00/);
    })
  })
});
