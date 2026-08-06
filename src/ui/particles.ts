interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  color: string;
}

const colors = ["#fff5a8", "#ff83c8", "#a68cff", "#ffffff"] as const;

export interface ParticleBurstOptions {
  readonly count?: number;
  readonly originXRatio?: number;
  readonly originYRatio?: number;
}

export function mountParticleBurst(
  container: HTMLElement,
  options: ParticleBurstOptions = {},
): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "particle-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d");
  if (!context) return;
  container.append(canvas);

  const count = options.count ?? 48;
  const particles: Particle[] = Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    const speed = 1.4 + (index % 7) * 0.28;
    return {
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.5 + (index % 4),
      life: 1,
      color: colors[index % colors.length] ?? "#ffffff",
    };
  });
  let startedAt = 0;

  const resize = (): void => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(container.clientWidth * ratio));
    canvas.height = Math.max(1, Math.floor(container.clientHeight * ratio));
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();

  const draw = (time: number): void => {
    startedAt ||= time;
    const elapsed = time - startedAt;
    context.clearRect(0, 0, container.clientWidth, container.clientHeight);
    const originX = container.clientWidth * (options.originXRatio ?? 0.5);
    const originY = container.clientHeight * (options.originYRatio ?? 0.42);
    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.018;
      particle.life = Math.max(0, 1 - elapsed / 1_100);
      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(
        originX + particle.x,
        originY + particle.y,
        particle.radius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    context.globalAlpha = 1;
    if (elapsed < 1_100) requestAnimationFrame(draw);
    else canvas.remove();
  };
  requestAnimationFrame(draw);
}
