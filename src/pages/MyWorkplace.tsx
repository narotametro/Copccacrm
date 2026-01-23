import React from 'react';

interface WorkplaceApp {
  name: string;
  logo: string;
  url: string;
  color: string;
}

const apps: WorkplaceApp[] = [
  { 
    name: "COPCCA PROCUREMENT", 
    logo: "Package", 
    url: "https://procurement.copcca.com",
    color: "from-indigo-500 to-indigo-600"
  },
  { 
    name: "COPCCA ACCOUNTING", 
    logo: "Revenue", 
    url: "https://accounting.copcca.com",
    color: "from-emerald-500 to-emerald-600"
  },
  { 
    name: "COPCCA POS", 
    logo: "🛒", 
    url: "https://pos.copcca.com",
    color: "from-purple-500 to-purple-600"
  },
  { 
    name: "COPCCA CONTENTS", 
    logo: "Mobile", 
    url: "https://contents.copcca.com",
    color: "from-pink-500 to-pink-600"
  },
  { 
    name: "COPCCA BUILDERS", 
    logo: "Construction", 
    url: "https://builders.copcca.com",
    color: "from-orange-500 to-orange-600"
  },
  { 
    name: "COPCCA MANUFACTURING", 
    logo: "Settings", 
    url: "https://manufacturing.copcca.com",
    color: "from-red-500 to-red-600"
  }
];

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

const features: Feature[] = [
  {
    icon: "Users",
    title: "Smart CRM",
    description: "Track leads, customers, and sales all in one place with AI-powered insights.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: "Package",
    title: "Effortless Procurement",
    description: "Streamline purchase orders, suppliers, and approvals with ease.",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    icon: "🛒",
    title: "Fast POS",
    description: "Modern POS system for SMBs that's smart, fast, and reliable.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: "Revenue",
    title: "Smart Accounting",
    description: "Track expenses, profits, and stocks accurately, with AI assistance.",
    color: "from-emerald-500 to-emerald-600"
  }
];

const benefits: Benefit[] = [
  {
    icon: "🔗",
    title: "All-in-One Platform",
    description: "Manage all aspects of your business without switching apps."
  },
  {
    icon: "AI",
    title: "AI-Powered",
    description: "Get intelligent recommendations and predictive analytics for better decisions."
  },
  {
    icon: "Lightning",
    title: "Easy to Use",
    description: "Intuitive design and responsive UI for smooth navigation."
  },
  {
    icon: "🔒",
    title: "Cloud-Based & Secure",
    description: "Access your business apps securely from anywhere, anytime."
  }
];

export const MyWorkplace: React.FC = () => {
  const handleCardClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-16 p-6">
      {/* Apps Grid */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 uppercase">WELCOME TO COPCCA WORKPLACE ALL APPS IN ONE PLACE</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
          {apps.map((app, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(app.url)}
              className="group relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative flex flex-col items-center text-center space-y-4">
                {/* Logo */}
                <div className={`w-16 h-16 bg-gradient-to-br ${app.color} rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {app.logo}
                </div>
                
                {/* Name */}
                <span className="font-semibold text-gray-900 text-sm leading-tight">
                  {app.name}
                </span>

                {/* Open icon on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-blue-600 text-sm font-medium flex items-center gap-1">
                  Open App
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Landing Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-12 lg:p-16">
        {/* Feature Highlights */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Powerful Features for Your Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl shadow-md`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Why Choose COPCCA?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-blue-400 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 text-center shadow-xl">
          <div className="text-5xl font-bold mb-2">7</div>
          <div className="text-lg font-semibold">Integrated Apps</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-8 text-center shadow-xl">
          <div className="text-5xl font-bold mb-2">1</div>
          <div className="text-lg font-semibold">Single Login</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 text-center shadow-xl">
          <div className="text-5xl font-bold mb-2">∞</div>
          <div className="text-lg font-semibold">Possibilities</div>
        </div>
      </div>
    </div>
  );
};
