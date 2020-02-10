import fc from 'fast-check';

test('should not fail', () => {
  expect(fc.__version).toBe('');
});
