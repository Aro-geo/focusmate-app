import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PlanPricing: React.FC = () => {
  const { user } = useAuth();

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "per month",
      description: "Perfect for getting started",
      features: [
        "Basic task management",
        "Limited AI suggestions (5 per month)",
        "Pomodoro timer & focus sessions",
        "Basic analytics",
        "Community support"
      ],
      cta: "Current Plan",
      popular: false,
      current: true
    },
    {
      name: "Pro",
      price: "$2.99",
      period: "per month",
      yearlyPrice: "$28.70",
      description: "For serious productivity enthusiasts",
      features: [
        "Unlimited AI-powered suggestions & insights",
        "Advanced analytics and productivity reports",
        "Priority support",
        "Customizable focus session lengths",
        "Smart scheduling & calendar integration",
        "Mood tracking & journaling",
        "Early access to new features"
      ],
      cta: "Upgrade to Pro",
      popular: true,
      current: false
    },
    {
      name: "Team/Business",
      price: "$5.99",
      period: "per team (up to 5 users)",
      yearlyPrice: "$57.50",
      description: "Built for teams and organizations",
      features: [
        "All Pro features for each team member",
        "Team dashboard & shared tasks",
        "Admin controls & permissions",
        "Team productivity analytics",
        "Priority onboarding & support"
      ],
      cta: "Contact Sales",
      popular: false,
      current: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Plan & Pricing
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your productivity needs
          </p>
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Monthly
            </button>
            <button className="px-3 sm:px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md">
              Yearly (Save 20%)
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 p-6 sm:p-8 ${
                plan.popular 
                  ? 'border-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/30' 
                  : 'border-gray-200 dark:border-gray-700'
              } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                  {plan.description}
                </p>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2 text-sm sm:text-base">
                    {plan.period}
                  </span>
                  {plan.yearlyPrice && (
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Or {plan.yearlyPrice}/year (save 20%)
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                  plan.current
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {plan.cta}
                {!plan.current && <ArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-8 sm:mt-12"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
            All plans include 3-month free trial • No credit card required • Cancel anytime
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need help choosing?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Contact our team for personalized recommendations based on your productivity needs.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanPricing;