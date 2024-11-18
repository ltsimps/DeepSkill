import { type ReactNode } from 'react'
import { Link } from '@remix-run/react'

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingCardProps {
  name: string
  price: string
  description: string
  features: PricingFeature[]
  popular?: boolean
  ctaText?: string
  ctaLink?: string
  icon?: ReactNode
}

export function PricingCard({
  name,
  price,
  description,
  features,
  popular = false,
  ctaText = 'Get started',
  ctaLink = '/signup',
  icon,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border ${
        popular
          ? 'border-purple-600 bg-purple-600/10'
          : 'border-gray-700 bg-gray-800/40'
      } p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105`}
    >
      {popular && (
        <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-purple-600 px-3 py-2 text-center text-sm font-medium text-white">
          Most Popular
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{name}</h3>
        {icon && <div className="text-purple-400">{icon}</div>}
      </div>

      <p className="mt-4 text-gray-300">{description}</p>

      <div className="my-8">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-white">{price}</span>
          {price !== 'Free' && <span className="ml-1 text-gray-300">/month</span>}
        </div>
      </div>

      <ul className="mb-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            {feature.included ? (
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span
              className={`ml-3 ${
                feature.included ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        to={ctaLink}
        className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          popular
            ? 'bg-purple-600 text-white hover:bg-purple-500'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {ctaText}
      </Link>
    </div>
  )
}
