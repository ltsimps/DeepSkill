import { type MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { PricingCard } from '../components/ui/pricing-card.tsx';

export const meta: MetaFunction = () => {
  return [
    { title: 'DeepSkill - Master DSA Through AI-Powered Practice' },
    {
      name: 'description',
      content: 'Master Data Structures and Algorithms through AI-powered deliberate practice. Interactive flashcards, real-world scenarios, and personalized learning paths.',
    },
  ]
}

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section with Problem Statement */}
      <div className="relative isolate px-8 pt-20 lg:px-12">
        {/* Background gradient with adjusted z-index */}
        <div className="absolute inset-x-0 -top-40 -z-1 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-500 to-cyan-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[80rem]" />
        </div>
        
        <div className="mx-auto max-w-3xl py-40 sm:py-56 lg:py-64">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-8xl">
              <span className="block">Struggling with</span>
              <span className="mt-4 block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                Algorithm Interviews?
              </span>
            </h1>
            <p className="mt-12 text-2xl leading-9 text-gray-300 max-w-2xl mx-auto">
              Traditional DSA learning is fragmented and theoretical. Engineers spend countless hours watching videos and reading books, but still struggle in real interviews.
            </p>
            <div className="mt-16 flex items-center justify-center gap-x-8">
              <Link
                to="/signup"
                className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-xl font-semibold text-white shadow-xl hover:bg-gradient-to-l hover:from-indigo-600 hover:to-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all duration-200 hover:scale-105"
              >
                Start Learning
              </Link>
              <Link to="/demo" className="text-xl font-semibold leading-6 text-white hover:text-purple-400 transition-colors">
                Try Demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="py-32 sm:py-40 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-8 lg:px-12">
          <div className="mx-auto max-w-3xl lg:text-center">
            <h2 className="text-2xl font-semibold leading-7 text-indigo-400">The DeepSkill Approach</h2>
            <p className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Master Algorithms Through AI-Guided Practice
            </p>
            <p className="mt-8 text-xl leading-9 text-gray-300 max-w-2xl mx-auto">
              Our AI-powered platform adapts to your learning style, providing personalized practice sessions and real-time feedback to help you master DSA concepts effectively.
            </p>
          </div>
          
          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-28 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-20 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} 
                  className="flex flex-col bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 rounded-2xl p-8 hover:bg-gradient-to-bl hover:from-purple-800 hover:via-purple-900 hover:to-purple-700 transition-colors duration-200 border border-purple-600/50 shadow-lg">
                  <dt className="flex items-center gap-x-4 text-lg font-semibold leading-7 text-white">
                    <div className="rounded-lg bg-purple-600/10 p-3 ring-1 ring-purple-600/25">
                      {feature.icon}
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-6 flex flex-auto flex-col text-lg leading-7 text-gray-300">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative isolate overflow-hidden py-32 sm:py-40 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800">
        <div className="mx-auto max-w-7xl px-8 lg:px-12">
          <div className="mx-auto max-w-3xl lg:mx-0">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Why Choose DeepSkill?</h2>
            <p className="mt-8 text-xl leading-9 text-gray-300 max-w-2xl mx-auto">
              Join thousands of developers who have transformed their approach to learning algorithms.
            </p>
          </div>
          <dl className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-12 text-lg leading-7 text-gray-300 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:gap-x-20">
            {benefits.map((benefit) => (
              <div key={benefit.name} className="relative pl-12">
                <dt className="inline font-semibold text-white">
                  <div className="absolute left-1 top-1 h-6 w-6 text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {benefit.name}
                </dt>
                <dd className="inline ml-1"> {benefit.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-32 sm:py-40 bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800">
        <div className="mx-auto max-w-7xl px-8 lg:px-12">
          <div className="mx-auto max-w-3xl lg:text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Pricing Plans
            </h2>
            <p className="mt-8 text-xl leading-9 text-gray-300 max-w-2xl mx-auto">
              Choose a plan that fits your learning needs. Start with a free trial and upgrade anytime.
            </p>
          </div>
          <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-28 lg:max-w-none grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <PricingCard
              name="Free Trial"
              price="Free"
              description="Get started with our free trial and explore the platform."
              features={[
                { text: 'Access to basic features', included: true },
                { text: 'Limited AI assistance', included: true },
                { text: 'Community support', included: true },
              ]}
            />
            <PricingCard
              name="Pro"
              price="$19.99"
              description="Unlock all features and get personalized AI guidance."
              features={[
                { text: 'Unlimited access to all features', included: true },
                { text: 'Advanced AI assistance', included: true },
                { text: 'Priority support', included: true },
              ]}
              popular
            />
            <PricingCard
              name="Enterprise"
              price="Contact Us"
              description="Tailored solutions for teams and organizations."
              features={[
                { text: 'Custom integrations', included: true },
                { text: 'Dedicated support', included: true },
                { text: 'Team collaboration tools', included: true },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    name: 'Interactive Practice',
    description: 'Learn by doing with our AI-powered flashcards and coding challenges that adapt to your skill level.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    name: 'Real-world Scenarios',
    description: 'Practice with scenarios inspired by actual tech interviews from top companies.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
  },
  {
    name: 'AI-Guided Learning',
    description: 'Get personalized feedback and recommendations to strengthen your weak areas.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
]

const benefits = [
  {
    name: 'Structured Learning Path.',
    description: 'Follow a carefully designed curriculum that builds your skills progressively.',
  },
  {
    name: 'Immediate Feedback.',
    description: 'Get instant insights on your solutions and areas for improvement.',
  },
  {
    name: 'Interview Preparation.',
    description: 'Practice with real interview questions and time constraints.',
  },
  {
    name: 'Personalized Experience.',
    description: 'AI adapts the content and difficulty based on your performance.',
  },
]
