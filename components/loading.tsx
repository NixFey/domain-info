// Copied from https://github.com/davidhu2000/react-spinners/blob/main/src/RingLoader.tsx
// Further modified to support NextJS loading pages (fully server rendered)
function RingLoader({
                      color = "#000000",
                      speedMultiplier = 1,
                      cssOverride = {},
                      size = 60,
                      ...additionalprops
                    }) {
  const { value, unit } = { value: size, unit: 'px' };

  const wrapper: React.CSSProperties = {
    display: "inherit",
    width: `${value}${unit}`,
    height: `${value}${unit}`,
    position: "relative",
    ...cssOverride,
  };

  return (
    <span style={wrapper} {...additionalprops}>
      <style>{`
        @keyframes right {
          from {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg)
          }
          to {
            transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg)
          }
        }
        
        @keyframes left {
          from {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg)
          }
          to {
            transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg)
          }
      `}</style>
      <span style={{
        position: "absolute",
        top: "0",
        left: "0",
        width: `${value}${unit}`,
        height: `${value}${unit}`,
        border: `${value / 10}${unit} solid ${color}`,
        opacity: "0.4",
        borderRadius: "100%",
        animationFillMode: "forwards",
        perspective: "800px",
        animation: `right ${2 / speedMultiplier}s 0s infinite linear`,
      }} />
      <span style={{
        position: "absolute",
        top: "0",
        left: "0",
        width: `${value}${unit}`,
        height: `${value}${unit}`,
        border: `${value / 10}${unit} solid ${color}`,
        opacity: "0.4",
        borderRadius: "100%",
        animationFillMode: "forwards",
        perspective: "800px",
        animation: `left ${2 / speedMultiplier}s 0s infinite linear`,
      }} />
    </span>
  );
}

export default function Loading({ message }: { message?: string }) {
  
  return (
    <div className="w-full h-[50vh] flex flex-col justify-center items-center">
      <RingLoader color="var(--foreground)" loading={true} />
      <p>{message ?? "Loading..."}</p>
    </div>
  );
}

