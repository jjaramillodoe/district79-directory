import type { Metadata } from "next";

const LAST_UPDATED = "November 8, 2025";

export const metadata: Metadata = {
  title: "Terms of Service | District 79 Directory",
  description: "Terms of service for the District 79 Directory internal application.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            These Terms of Service ("Terms") govern use of the District 79 Directory (the "Directory"), an internal application maintained by NYC Public Schools District 79. By accessing or using the Directory, you agree to comply with these Terms. This application is intended exclusively for authorized District 79 personnel.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Authorized Users</h2>
            <p>
              Access to the Directory is limited to NYC Public Schools District 79 employees and authorized contractors who have been granted explicit permissions. Sharing access credentials with unaffiliated individuals is strictly prohibited. Users must comply with all applicable NYC DOE policies, regulations, and confidentiality requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Internal Use Only</h2>
            <p>
              The Directory is for internal District 79 operations. Information contained within the Directory may include sensitive or confidential data. Users may not disclose Directory content externally unless authorized through formal NYC DOE channels and in accordance with privacy and data-sharing policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Acceptable Use</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Directory only for work-related purposes tied to District 79 programs and services.</li>
              <li>Protect login credentials and promptly report suspected unauthorized access.</li>
              <li>Do not attempt to interfere with or disrupt the operation of the Directory.</li>
              <li>Do not introduce malicious code or attempt to gain unauthorized access to other systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Accuracy and Updates</h2>
            <p>
              Users are expected to enter and maintain accurate information within the Directory. Inaccurate or outdated data should be corrected promptly. District 79 administrators may review and update Directory content to ensure reliability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Security and Monitoring</h2>
            <p>
              District 79 may monitor Directory usage to ensure compliance with these Terms and with NYC DOE policies. Unauthorized use may result in revocation of access, disciplinary action, or other remedies permitted by law and DOE regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Modifications and Availability</h2>
            <p>
              District 79 may modify, suspend, or discontinue the Directory or these Terms at any time. Updated Terms will be posted within the Directory and are effective upon posting. Continued use constitutes acceptance of updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contacts</h2>
            <p>
              For questions regarding these Terms or the Directory, authorized users should contact the District 79 central office through established support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
