"use client";

import { Github, Linkedin, User } from "lucide-react";

/**
 * Compact author badge with a dropdown of external social links.
 *
 * @returns A button that toggles a dropdown containing the author's profile links.
 * @remarks Client component that manages local open/close state for the dropdown.
 */
export function AuthorProfile() {
  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/deven-a-shah/",
      icon: Linkedin,
      description: "Professional Profile",
    },
    {
      name: "GitHub",
      url: "https://github.com/devenshah2018",
      icon: Github,
      description: "Code Repository",
    },
    {
      name: "Portfolio",
      url: "https://deven-shah-portfolio.vercel.app/",
      icon: User,
      description: "Personal Website",
    },
  ];

  return (
    <div className="flex items-center gap-6 w-full sm:w-auto">
      <div className="sm:inline hidden h-7 w-px bg-border" />
      <div className="flex flex-row justify-between sm:gap-4 items-center w-full">
        <div className="text-left">
          <div className="text-muted-foreground text-xs">Created by</div>
          <div className="text-foreground text-sm font-medium">Deven Shah</div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 ml-2">
          {socialLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.description}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <IconComponent className="h-4 w-4" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
