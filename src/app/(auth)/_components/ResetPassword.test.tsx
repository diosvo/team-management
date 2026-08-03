import ResetPassword from './ResetPassword';

describe('ResetPassword', () => {
  const mockProps = {
    name: 'John Doe',
    url: 'https://example.com/reset-password?token=abc123',
  };

  test('returns a string', () => {
    const result = ResetPassword(mockProps);

    expect(typeof result).toBe('string');
  });

  test('includes the user name in the greeting', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain(`Hi <strong>${mockProps.name}</strong>`);
  });

  test('includes the reset password URL in the button', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain(`href="${mockProps.url}"`);
  });

  test('includes the call-to-action button text', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain('Create new password');
  });

  test('includes the instruction text', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain(
      'Click the button below to create a new password. If you did not request this, you can ignore this email.',
    );
  });

  test('includes the link expiry notice', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain('This link will be valid for 1 hour.');
  });

  test('wraps content with EmailLayout structure', () => {
    const result = ResetPassword(mockProps);

    // Should contain EmailLayout wrapper elements
    expect(result).toContain('max-width: 560px');
    expect(result).toContain('Saigon Rovers Basketball Club');
  });

  test('renders button with correct styles', () => {
    const result = ResetPassword(mockProps);

    expect(result).toContain('background-color: #8c271e');
    expect(result).toContain('color: white');
  });

  test('handles special characters in name', () => {
    const result = ResetPassword({
      name: "O'Connor & Smith",
      url: mockProps.url,
    });

    expect(result).toContain("O'Connor & Smith");
  });

  test('handles URLs with query parameters', () => {
    const urlWithParams =
      'https://example.com/reset?token=xyz&userId=123&expires=2024-12-31';
    const result = ResetPassword({
      name: mockProps.name,
      url: urlWithParams,
    });

    expect(result).toContain(`href="${urlWithParams}"`);
  });
});
