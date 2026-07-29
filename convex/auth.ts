import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import Google from '@auth/core/providers/google';
import type { EmailConfig } from '@auth/core/providers';
import { validateAccountPassword } from '../src/domain/auth/passwordPolicy';

const passwordResetEmail: EmailConfig = {
  id: 'ace-password-reset',
  type: 'email',
  name: 'ACE Child Grow account recovery',
  from: process.env.AUTH_EMAIL_FROM ?? 'ACE Child Grow <onboarding@resend.dev>',
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 15 * 60,
  generateVerificationToken: async () => {
    const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    return String(value).padStart(6, '0');
  },
  async sendVerificationRequest({ identifier, token, provider }) {
    if (!provider.apiKey) throw new Error('Password recovery email is not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: provider.from,
        to: identifier,
        subject: 'ACE Child Grow — account recovery code',
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>ACE Child Grow</h2><p>အကောင့်ပြန်လည်ဝင်ရောက်ရန် အောက်ပါအတည်ပြုကုဒ်ကို သုံးပါ။</p><p>Use this verification code to recover your account.</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">${token}</p><p>This code expires in 15 minutes. Do not share it with anyone.</p></div>`,
        text: `ACE Child Grow account recovery code: ${token}\n\nThis code expires in 15 minutes. Do not share it with anyone.`,
      }),
    });
    if (!response.ok) throw new Error('Unable to send account recovery email');
  },
};

// Email + password authentication. Convex Auth manages the `users` and session
// tables (see authTables in schema.ts). Every data function derives the owner
// from the authenticated identity — never from client input.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google({
    clientId: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
  }), Password({
    reset: passwordResetEmail,
    validatePasswordRequirements(password) {
      const valid = /^\d{6}$/.test(password) || password.length >= 8;
      if (!valid) throw new Error('Invalid account credential');
    },
    profile(params) {
      const email = String(params.email ?? '').trim().toLowerCase();
      if (!email) throw new Error('Email is required');
      const flow = String(params.flow ?? '');
      if (flow === 'signUp' || flow === 'reset-verification') {
        const accountType = params.accountType === 'staff' ? 'staff' : 'parent';
        const candidate = String(flow === 'signUp' ? params.password ?? '' : params.newPassword ?? '');
        validateAccountPassword(candidate, accountType);
      }
      return { email };
    },
  })],
});
