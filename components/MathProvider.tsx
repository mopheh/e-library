// components/MathProvider.tsx
import { MathJaxContext } from "better-react-mathjax";

const config = {
  loader: { load: ["input/asciimath", "input/tex"] },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ], // this is fine
  },
};

export default function MathProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MathJaxContext version={3} config={config}>
      {children}
    </MathJaxContext>
  );
}
