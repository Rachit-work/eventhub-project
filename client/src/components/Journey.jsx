export default function Journey() {
  const steps = [
    { title: 'Search Vendors', desc: 'Browse through our curated list of vendors using smart filters.' },
    { title: 'Compare Portfolios', desc: 'Review high-resolution galleries and read verified testimonials.' },
    { title: 'Book Your Event', desc: 'Secure your booking with our protected payment system.' }
  ];

  return (
    <section className="py-24 bg-white px-10">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">Your Event Journey</h2>
        <p className="text-gray-500 mb-16">Planning a memorable event has never been easier.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10">
              <div className="w-16 h-16 bg-[#c25e4c] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                {idx + 1}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
