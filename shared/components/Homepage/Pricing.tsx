
// shared/components/Homepage/Pricing.tsx
import Link from 'next/link';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for beginners exploring prompt optimization.',
      features: [
        '5 prompts per day',
        'Basic prompt optimization',
        'Email support',
        'Community access'
      ],
      cta: 'Subscribe',
      href: '/get-started',
      featured: false
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'The complete suite — build expert-level prompts and system instructions with total control.',
      features: [
        '50 prompts per day',
        'Advanced optimization',
        'Priority support',
        'API access',
        'Analytics dashboard'
      ],
      cta: 'Subscribe',
      href: '/get-started?plan=pro',
      featured: true
    },
    {
      name: 'Premium',
      price: '$10',
      description: 'Unlock advanced tools for clearer, stronger, and more effective prompts.',
      features: [
        'Unlimited prompts',
        'Dedicated support',
        'Custom integrations',
        'SLA & Security',
        'Custom AI models'
      ],
      cta: 'Subscribe',
      href: '/contact',
      featured: false
    }
  ];

  return (
    <section id="pricing" className="py-12 sm:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-medium  text-gray-900 sm:text-4xl mb-3">
            Subscription
          </h2>
          <p className="text-sm text-gray-600 mt-4 max-w-2xl mx-auto">
            Start with essential features that sharpen your prompts instantly. Step up to the Pro Plan to unlock deeper AI optimization, enhanced structure, and precision-crafted system prompts.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 shadow-sm ${plan.featured
                  ? ' bg-[#335386] transform scale-110 z-10'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
                } flex flex-col h-full`}
            >
              <h3 className={`text-xl font-semibold mb-1 ${plan.featured ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm ${plan.featured ? 'text-white' : 'text-gray-500'} mb-6`}>
                {plan.description}
              </p>
              <div className="mb-6">
                <p className={`text-4xl font-regular ${plan.featured ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                  <span className={`text-base font-medium ${plan.featured ? 'text-white' : 'text-black'}`}>/month</span>
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-blue-300' : 'text-[#ED6730]'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className={`ml-3 text-sm ${plan.featured ? 'text-white' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link
                  href={plan.href}
                  className={`block w-full rounded-md px-4 py-3 text-center font-medium transition-all ${plan.featured
                      ? 'bg-[#FF541F] text-white hover:bg-[#FF541F]/90'
                      : 'bg-white border border-[#FF541F] text-gray-800 hover:bg-[#FF541F]/10'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}