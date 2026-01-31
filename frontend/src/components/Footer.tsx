import Link from 'next/link';
import { Github, X as XIcon, Facebook } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 z-10">
            <div className="mx-auto px-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-2 underline decoration-green-500 underline-offset-8">TripNRoll</h3>
                        <p className="text-gray-400 leading-relaxed text-sm mb-4">
                            Shop no-15, MMTC STC Shopping Complex, Malviya Nagar, New Delhi - 110017
                        </p>
                        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl mb-6">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.5135246755497!2d77.2146914!3d28.5242512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce379f0ec15eb%3A0xc397444747b2c58e!2sMMTC-STC%20Market!5e0!3m2!1sen!2sin!4v1711612345678!5m2!1sen!2sin"
                                width="100%"
                                height="200"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="rounded-xl grayscale hover:grayscale-0 transition-all duration-500"
                            ></iframe>
                        </div>
                    </div>

                    <div className='mt-4'>
                        <h4 className="text-lg font-semibold text-white mb-4">Explore</h4>
                        <ul className="space-y-2">
                            <FooterLink href="/">Destinations</FooterLink>
                            <FooterLink href="/">Flights</FooterLink>
                            <FooterLink href="/">Deals</FooterLink>
                        </ul>
                    </div>

                    <div className='mt-4'>
                        <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
                        <ul className="space-y-2">
                            <FooterLink href="/contact">Contact Us</FooterLink>
                            <FooterLink href="/">FAQ</FooterLink>
                            <FooterLink href="/">Privacy Policy</FooterLink>
                        </ul>
                    </div>

                    <div className='mt-4'>
                        <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
                        <div className="flex space-x-4">
                            <SocialIcon icon={<XIcon size={20} />} />
                            <SocialIcon icon={<Facebook size={20} />} />
                            <SocialIcon icon={<Github size={20} />} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-gray-500 text-sm">
                    © {new Date().getFullYear()} TripNRoll. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-gray-400 hover:text-blue-400 transition-colors">
                {children}
            </Link>
        </li>
    );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
    return (
        <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all duration-300">
            {icon}
        </a>
    );
}
