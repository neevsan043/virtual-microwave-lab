import { useEffect, useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onComplete: () => void;
}

export default function LandingPage({ onComplete }: LandingPageProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Enable smooth scrolling
    document.body.style.overflow = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';
    
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = window.innerHeight * 1.5; // Adjust scroll distance
      const progress = Math.min(scrolled / maxScroll, 1);
      
      setScrollProgress(progress);

      if (progress >= 0.9 && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
          // Reset scroll position
          window.scrollTo(0, 0);
          document.body.style.overflow = 'auto';
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'auto';
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [isComplete, onComplete]);

  const scale = 1 + scrollProgress * 2.5;
  const opacity = 1 - scrollProgress;

  return (
    <div className="landing-page">
      <div 
        className="landing-content"
        style={{
          transform: `scale(${scale})`,
          opacity: opacity,
        }}
      >
        <h1 className="landing-title">Virtual Microwave Lab</h1>
        <p className="landing-subtitle">Explore the world of RF and Microwave Engineering</p>
        <div className="scroll-indicator">
          <span>Scroll to begin</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </div>
      
      {/* Spacer to enable scrolling */}
      <div style={{ height: '250vh' }} />
    </div>
  );
}
