import React from 'react';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Features</h2>
          <p className="text-xl text-gray-600">Discover all the tools to transform your spaces</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-couch text-custom text-xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Virtual Staging</h3>
            <p className="text-gray-600">
              Virtually furnish your empty rooms with photorealistic furniture.
              Transform bare spaces into fully styled interiors by adding realistic, high-quality 3D furniture with just a few clicks.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-eraser text-custom text-xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Enhance Designs with Your Personal Items</h3>
            <p className="text-gray-600">
              Make each project truly yours by inserting objects from your personal library - including sofas, lamps, decor, and more.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-paint-roller text-custom text-xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Redesign & Style</h3>
            <p className="text-gray-600">
              Give your current spaces a fresh look by experimenting with new design styles, colors, and layouts tailored to your taste.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
