import Link from 'next/link';
import { Github, X as XIcon, Facebook, Instagram, Mail, Phone, MapPin, Youtube, Linkedin } from 'lucide-react';

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
                                className="grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100"
                            ></iframe>
                        </div>
                    </div>

                    {/* Links */}
                    <div className='lg:mt-2'>
                        <h4 className="text-lg font-semibold text-white mb-6">Explore</h4>
                        <ul className="space-y-3">
                            <FooterLink href="/flights">Flights</FooterLink>
                            <FooterLink href="/my-bookings">My Bookings</FooterLink>
                            <FooterLink href="/wallet">Wallet</FooterLink>
                        </ul>
                    </div>

                    <div className='lg:mt-2'>
                        <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
                        <ul className="space-y-3">
                            <FooterLink href="/contact">Contact Us</FooterLink>
                            <FooterLink href="/about">Privacy Policy</FooterLink>
                            <FooterLink href="/about">Terms of Service</FooterLink>
                        </ul>
                    </div>

                    {/* Contact & Socials */}
                    <div className='lg:mt-2 space-y-6'>
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-6">Get in Touch</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <a href="mailto:Info@tripnrolltravel.com" className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                                            <span className="text-sm">Info@tripnrolltravel.com</span>
                                        </a>
                                        <a href="mailto:Tripnrolltravel@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                                            <span className="text-sm">Tripnrolltravel@gmail.com</span>
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                                        <Phone size={16} />
                                    </div>
                                    <div>
                                        <a href="tel:+918368282440" className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                                            <span className="text-sm">+91 8368282440</span>
                                        </a>
                                        <a href="tel:+918700701646" className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors group">
                                            <span className="text-sm">+91 8700701646</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Follow Us</h4>
                            <div className="flex space-x-3">
                                <SocialIcon href="https://www.facebook.com/TripNRollindia/" icon={<Facebook size={18} />} label="Facebook" color="hover:bg-blue-600" />
                                <SocialIcon href="https://www.instagram.com/tripnrolltravel/" icon={<Instagram size={18} />} label="Instagram" color="hover:bg-pink-600" />
                                <SocialIcon href="https://www.youtube.com/@tripnrolltravels" icon={<Youtube size={18} />} label="YouTube" color="hover:bg-red-600" />
                                <SocialIcon href="https://www.linkedin.com/company/tripnroll-travel-and-consultancy/" icon={<Linkedin size={18} />} label="LinkedIn" color="hover:bg-blue-700" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-center items-center gap-4 text-gray-600 text-sm">
                    <p>© {new Date().getFullYear()} TripNRoll. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-gray-400 hover:text-green-400 transition-colors marker:text-green-500">
                {children}
            </Link>
        </li>
    );
}

function SocialIcon({ icon, href, label, color }: { icon: React.ReactNode, href: string, label: string, color: string }) {
    return (
        <a
            href={href}
            aria-label={label}
            className={`h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 ${color} hover:text-white transition-all duration-300 transform hover:-translate-y-1`}
        >
            {icon}
        </a>
    );
}
