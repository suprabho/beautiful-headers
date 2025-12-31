const TextLayer = ({ sections, gap }) => {
  return (
    <div
      className="text-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: `${gap}px`,
        pointerEvents: 'none',
      }}
    >
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="text-section"
          style={{
            fontSize: `${section.size}px`,
            fontWeight: section.weight,
            letterSpacing: `${section.spacing}em`,
            color: 'white',
            textShadow: `
              0 0 40px rgba(255, 255, 255, 0.3),
              0 0 80px rgba(255, 255, 255, 0.2),
              0 4px 20px rgba(0, 0, 0, 0.5)
            `,
            textTransform: 'uppercase',
            fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            mixBlendMode: 'difference',
            animation: `text-float 6s ease-in-out ${index * 0.5}s infinite`,
            textAlign: 'center',
            padding: '0 20px',
            wordBreak: 'break-word',
          }}
        >
          {section.text}
        </div>
      ))}
      <style>{`
        @keyframes text-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}

export default TextLayer

