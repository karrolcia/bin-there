import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.svg";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service - bin there";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Read the terms and conditions for using bin there. Understand your rights and responsibilities when using our bin locator service.");
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
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">Last updated: October 21, 2025</p>
        </div>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Agreement to Terms</h2>
            <p>
              By accessing or using bin there ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Service Description</h2>
            <p className="mb-4">
              bin there is a web application that helps users locate nearby public trash cans using map data from OpenStreetMap and location services. The Service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interactive map showing trash can locations</li>
              <li>Walking directions to nearest bins</li>
              <li>Activity tracking for registered users</li>
              <li>Community-driven bin usage statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">User Accounts</h2>
            <div className="space-y-4">
              <p>
                When you create an account with us, you must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account and password.
              </p>
              <p>
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Provide accurate location data when using the Service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Acceptable Use</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Submit false, inaccurate, or misleading bin location data</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated scripts, bots, or scrapers without permission</li>
              <li>Abuse rate limits or attempt to overload our systems</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Remove or modify any copyright or proprietary notices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Accuracy</h2>
            <p>
              Bin locations are sourced from OpenStreetMap and community contributions. While we strive for accuracy, we cannot guarantee that all bin locations are current, accurate, or available. Bins may be removed, relocated, or temporarily unavailable. Use the Service at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Location Services</h2>
            <p>
              The Service requires access to your device's location to function properly. By using the Service, you consent to location tracking as described in our Privacy Policy. You can revoke location access at any time through your device settings, though this will limit functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by bin there and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              Map data is provided by Mapbox and OpenStreetMap contributors, licensed under their respective terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Accuracy, reliability, or availability of bin locations</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security or freedom from viruses or harmful components</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BIN THERE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your access to or use of (or inability to access or use) the Service</li>
              <li>Reliance on inaccurate bin location data</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access to your account or data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless bin there and its affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of significant changes by updating the "Last updated" date and providing notice through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [YOUR-JURISDICTION], without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts of [YOUR-JURISDICTION].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="font-medium">
              Email: [YOUR-EMAIL@DOMAIN.COM]<br />
              Address: [YOUR-ADDRESS]
            </p>
          </section>

          <div className="mt-12 p-6 bg-secondary/20 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>⚠️ Important:</strong> These terms of service are a template. You should customize them with your specific information (jurisdiction, contact details, etc.) and have them reviewed by a legal professional before going live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
