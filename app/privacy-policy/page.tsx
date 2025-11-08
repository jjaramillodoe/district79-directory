import type { Metadata } from "next";

const LAST_UPDATED = "November 8, 2025";

export const metadata: Metadata = {
  title: "Privacy Policy | District 79 Directory",
  description: "Privacy policy for the District 79 Directory internal application.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            This Privacy Policy explains how the District 79 Directory (the "Directory") managed by NYC Public Schools District 79 collects, uses, and safeguards information within this internal application. The Directory is designed exclusively for authorized NYC Public Schools District 79 personnel to support operations related to adult education and youth programs.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Purpose and Scope</h2>
            <p>
              The Directory is an internal-use application intended solely for authorized staff of NYC Public Schools District 79. Access is restricted and authentication is required. The application should not be accessed or used by members of the public.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p>
              The Directory stores and displays information related to District 79 sites, programs, staff contacts, and operations. At this time, the application does not intentionally collect personal information beyond what is necessary for internal operational needs. Access and usage may be logged for security and auditing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How Information Is Used</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide authorized District 79 staff with up-to-date site, program, and contact information.</li>
              <li>To support internal planning, coordination, and reporting activities.</li>
              <li>To maintain the security and integrity of District 79 data systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              District 79 implements administrative, technical, and physical safeguards to protect information within the Directory. Access requires authentication via approved credentials. Users are responsible for safeguarding their login information and promptly reporting any suspected unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Internal Use Only</h2>
            <p>
              The Directory is for internal use by NYC Public Schools District 79 staff. Data contained within the Directory must not be shared outside of authorized channels. Any public disclosure of information requires approval through established District policies and procedures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated periodically to reflect changes in operational practices or compliance requirements. Updated policies will be posted within the Directory with a revised effective date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact Information</h2>
            <p>
              Questions about this Privacy Policy or the Directory should be directed to the District 79 central office. Authorized users may submit inquiries through established District communications channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
