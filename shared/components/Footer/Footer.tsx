import React from "react";
import Link from "next/link";
import {
    FacebookIcon,
    GithubIcon,
    TwitterIcon,
    GoogleIcon,
} from "../../constants/FooterIcons";

const Footer = () => {
    return (
        <footer className="bg-jet-blue text-soft-white py-6 sm: px-4 md:px-8 lg:px-16 font-sans">
            <div className="max-w-7xl mx-auto pt-4  ">

                {/* Middle Section: Links & Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* About Us */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-[28px] font-medium mb-4 mt-1">About Us</h3>
                            <p className="text-gray-100 text-sm leading-relaxed max-w-[210px]">
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
                        <h3 className="text-xl font-medium mb-6">Useful Links</h3>
                        <ul className="space-y-4 text-sm text-gray-100">
                            <li><FooterLink href="#">Features</FooterLink></li>
                            <li><FooterLink href="#">Pricing</FooterLink></li>
                            <li><FooterLink href="#">Resources</FooterLink></li>
                            <li><FooterLink href="#">Admin</FooterLink></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-xl font-medium mb-6">Help</h3>
                        <ul className="space-y-4 text-sm text-gray-100">
                            <li><FooterLink href="#">Customer Support</FooterLink></li>
                            <li><FooterLink href="#">Terms & Conditions</FooterLink></li>
                            <li><FooterLink href="#">Privacy Policy</FooterLink></li>
                            <li><FooterLink href="#">Contact Us</FooterLink></li>
                        </ul>
                    </div>

                    {/* Connect With Us */}
                    <div>
                        <h3 className="text-xl font-medium mb-6">Connect With Us</h3>
                        <ul className="space-y-4 text-sm text-gray-100">
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
                <div className="border-t border-[#FF541F] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-100">
                    <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
                        <p>Copyright © {new Date().getFullYear()} All Rights Reserved.</p>
                        <p>USPTO: Provisional Patent #63/912,406</p>
                        <p>METHODS AND SYSTEMS FOR OPTIMIZING A NATURAL LANGUAGE PROMPT</p>
                    </div>
                    <div className="flex gap-8">
                        <FooterLink href="#">• Term & Conditions</FooterLink>
                        <FooterLink href="#">• Privacy & Policy</FooterLink>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="hover:text-white transition-colors block">
        {children}
    </Link>
);

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
    <Link
        href={href}
        className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-jet-blue hover:bg-gray-200 transition-colors"
    >
        {icon}
    </Link>
);

export default Footer;