import { useState, useEffect } from "react";

export default function Home() {
  const [lang, setLang] = useState("gd");

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "gd";
    setLang(saved);
  }, []);

  const toggleLang = () => {
    const newLang = lang === "gd" ? "en" : "gd";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <div className="container">
      <h1 id="title">
        {lang === "gd" ? "Cinn-latha Bhionaichean Brue" : "Brue Bin Collection Dates"}
      </h1>

      <div className="link-box">
        <a id="black-link" className="black-bin" href={`/api/black?lang=${lang}`}>
          <i className="fas fa-trash-alt"></i>{" "}
          {lang === "gd" ? "Biona Dubh" : "Black Bin Schedule"}
        </a>
        <a id="blue-link" className="blue-bin" href={`/api/blue?lang=${lang}`}>
          <i className="fas fa-recycle"></i>{" "}
          {lang === "gd" ? "Biona Gorm" : "Blue Bin Schedule"}
        </a>
        <a id="green-link" className="green-bin" href={`/api/green?lang=${lang}`}>
          <i className="fas fa-wine-bottle"></i>{" "}
          {lang === "gd" ? "Biona Uaine" : "Green Bin Schedule"}
        </a>
      </div>

      <button id="lang-toggle" className="lang-toggle" onClick={toggleLang}>
        {lang === "gd" ? "Gàidhlig" : "English"}
      </button>
    </div>
  );
}
