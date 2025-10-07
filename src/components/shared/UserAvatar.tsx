'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import { getInitials, getColorFromString } from '@/lib/utils';

interface UserAvatarProps {
  user: Pick<User, 'name' | 'email' | 'image'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const name = user.name || user.email;
  const initials = getInitials(name);
  const bgColor = getColorFromString(name);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={user.image || undefined} alt={name} />
      <AvatarFallback className={bgColor}>{initials}</AvatarFallback>
    </Avatar>
  );
}
