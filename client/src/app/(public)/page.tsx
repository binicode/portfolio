import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Biniyam Abera
      </h1>
      <p className="mt-4 text-xl font-medium text-gray-600">
        Full-Stack Software Engineer | Civil Engineering B.Sc. | Meta & IBM Certified
      </p>
      <div className="mt-8 max-w-2xl space-y-4 text-gray-700 leading-relaxed">
        <p>
          I am a Full-Stack Software Engineer with a background in Civil Engineering.
          I bring structural systems thinking, precision, and problem-solving discipline
          to modern web software architecture.
        </p>
        <p>
          Formally certified with the <strong>Meta Front-End Developer</strong> and{' '}
          <strong>IBM JavaScript Back-End Developer</strong> Professional Certificates, I specialize
          in building end-to-end, type-safe applications using Next.js, Node.js/Express, TypeScript,
          and MongoDB.
        </p>
        <p>
          Whether designing modular REST APIs, real-time streaming interfaces, or responsive user experiences, 
          I focus on building clean, resilient, and maintainable software systems.
        </p>
      </div>

      <div className="mt-10 flex gap-4">
        <Link
          href="/projects"
          className="inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          View Projects
        </Link>
      </div>
    </section>
  );
}