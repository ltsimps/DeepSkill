import { cn } from '../../lib/utils';

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
}

export function Avatar({ name, imageUrl, className }: AvatarProps) {
  // Get initials from name (up to 2 characters)
  const initials = name
    ? name
        .split(' ')
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'User avatar'}
        className={cn(
          'rounded-full object-cover',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-medium',
        className
      )}
    >
      <span className="text-sm">{initials}</span>
    </div>
  );
}
