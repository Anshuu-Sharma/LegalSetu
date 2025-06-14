// components/AboutUs.tsx

import React, { useEffect, useState } from "react";
import DeveloperCard from "./DeveloperCard.tsx";
import "./styles/AboutUs.css";

const developers = [
  {
    name: "Srishti Ahuja",
    img: "/images/shubham.png",
    quote:
      "Blending AI and law, I build tools that simplify legal complexities — from document analyzers to scam-detection solutions.",
    github: "https://github.com/Srishti-Ahuja14/",
    linkedin: "https://www.linkedin.com/in/srishti-ahuja-b7834928b/",
    instagram: "https://www.instagram.com/srishti_ahuja14/",
  },
  {
    name: "Ansh Sharma",
    img: "/images/ishika.jpg",
    quote:
      "Designing clean, intuitive interfaces that make legal tech accessible to all — with empathy and elegance.",
    github: "https://github.com/Anshuu-Sharma",
    linkedin: "https://www.linkedin.com/in/ansh-sharma-36a936143/",
    instagram: "https://www.instagram.com/ansh.sha.rma/",
  },
  {
    name: "Shubham Garg",
    img: "/images/aman.jpg",
    quote:
      "I'm Shubham Garg, the mind behind GauZen. Passionate about AI & agriculture, I strive to make cattle farming smarter.",
    github: "https://github.com/Immortal-CyberGuy/",
    linkedin: "https://www.linkedin.com/in/real-shubham-garg",
    instagram: "https://www.instagram.com/gargshubham2411/",
  },
];

const AboutUs = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector(".meet-developer");
      if (
        section &&
        section.getBoundingClientRect().top < window.innerHeight * 0.85
      ) {
        setVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className={`meet-developer ${visible ? "show" : ""}`}>
      <h2 className="tagline">Meet the developers</h2>
      <p className="description">
        We’re not just building tools — we’re shaping the future of legal
        empowerment. With AI-driven clarity and multilingual support, we make
        justice more accessible.
      </p>

      <div className="developer-cards-container">
        {developers.map((dev, index) => (
          <DeveloperCard key={index} {...dev} />
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
