import { useState } from 'react';
import { Mail, ExternalLink, CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export function EmailSetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Mail size={20} className="text-blue-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                📧 Professional Email System Ready!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Send beautiful invitation emails directly from COPCCA CRM
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Status */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-700">Backend Ready</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-700">Email Templates Created</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-amber-600" />
              <span className="text-gray-700">API Key Needed</span>
            </div>
          </div>

          {/* Setup CTA */}
          <div className="flex flex-wrap gap-3">
            <a
              href="https://resend.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              Get FREE API Key
              <ExternalLink size={14} />
            </a>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              {showDetails ? 'Hide' : 'Show'} Setup Instructions
            </button>
          </div>

          {/* Detailed Instructions */}
          {showDetails && (
            <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info size={16} className="text-blue-600" />
                Quick Setup (5 minutes)
              </h4>
              
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">Get Resend API Key (FREE)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Sign up at{' '}
                      <a
                        href="https://resend.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        resend.com/signup
                      </a>
                      {' '}→ Create API Key
                    </p>
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      ✅ Free tier: 100 emails/day (3,000/month) - Perfect for teams!
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">Add API Key to Pocket CRM</p>
                    <p className="text-xs text-gray-600 mt-1">
                      A modal should have appeared above to upload your RESEND_API_KEY
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      💡 The key starts with "re_" and is about 40 characters long
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">Test & Start Inviting!</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Send a test email to yourself, then start inviting your team
                    </p>
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                      🎉 Beautiful HTML emails will be sent instantly!
                    </div>
                  </div>
                </div>
              </div>

              {/* What Recipients See */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">
                  What your team members will receive:
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    Beautiful HTML design
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    Your company branding
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    Pink gradient theme
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    Mobile responsive
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    One-click signup
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle size={14} className="text-green-600" />
                    7-day expiration
                  </div>
                </div>
              </div>

              {/* Optional: Without API Key */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">
                  ⚠️ Without API Key Setup:
                </h5>
                <p className="text-xs text-gray-600">
                  The system will still work! It will generate invite links that you can copy and share manually 
                  via email, WhatsApp, or any other method. But automated email sending will be disabled.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}