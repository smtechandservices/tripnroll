import Link from 'next/link';
import { Github, Twitter, Facebook } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 z-10">
            <div className="mx-auto px-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-4">TripNRoll</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Making your journey as memorable as the destination. Premium flight booking experience.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Explore</h4>
                        <ul className="space-y-2">
                            <FooterLink href="/">Destinations</FooterLink>
                            <FooterLink href="/">Flights</FooterLink>
                            <FooterLink href="/">Deals</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
                        <ul className="space-y-2">
                            <FooterLink href="/contact">Contact Us</FooterLink>
                            <FooterLink href="/">FAQ</FooterLink>
                            <FooterLink href="/">Privacy Policy</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
                        <div className="flex space-x-4">
                            <SocialIcon icon={<Twitter size={20} />} />
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
