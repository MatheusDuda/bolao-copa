export const FLAG_MAP = {
  "Brasil": "br", "Argentina": "ar", "México": "mx",
  "Estados Unidos": "us", "Canadá": "ca", "Alemanha": "de",
  "França": "fr", "Espanha": "es", "Inglaterra": "gb-eng",
  "Portugal": "pt", "Países Baixos": "nl", "Holanda": "nl",
  "Bélgica": "be", "Itália": "it", "Japão": "jp",
  "Coreia do Sul": "kr", "Austrália": "au", "Marrocos": "ma",
  "Senegal": "sn", "Nigéria": "ng", "Camarões": "cm",
  "Costa do Marfim": "ci", "Gana": "gh", "África do Sul": "za",
  "Cabo Verde": "cv", "Egito": "eg", "Tunísia": "tn",
  "Colômbia": "co", "Uruguai": "uy", "Chile": "cl",
  "Equador": "ec", "Paraguai": "py", "Venezuela": "ve",
  "Peru": "pe", "Bolívia": "bo", "Honduras": "hn",
  "Costa Rica": "cr", "Jamaica": "jm", "Haiti": "ht",
  "Panamá": "pa", "Suíça": "ch", "Polônia": "pl",
  "Croácia": "hr", "Ucrânia": "ua", "Turquia": "tr",
  "Áustria": "at", "Eslováquia": "sk", "Tchéquia": "cz",
  "Escócia": "gb-sct", "Grécia": "gr", "Albânia": "al",
  "Hungria": "hu", "Eslovênia": "si", "Romênia": "ro",
  "Sérvia": "rs", "Bósnia e Herzegovina": "ba",
  "Catar": "qa", "Arábia Saudita": "sa", "Irã": "ir",
  "Iraque": "iq", "Jordânia": "jo", "Omã": "om",
  "Indonésia": "id", "Tailândia": "th", "Vietnã": "vn",
  "China": "cn", "Nova Zelândia": "nz", "Fiji": "fj",
  "Curaçao": "cw"
}

export function getFlagUrl(teamName, size = '32x24') {
  const code = FLAG_MAP[teamName]
  if (!code) return null
  return `https://flagcdn.com/${size}/${code}.png`
}

export function FlagImg({ team, className = '' }) {
  const url = getFlagUrl(team)
  if (!url) return <span className="text-base leading-none">🏳️</span>
  return (
    <img
      src={url}
      srcSet={`${getFlagUrl(team, '64x48')} 2x`}
      alt={team}
      className={`rounded-sm object-cover flex-shrink-0 ${className}`}
      style={{ width: 32, height: 24 }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}
