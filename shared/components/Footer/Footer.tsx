import React from "react";
import Link from "next/link";
import {
    FacebookIcon,
    GithubIcon,
    TwitterIcon,
    GoogleIcon,
} from "../../constants/FooterIcons";
import { APP_ROUTES } from "@/config/navigation";

const Footer = () => {
    return (
        <footer className="bg-jet-blue text-soft-white py-10 px-4 md:px-8 lg:px-16 font-sans">
            <div className="max-w-7xl mx-auto pt-4">

                {/* Middle Section: Links & Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
                    {/* About Us */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-[24px] md:text-[26px] lg:text-[28px] font-semibold mb-4 mt-1 tracking-tight">
                                About Us
                            </h3>
                            <p className="text-gray-100/90 text-sm leading-relaxed max-w-sm">
                                Jet Prompt Optimizer is built to help creators, developers, and
                                teams craft clearer, smarter, and more effective AI prompts.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <SocialLink href="#" icon={<FacebookIcon />} />
                            <SocialLink href="#" icon={<GithubIcon />} />
                            <SocialLink href="#" icon={<TwitterIcon />} />
                            <SocialLink href="#" icon={<GoogleIcon />} />
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 className="text-lg md:text-xl font-semibold mb-6">Useful Links</h3>
                        <ul className="space-y-3 text-sm text-gray-100/90">
                            <li><FooterLink href={APP_ROUTES.features}>Features</FooterLink></li>
                            <li><FooterLink href={APP_ROUTES.pricing}>Pricing</FooterLink></li>
                            <li><FooterLink href={APP_ROUTES.resources}>Resources</FooterLink></li>
                        </ul>
                    </div>

                    {/* Connect With Us */}
                    <div>
                        <h3 className="text-lg md:text-xl font-semibold mb-6">Connect With Us</h3>
                        <ul className="space-y-4 text-sm text-gray-100/90">
                            <li className="flex flex-col gap-1">
                                <p>Leonard Productivity Intelligence Institute, LLC</p>
                                <p>100 LakeForest Blvd</p>
                                <p>Suite 650</p>
                                <p>Gaithersburg, MD 20877</p>
                            </li>
                            <li>
                                <p>support@jetpromptoptimizer.ai</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section: Copyright & Legal */}
                <div className="border-t border-[#FF541F]/60 pt-6 mt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm text-gray-100/90">
                    <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
                        <p>Copyright © {new Date().getFullYear()} All Rights Reserved.</p>
                        <p>USPTO: Provisional Patent #63/912,406</p>
                        <p>METHODS AND SYSTEMS FOR OPTIMIZING A NATURAL LANGUAGE PROMPT</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8" />
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // If it's a hash link, handle scroll with offset
        if (href.startsWith("/#") || href.startsWith("#")) {
            e.preventDefault();
            const hash = href.includes("#") ? href.split("#")[1] : "";
            if (hash) {
                // Navigate to home page first if not already there
                if (window.location.pathname !== "/") {
                    window.location.href = `/#${hash}`;
                    return;
                }
                // Scroll to section with offset (different for features vs pricing)
                setTimeout(() => {
                    const section = document.getElementById(hash);
                    if (section) {
                        // Use smaller offset for features, standard for pricing
                        const offset = hash === 'features' ? 40 : 50;
                        const sectionTop = section.offsetTop;
                        window.scrollTo({
                            top: sectionTop - offset,
                            behavior: 'smooth'
                        });
                        // Update URL hash
                        window.history.pushState(null, "", `#${hash}`);
                    }
                }, 100);
            }
        }
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            className="hover:text-white transition-colors block"
        >
            {children}
        </Link>
    );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
    <Link
        href={href}
        className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-jet-blue shadow-sm hover:shadow-md hover:bg-gray-100 transition-all duration-200"
    >
        {icon}
    </Link>
);

export default Footer;