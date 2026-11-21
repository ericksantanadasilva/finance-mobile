/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Cores = tokens do src/global.css (o valor muda sozinho com o modo)
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        foreground: 'var(--foreground)',
        'muted-foreground': 'var(--muted-foreground)',
        ink: 'var(--ink)',
        'border-custom': 'var(--border-custom)',
        band: 'var(--band)',
        'band-foreground': 'var(--band-foreground)',
        highlight: 'var(--highlight)',
        'highlight-foreground': 'var(--highlight-foreground)',
        ai: 'var(--ai)',
        'ai-foreground': 'var(--ai-foreground)',
        income: 'var(--income)',
        'income-foreground': 'var(--income-foreground)',
        expense: 'var(--expense)',
        'expense-foreground': 'var(--expense-foreground)',
        warning: 'var(--warning)',
        'warning-foreground': 'var(--warning-foreground)',
        danger: 'var(--danger)',
        'danger-foreground': 'var(--danger-foreground)',
        'danger-border': 'var(--danger-border)',
        overlay: 'var(--overlay)',
      },
      // Sem boxShadow aqui: no Android a classe de sombra não desenha nada.
      // A sombra dura é o hook useHardShadow (src/lib/hard-shadow.ts).
    },
  },
  plugins: [],
};
