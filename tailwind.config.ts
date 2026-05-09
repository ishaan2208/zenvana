import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
  	container: {
  		center: true,
  		padding: '1rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	fontSize: {
  		xs: [
  			'0.75rem',
  			{
  				lineHeight: '1rem'
  			}
  		],
  		sm: [
  			'0.875rem',
  			{
  				lineHeight: '1.5rem'
  			}
  		],
  		base: [
  			'1rem',
  			{
  				lineHeight: '1.75rem'
  			}
  		],
  		lg: [
  			'1.125rem',
  			{
  				lineHeight: '2rem'
  			}
  		],
  		xl: [
  			'1.25rem',
  			{
  				lineHeight: '2rem'
  			}
  		],
  		'2xl': [
  			'1.5rem',
  			{
  				lineHeight: '2rem'
  			}
  		],
  		'3xl': [
  			'2rem',
  			{
  				lineHeight: '2.5rem'
  			}
  		],
  		'4xl': [
  			'2.5rem',
  			{
  				lineHeight: '3.5rem'
  			}
  		],
  		'5xl': [
  			'3rem',
  			{
  				lineHeight: '3.5rem'
  			}
  		],
  		'6xl': [
  			'3.75rem',
  			{
  				lineHeight: '1'
  			}
  		],
  		'7xl': [
  			'4.5rem',
  			{
  				lineHeight: '1.1'
  			}
  		],
  		'8xl': [
  			'6rem',
  			{
  				lineHeight: '1'
  			}
  		],
  		'9xl': [
  			'8rem',
  			{
  				lineHeight: '1'
  			}
  		]
  	},
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['var(--font-lexend)', 'var(--font-inter)', 'sans-serif'],
  			serif: [
  				'var(--font-fraunces)',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif',
  			],
  			editorial: ['var(--font-fraunces)', 'Georgia', 'serif']
  		},
  		maxWidth: {
  			'2xl': '40rem'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))'
  			},
  			brand: {
  				white: '#F6F7ED',
  				spring: '#DBE64C',
  				midnight: '#001F3F',
  				mantis: '#74C365',
  				green: '#00804C',
  				nuit: '#1E488F'
  			},
  			ink: {
  				DEFAULT: '#0A0E1A',
  				50: '#F2F4F8',
  				100: '#E2E5EC',
  				200: '#C2C8D5',
  				300: '#8E96AA',
  				400: '#5C6478',
  				500: '#2E3447',
  				600: '#1A2236',
  				700: '#10172A',
  				800: '#0A0E1A',
  				900: '#05080F'
  			},
  			sand: {
  				DEFAULT: '#F6F7ED',
  				50: '#FBFCF6',
  				100: '#F6F7ED',
  				200: '#EDEFE0',
  				300: '#DDE0C9',
  				400: '#BCC2A2'
  			},
  			gold: {
  				DEFAULT: '#C8A85A',
  				50: '#FBF6E8',
  				100: '#F4E8C2',
  				200: '#E8D693',
  				300: '#D8C075',
  				400: '#C8A85A',
  				500: '#A8893E',
  				600: '#7E6628'
  			},
  			sapphire: {
  				DEFAULT: '#1E488F',
  				50: '#E8EEF8',
  				100: '#CDD9EE',
  				200: '#94B0DA',
  				300: '#5B85C2',
  				400: '#1E488F',
  				500: '#173872',
  				600: '#102855'
  			},
  			forest: {
  				DEFAULT: '#1E5F46',
  				50: '#E5F1EC',
  				100: '#BFDDD0',
  				200: '#7FBAA1',
  				300: '#3F8D70',
  				400: '#1E5F46',
  				500: '#0F4030'
  			},
  			tier: {
  				essential: 'hsl(var(--tier-essential))',
  				refined: 'hsl(var(--tier-refined))',
  				signature: 'hsl(var(--tier-signature))'
  			}
  		},
  		borderRadius: {
  			'4xl': '2rem',
  			'5xl': '2.5rem',
  			xl: 'calc(var(--radius) - 4px)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 6px)'
  		},
  		boxShadow: {
  			soft: '0 8px 30px rgba(0, 31, 63, 0.08)',
  			card: '0 10px 30px rgba(0, 31, 63, 0.10)',
  			editorial: '0 24px 80px -20px rgba(8, 17, 31, 0.45)',
  			'gold-glow': '0 0 0 1px rgba(200, 168, 90, 0.4), 0 18px 60px -25px rgba(200, 168, 90, 0.45)'
  		},
  		backgroundImage: {
  			'brand-gradient': 'linear-gradient(135deg, #001F3F 0%, #1E488F 55%, #00804C 100%)',
  			'accent-gradient': 'linear-gradient(135deg, #DBE64C 0%, #74C365 100%)',
  			'ink-gradient': 'linear-gradient(180deg, #0A0E1A 0%, #10172A 60%, #001F3F 100%)',
  			'gold-gradient': 'linear-gradient(135deg, #E8D693 0%, #C8A85A 50%, #A8893E 100%)',
  			'sand-gradient': 'linear-gradient(180deg, #FBFCF6 0%, #EDEFE0 100%)',
  			'signature-gradient': 'linear-gradient(135deg, #001F3F 0%, #102855 50%, #C8A85A 140%)',
  			'hero-shade':
  				'linear-gradient(180deg, rgba(10,14,26,0) 0%, rgba(10,14,26,0.18) 30%, rgba(10,14,26,0.6) 78%, rgba(10,14,26,0.92) 100%)'
  		},
  		transitionTimingFunction: {
  			editorial: 'cubic-bezier(0.16, 1, 0.3, 1)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-up': {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			marquee: {
  				'0%': { transform: 'translateX(0)' },
  				'100%': { transform: 'translateX(-50%)' }
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
  			'fade-in': 'fade-in 0.6s ease-out both',
  			marquee: 'marquee 32s linear infinite',
  			shimmer: 'shimmer 2.4s ease-in-out infinite'
  		}
  	}
  },
  plugins: [animate],
}

export default config
