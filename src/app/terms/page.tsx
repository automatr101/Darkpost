import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Terms of Use | Darkpost',
  description: 'Read the Darkpost Terms of Use. By using the platform you agree to these terms.',
};

const sections = [
  {
    number: '01',
    title: 'Who We Are',
    content: `Darkpost is an anonymous digital confession platform that allows users to post short text confessions and voice audio recordings to a public feed. Content is viewable by anyone; posting and listening to voice confessions requires a registered account.`,
  },
  {
    number: '02',
    title: 'Eligibility',
    content: `You must be at least 18 years of age to create an account or post content on Darkpost. By using the platform, you confirm that you meet this requirement. If we discover that a user is under 18, we will terminate their account immediately.`,
  },
  {
    number: '03',
    title: 'Your Account',
    bullets: [
      'Authentication is handled through Google OAuth. Darkpost does not store your password.',
      'You are responsible for all activity that occurs under your account.',
      'You may not share your account with others or create accounts to bypass bans or restrictions.',
      'You may delete your account at any time by contacting us.',
    ],
  },
  {
    number: '04',
    title: 'What You Can Post',
    content: 'Darkpost is a place for honest, anonymous confessions. You agree that any content you post — whether text or voice — will NOT include:',
    bullets: [
      'Threats of violence or harm to yourself or others',
      'Content that harasses, bullies, or targets a specific individual',
      'Personally identifying information about another person (doxxing)',
      'Hate speech based on race, religion, gender, sexual orientation, disability, or nationality',
      'Sexual content involving minors (CSAM) — this is illegal and will be reported to authorities immediately',
      'Spam, advertisements, or promotional content',
      'Impersonation of another person or entity',
      'Content that violates any applicable local, national, or international law',
    ],
    footer: 'We reserve the right to remove any content that violates these rules at any time without notice.',
  },
  {
    number: '05',
    title: 'Anonymous Posting',
    content: 'When you post anonymously:',
    bullets: [
      'Your name and account details are hidden from the public feed',
      'You are assigned a randomly generated alias (e.g. "Shadow #7821")',
      'Your account is still internally linked to your post for moderation and ownership purposes',
    ],
    footer: 'Important: Anonymous posting does NOT mean you are completely untraceable. Darkpost will comply with valid legal orders and may disclose account information in such circumstances.',
  },
  {
    number: '06',
    title: 'Voice Confessions',
    bullets: [
      'You may record and upload voice confessions up to 60 seconds in length',
      'Voice confessions are stored on third-party cloud infrastructure (Supabase)',
      'Only registered, logged-in users may listen to voice confessions',
      'By uploading a voice recording, you grant Darkpost a non-exclusive, worldwide, royalty-free license to store, transmit, and display your recording for as long as the post remains active',
      'This license ends immediately and permanently when you delete your voice confession',
      'Darkpost does not transcribe, sell, or use your voice recordings for any purpose other than displaying them on the platform',
    ],
  },
  {
    number: '07',
    title: 'Deleting Your Content',
    content: 'You have the right to permanently delete any confession you have posted at any time. When you delete a post:',
    bullets: [
      'The post record is immediately and permanently removed from our database',
      'Any associated audio file is immediately and permanently deleted from cloud storage',
      'This action is irreversible — Darkpost does not maintain backups of deleted user content',
      'The content will no longer be visible to any user',
    ],
  },
  {
    number: '08',
    title: 'Content Ownership',
    content: `You retain full ownership of all content you post on Darkpost. By posting, you grant Darkpost a limited license solely for the purpose of operating and displaying the platform. We do not claim ownership of your posts.`,
  },
  {
    number: '09',
    title: 'Third-Party Services',
    content: 'Darkpost relies on the following third-party services. Their use is subject to their own privacy policies:',
    bullets: [
      'Supabase (database and file storage) — supabase.com/privacy',
      'Google (authentication via OAuth) — policies.google.com/privacy',
      'Vercel (hosting and CDN) — vercel.com/legal/privacy-policy',
    ],
    footer: 'Darkpost is not responsible for the practices of these third parties.',
  },
  {
    number: '10',
    title: 'Disclaimer of Warranties',
    content: `Darkpost is provided "as is" and "as available" without any warranty of any kind, express or implied. We do not guarantee that the platform will be uninterrupted, error-free, or free of harmful content posted by other users.`,
  },
  {
    number: '11',
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by law, Darkpost and its operators shall not be liable for:',
    bullets: [
      'Any content posted by users on the platform',
      'Any emotional distress, harm, or damages resulting from reading confessions',
      'Any loss of data, including content deleted by the user or removed for policy violations',
      'Any indirect, incidental, special, or consequential damages arising from use of the platform',
    ],
  },
  {
    number: '12',
    title: 'Termination',
    content: `We reserve the right to suspend or permanently terminate any account at our sole discretion, with or without notice, for any violation of these Terms or behavior we deem harmful to the platform or its users. You may also terminate your own account at any time.`,
  },
  {
    number: '13',
    title: 'Changes to These Terms',
    content: `We may update these Terms at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms. The "Last Updated" date at the top of this document will reflect the most recent revision.`,
  },
  {
    number: '14',
    title: 'Contact',
    content: 'For legal notices, content removal requests, or account deletion:',
    bullets: [
      'Email: team.automatr@gmail.com',
      'Platform: darkpost.vercel.app',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#F0ECE3]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-white/5 px-6 h-14 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="font-syne font-bold text-sm uppercase tracking-widest">Terms of Use</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff535b]/10 border border-[#ff535b]/20 mb-6">
            <Shield size={14} className="text-[#ff535b]" />
            <span className="font-syne font-bold text-[11px] uppercase tracking-widest text-[#ff535b]">Legal</span>
          </div>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl tracking-tighter mb-4">
            Terms of Use
          </h1>
          <div className="flex items-center gap-4 text-[#4A4A4A] font-inter text-sm">
            <span>Last Updated: April 2025</span>
            <span>·</span>
            <span>Effective Date: April 2025</span>
          </div>
          <p className="mt-6 font-inter text-[#6B6B6B] leading-relaxed max-w-xl">
            Welcome to Darkpost. By accessing or using Darkpost (available at{' '}
            <a href="https://darkpost.vercel.app" className="text-[#ff535b] hover:underline">darkpost.vercel.app</a>
            ), you agree to be bound by these Terms of Use. If you do not agree, do not use the platform.
          </p>
        </div>

        {/* Privacy Policy Link */}
        <div className="mb-12 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <span className="font-inter text-sm text-[#6B6B6B]">Also read our Privacy Policy</span>
          <Link href="/privacy" className="px-4 py-2 rounded-full bg-[#ff535b]/10 border border-[#ff535b]/20 text-[#ff535b] font-syne font-bold text-xs uppercase tracking-widest hover:bg-[#ff535b]/20 transition-colors">
            View Privacy Policy →
          </Link>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-0">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="py-8 border-b border-white/5 last:border-0 group"
            >
              <div className="flex gap-6 items-start">
                {/* Number */}
                <span className="font-mono text-[11px] text-[#2a2a2a] pt-1 flex-shrink-0 group-hover:text-[#ff535b]/30 transition-colors">
                  {section.number}
                </span>
                {/* Content */}
                <div className="flex-1">
                  <h2 className="font-syne font-bold text-lg text-[#F0ECE3] mb-3 tracking-tight">
                    {section.title}
                  </h2>
                  {section.content && (
                    <p className="font-inter text-[#6B6B6B] text-sm leading-relaxed mb-3">
                      {section.content}
                    </p>
                  )}
                  {section.bullets && (
                    <ul className="flex flex-col gap-2 mb-3">
                      {section.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 font-inter text-sm text-[#6B6B6B]">
                          <span className="w-1 h-1 rounded-full bg-[#ff535b]/40 mt-2 flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="font-inter text-[#4A4A4A] text-sm leading-relaxed italic border-l-2 border-[#ff535b]/20 pl-4">
                      {section.footer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="font-inter text-[#2a2a2a] text-xs">
            © 2025 Darkpost. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="font-inter text-xs text-[#4A4A4A] hover:text-[#ff535b] transition-colors">Privacy Policy</Link>
            <span className="text-[#2a2a2a]">·</span>
            <Link href="/" className="font-inter text-xs text-[#4A4A4A] hover:text-[#ff535b] transition-colors">Back to Feed</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
