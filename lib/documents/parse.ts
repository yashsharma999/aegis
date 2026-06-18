// PDF text extraction via unpdf (serverless PDF.js).
//
// Password handling: pdf.js throws a PasswordException when an open-password is
// required (code 1) or wrong (code 2). We surface that as a typed error so the
// action/UI can prompt for (or correct) the password. The password is only used
// to decrypt for extraction — callers never persist it.

import { extractText as unpdfExtractText, getDocumentProxy } from 'unpdf'

export class PdfPasswordError extends Error {
  constructor(public reason: 'needs_password' | 'wrong_password') {
    super(
      reason === 'needs_password'
        ? 'This PDF is password-protected.'
        : 'Incorrect PDF password.',
    )
    this.name = 'PdfPasswordError'
  }
}

export async function extractText(
  bytes: Uint8Array,
  opts: { password?: string } = {},
): Promise<{ text: string; pageCount: number }> {
  try {
    // pdf.js takes ownership of and detaches the buffer it's given, so hand it a
    // copy — the caller keeps the original bytes intact (e.g. to upload to storage).
    const pdf = await getDocumentProxy(
      new Uint8Array(bytes),
      opts.password ? { password: opts.password } : undefined,
    )
    const { text, totalPages } = await unpdfExtractText(pdf, { mergePages: true })
    return { text, pageCount: totalPages }
  } catch (err: unknown) {
    // pdf.js PasswordException: code 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD.
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'PasswordException') {
      const code = (err as { code?: number }).code
      throw new PdfPasswordError(code === 2 ? 'wrong_password' : 'needs_password')
    }
    throw err
  }
}
