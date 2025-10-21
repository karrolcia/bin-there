import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.svg";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - bin there";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Learn how bin there collects, uses, and protects your data. Our privacy policy explains our commitment to your privacy and data security.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <img src={logo} alt="bin there" className="h-12" />
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: October 21, 2025</p>
        </div>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Introduction</h2>
            <p className="mb-4">
              Welcome to bin there. We're committed to protecting your privacy and being transparent about how we collect, use, and protect your information. This privacy policy explains our data practices in clear, simple terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Location Data</h3>
                <p>We collect your location when you use the map feature to find nearby bins. This data helps us show you relevant trash can locations and improve our service.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Account Information</h3>
                <p>If you create an account, we collect your email address and any profile information you choose to provide. This allows us to track your environmental impact and maintain your streak.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Usage Data</h3>
                <p>We collect information about how you interact with our app, including bins you've marked as used, routes calculated, and search patterns. This helps us improve the service and understand user behavior.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Technical Data</h3>
                <p>We automatically collect your IP address, browser type, device information, and user agent. This data helps us provide technical support and detect abuse.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To show you nearby trash cans and provide navigation</li>
              <li>To track your environmental impact (total bins used, streak days)</li>
              <li>To improve our bin database and service quality</li>
              <li>To send you service-related notifications (if you opt-in)</li>
              <li>To analyze usage patterns and optimize the app</li>
              <li>To prevent abuse and maintain service security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Sharing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">Public Data</h3>
                <p>Aggregated bin usage statistics (total uses per bin location) are shared with the community to help identify popular bins. Your personal usage data remains private.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Third-Party Services</h3>
                <p>We use Mapbox for maps and OpenStreetMap data for bin locations. These services may collect their own data according to their privacy policies. We do not sell your personal information to third parties.</p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Legal Requirements</h3>
                <p>We may disclose your information if required by law, court order, or to protect our legal rights and the safety of our users.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Security</h2>
            <p className="mb-4">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure authentication and password hashing</li>
              <li>Row-level security policies on our database</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of location tracking (though this limits app functionality)</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at [YOUR-EMAIL@DOMAIN.COM]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we're required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we've collected data from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We'll notify you of significant changes by updating the "Last updated" date and, if appropriate, providing additional notice (such as an in-app notification or email).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
            <p className="mb-4">
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="font-medium">
              Email: [YOUR-EMAIL@DOMAIN.COM]<br />
              Address: [YOUR-ADDRESS]
            </p>
          </section>

          <div className="mt-12 p-6 bg-secondary/20 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>⚠️ Important:</strong> This privacy policy is a template. You should customize it with your specific contact information and have it reviewed by a legal professional before going live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
