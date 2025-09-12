import { useState, useEffect } from "react";
import Head from "next/head";   // ✅ import Head
import translations from "../lib/translations";

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

  const t = translations[lang];

  return (
    <>
      <Head>
        <title>{t.appTitle}</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      {/* ✅ No <body> tag here */}
      <div className="container">
        <h1>{t.appTitle}</h1>
        <div className="link-box">
          <a className="black-bin" href={`/api/black?lang=${lang}`}>
            <i className="fas fa-trash-alt"></i> {t.blackButton || "Black Bin"}
          </a>
          <a className="blue-bin" href={`/api/blue?lang=${lang}`}>
            <i className="fas fa-recycle"></i> {t.blueButton || "Blue Bin"}
          </a>
          <a className="green-bin" href={`/api/green?lang=${lang}`}>
            <i className="fas fa-wine-bottle"></i> {t.greenButton || "Green Bin"}
          </a>
        </div>
        <button className="lang-toggle" onClick={toggleLang}>
          {lang === "gd" ? "Gàidhlig" : "English"}
        </button>
      </div>
    </>
  );
}
