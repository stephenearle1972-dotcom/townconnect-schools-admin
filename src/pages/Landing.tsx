import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-navy">TownConnect</span>
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-xl font-medium text-navy/80">Schools</span>
          </div>
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container px-6 py-20 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-navy leading-tight">
            Run your school's parent communication on WhatsApp.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-navy/70 leading-relaxed">
            TownConnect Schools turns your school's information into a 24/7 WhatsApp assistant.
            Parents ask, the bot answers. In four languages.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-navy hover:bg-navy/90 text-white w-full sm:w-auto">
                Sign up free for 14 days
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-navy text-navy w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white">
        <div className="container px-6 py-6 text-sm text-navy/60 flex flex-col sm:flex-row justify-between gap-2">
          <span>© TownConnect (Pty) Ltd</span>
          <a
            href="https://schools.townconnect.co.za"
            className="text-navy hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Visit schools.townconnect.co.za
          </a>
        </div>
      </footer>
    </div>
  )
}
