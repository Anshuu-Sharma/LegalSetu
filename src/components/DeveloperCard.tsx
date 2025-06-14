// components/DeveloperCard.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";
import "./styles/Card.css";

type Props = {
  name: string;
  img: string;
  quote: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
};

const DeveloperCard = ({ name, img, quote, github, linkedin, instagram }: Props) => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <div className="background-container">
      {/* Background Animation */}
      <motion.div
        initial={{ backgroundPosition: "0 50%" }}
        animate={{ backgroundPosition: ["0 50%", "100% 50%", "0 50%"] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        className="background-gradient blur"
      />
      <motion.div
        initial={{ backgroundPosition: "0 50%" }}
        animate={{ backgroundPosition: ["0 50%", "100% 50%", "0 50%"] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
        className="background-gradient"
      />

      {/* Developer Card */}
      <div className={`developer-card ${showQuote ? "active" : ""}`} onClick={() => setShowQuote(!showQuote)}>
        <div className="developer-image-container">
          <img src={img} alt={name} className="developer-image" />
        </div>

        {showQuote && (
          <motion.div 
            className="quote-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            "{quote}"
          </motion.div>
        )}
      </div>

      {/* Floating Dock */}
      <div className="floating-dock">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" className="dock-item">
            <FaGithub className="dock-icon" />
          </a>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="dock-item">
            <FaLinkedin className="dock-icon" />
          </a>
        )}
        {instagram && (
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="dock-item">
            <FaInstagram className="dock-icon" />
          </a>
        )}
      </div>
    </div>
  );
};

export default DeveloperCard;
