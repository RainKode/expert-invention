/**
 * Sanitize user input for use in Supabase PostgREST filter expressions.
 * Strips characters that could alter filter logic (.or(), .ilike(), etc.)
 */
export function sanitizeFilterInput(input: string): string {
  // Remove PostgREST operators and special chars that could inject filter syntax
  return input.replace(/[%_.*,()\\]/g, '')
}
