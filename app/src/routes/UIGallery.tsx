import { Button } from '../components/ui/Button/Button'
import { Card } from '../components/ui/Card/Card'
import { Code } from '../components/ui/Code/Code'
import { Link } from '../components/ui/Link/Link'
import { List } from '../components/ui/List/List'
import { ThemeToggle } from '../components/ThemeToggle'

export const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
}
const title: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  color: 'var(--color-text-muted)',
}

export default function UIGallery() {
  return (
    <main
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Galería UI</h1>
        <ThemeToggle />
      </header>

      <section style={section}>
        <h2 style={title}>Button</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button>Primary md</Button>
          <Button variant="ghost">Ghost md</Button>
          <Button size="sm">Primary sm</Button>
          <Button variant="ghost" size="sm">Ghost sm</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section style={section}>
        <h2 style={title}>Link</h2>
        <p>
          Interno: <Link to="/">volver al home</Link>. Externo:{' '}
          <Link external href="https://vite.dev">
            vite.dev
          </Link>
          .
        </p>
      </section>

      <section style={section}>
        <h2 style={title}>Card</h2>
        <Card>
          <strong>Título de la card</strong>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Contenedor con borde, radio y sombra sutil.
          </p>
        </Card>
      </section>

      <section style={section}>
        <h2 style={title}>List</h2>
        <div style={{ display: 'flex', gap: 'var(--space-10)' }}>
          <List>
            <li>Plain · item 1</li>
            <li>Plain · item 2</li>
            <li>Plain · item 3</li>
          </List>
          <List variant="bulleted">
            <li>Bulleted · item 1</li>
            <li>Bulleted · item 2</li>
            <li>Bulleted · item 3</li>
          </List>
          <List variant="numbered" as="ol">
            <li>Numbered · item 1</li>
            <li>Numbered · item 2</li>
            <li>Numbered · item 3</li>
          </List>
        </div>
      </section>

      <section style={section}>
        <h2 style={title}>Code</h2>
        <p>
          Inline: <Code>const atlas = true</Code> dentro de un párrafo normal.
        </p>
        <Code block>
{`function hello(name: string) {
  return \`Hola, \${name}\`
}

console.log(hello('ATLAS'))`}
        </Code>
      </section>

      <section style={section}>
        <h2 style={title}>Tipografía</h2>
        <p style={{ fontSize: 'var(--text-3xl)' }}>Text 3xl (33px)</p>
        <p style={{ fontSize: 'var(--text-2xl)' }}>Text 2xl (28px)</p>
        <p style={{ fontSize: 'var(--text-xl)' }}>Text xl (23px)</p>
        <p style={{ fontSize: 'var(--text-lg)' }}>Text lg (19px)</p>
        <p style={{ fontSize: 'var(--text-base)' }}>Text base (16px) · texto corrido</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Text sm (14px) muted
        </p>
      </section>
    </main>
  )
}