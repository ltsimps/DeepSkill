import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Features } from "~/components/features";

export const meta: MetaFunction = () => {
  return [
    { title: "DeepSkill - Master Algorithms & Data Structures" },
    { description: "A platform for deliberate practice in algorithms and data structures. Learn, practice, and master computer science fundamentals." },
  ];
};

export default function Index() {
  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-600">DeepSkill</span>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button type="button" className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">Features</a>
            <a href="#practice" className="text-sm font-semibold leading-6 text-gray-900">Practice</a>
            <a href="#methodology" className="text-sm font-semibold leading-6 text-gray-900">Methodology</a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a href="#" className="text-sm font-semibold leading-6 text-gray-900">Log in <span aria-hidden="true">→</span></a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative isolate">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    Master Algorithms Through Deliberate Practice
                  </h1>
                  <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                    Elevate your programming skills with our structured learning platform. Practice algorithms and data structures with a methodical approach designed for deep understanding and mastery.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Link
                      to="/register"
                      className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      Start Learning
                    </Link>
                    <Link to="/methodology" className="text-sm font-semibold leading-6 text-gray-900">
                      Our Approach <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-gray-50">
          <Features />
        </div>

        {/* Interactive Practice Section */}
        <div id="practice" className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">Interactive Learning</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Learn by Doing
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Practice with our interactive coding challenges. Get immediate feedback and learn from your mistakes.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-5xl rounded-2xl bg-white p-8 shadow-lg">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Blurred Code Example */}
                <div className="relative rounded-lg bg-gray-900 p-6">
                  <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                  <pre className="text-sm text-gray-300">
                    <code>{`function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}`}</code>
                  </pre>
                </div>

                {/* Practice Input Area */}
                <div className="rounded-lg bg-gray-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Your Solution</h3>
                  <div className="relative">
                    <pre className="min-h-[300px] rounded-md bg-gray-900 p-4">
                      <code className="text-sm text-gray-300" contentEditable="true" suppressContentEditableWarning={true}>
                        {`function binarySearch(arr, target) {
  // Your implementation here
  
}`}
                      </code>
                    </pre>
                    <button className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">
                      Submit Solution
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology Section */}
        <div id="methodology" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">Our Approach</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                The Science of Deliberate Practice
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our methodology is based on proven learning techniques and deliberate practice principles.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {methodologySteps.map((step) => (
                  <div key={step.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                      {step.icon}
                      {step.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                      <p className="flex-auto">{step.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const methodologySteps = [
  {
    name: 'Structured Learning Path',
    description: 'Follow a carefully designed curriculum that builds your knowledge progressively, from fundamentals to advanced concepts.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41" />
      </svg>
    ),
  },
  {
    name: 'Active Recall',
    description: 'Practice solving problems without hints first, then learn from detailed explanations and optimal solutions.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    name: 'Spaced Repetition',
    description: 'Review concepts and problems at scientifically-optimized intervals to ensure long-term retention.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];
