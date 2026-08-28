import Link from 'next/link'

export default function SplashPage() {
  return (
    <>
      {/* Parallax hero */}
      <div
        className="relative min-h-screen flex flex-col"
        style={{
          backgroundImage: "url('/hero.jpg')",
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-black/65" />

        {/* Content — extra bottom padding so text clears the sticky CTA bar */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-40 text-white text-center">
          <div className="max-w-2xl mx-auto space-y-10">

            {/* Logo / title */}
            <div className="space-y-3">
              <h1 className="text-6xl font-bold tracking-tight drop-shadow-lg">
                Welcome to Friendzi
              </h1>
              <p className="text-2xl font-light tracking-wide text-white/85 italic">
                The Human Connection &amp; Curiosity Game
              </p>
            </div>

            {/* Body copy */}
            <div className="space-y-6 text-lg leading-relaxed text-white/90 text-left">
              <p>
                We live in a world that is more connected than ever, yet many of us feel more
                disconnected from one another. Too often, we make assumptions before we make
                connections. Friendzi was created to change that.
              </p>
              <p>
                Through questions designed to be fun, thought-provoking, and full of surprises,
                you&apos;ll discover what you share, where you differ, and the stories behind those
                differences — with the people already in your life, or the ones you haven&apos;t
                met yet.
              </p>
              <p>
                There are no right or wrong answers. Only opportunities to understand yourself
                better, connect more deeply, and maybe find your people along the way.
              </p>
            </div>

            {/* Journey line */}
            <p className="text-base font-semibold tracking-widest uppercase text-white/70">
              Curiosity &rarr; Conversation &rarr; Understanding &rarr; Connection &rarr; Friendship
            </p>

            {/* Closing copy */}
            <div className="space-y-3 text-lg text-white/90">
              <p>So be yourself. Stay curious. And see where the conversation takes you.</p>
              <p>Because friendship begins with curiosity.</p>
              <p className="font-semibold text-white">And curiosity begins with Friendzi!</p>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky CTA bar — always visible regardless of scroll position */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        {/* Gradient fade so the bar blends into the image above it */}
        <div className="h-16 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="bg-black/60 backdrop-blur-md border-t border-white/10 py-4 px-6 pointer-events-auto">
          <div className="max-w-2xl mx-auto flex items-center justify-center">
            <Link
              href="/start"
              className="inline-block px-16 py-4 bg-[#ED254E] text-white text-xl font-bold rounded-full shadow-2xl hover:bg-[#d41f45] active:scale-95 transition-all duration-150"
            >
              Let&apos;s Play
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
