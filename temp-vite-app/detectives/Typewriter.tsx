import { useEffect, useRef, useState } from 'react';

function Reveal({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    const finish = () => { clearInterval(timer); setCount(text.length); };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (motion.matches) { finish(); return; }
      let position = 0;
      timer = setInterval(() => {
        position = Math.min(text.length, position + Math.max(1, Math.ceil(text.length / 180)));
        setCount(position);
        if (position === text.length) clearInterval(timer);
      }, 24);
    });
    observer.observe(element);
    const change = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', change);
    return () => { observer.disconnect(); clearInterval(timer); motion.removeEventListener('change', change); };
  }, [text]);
  return <span className="typewriter" ref={ref}>
    <span className="typewriter-accessible">{text}</span>
    <span className="typewriter-space" aria-hidden="true">{text}</span>
    <span className="typewriter-ink" aria-hidden="true">{text.slice(0,count)}{count < text.length && <span className="typewriter-caret">▍</span>}</span>
  </span>;
}
export default function Typewriter({ text }: { text: string }) { return <Reveal key={text} text={text}/>; }
