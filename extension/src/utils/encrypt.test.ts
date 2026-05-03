import { expect, test, describe } from 'vitest';
import { determineStrength } from './encrypt';

describe('helper functions are reasonably correct', () => {
  test('too short password is correctly flagged as insecure', () => {
    expect(determineStrength("short")).toStrictEqual(
      ["Password is too short (minimum 15 characters)."]);
  })
})