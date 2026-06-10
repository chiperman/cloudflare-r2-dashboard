export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const errorData = await response.json();
    if (typeof errorData?.error === 'string' && errorData.error.length > 0) {
      return errorData.error;
    }
  } catch {
    // Ignore JSON parsing errors and fall back to default message.
  }

  return fallbackMessage;
}
