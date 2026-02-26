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
