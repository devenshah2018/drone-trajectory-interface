"use client"

import { useState } from "react"
import { ChevronDown, Github, Linkedin, ExternalLink, User } from "lucide-react"

export function AuthorProfile() {
  const [isOpen, setIsOpen] = useState(false)

  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/deven-a-shah/",
      icon: Linkedin,
      description: "Professional Profile"
    },
    {
      name: "GitHub", 
      url: "https://github.com/devenshah2018",
      icon: Github,
      description: "Code Repository"
    },
    {
      name: "Portfolio",
      url: "https://deven-shah-portfolio.vercel.app/",
      icon: User,
      description: "Personal Website"
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/5 cursor-pointer"
      >
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Designed & developed by</div>
          <div className="text-sm font-medium text-foreground">Deven Shah</div>
        </div>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">Deven Shah</p>
            <p className="text-xs text-muted-foreground">My profile links</p>
          </div>
          
          <div className="py-2">
            {socialLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <IconComponent className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="font-medium">{link.name}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
