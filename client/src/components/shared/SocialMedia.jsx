import { Facebook, Twitter, Mail, MessageCircle, Linkedin, Instagram, Youtube } from 'lucide-react';

/**
 * Social Media Links Component
 * Displays social media icons linking to your platforms
 */
export default function SocialMedia({ layout = 'horizontal', size = 'md' }) {
  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/PubliceEyeKenya',
      color: '#1DA1F2',
      label: '@PublicEyeKenya'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://facebook.com/PublicEyeKenya',
      color: '#1877F2',
      label: 'PublicEye Kenya'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/publiceye.kenya',
      color: '#E4405F',
      label: '@publiceye.kenya'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/company/publiceye-kenya',
      color: '#0A66C2',
      label: 'PublicEye Kenya'
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      url: 'https://discord.gg/PublicEye',
      color: '#5865F2',
      label: 'Join Discord'
    },
    {
      name: 'Email',
      icon: Mail,
      url: 'mailto:info@publiceye.ke',
      color: '#BB0000',
      label: 'info@publiceye.ke'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://youtube.com/@PublicEyeKenya',
      color: '#FF0000',
      label: 'PublicEye Kenya'
    }
  ];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  };

  const containerClasses = layout === 'vertical' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-2 md:gap-3 items-center justify-center';
  const buttonClasses = layout === 'vertical' ? 'w-full' : '';

  return (
    <div className={containerClasses}>
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition-all hover:scale-105 ${buttonClasses}`}
            style={{
              background: `${social.color}20`,
              border: `1px solid ${social.color}40`,
              color: social.color
            }}
            title={social.label}
          >
            <Icon size={iconSizes[size]} />
            <span className="hidden sm:inline">{social.name}</span>
          </a>
        );
      })}
    </div>
  );
}
