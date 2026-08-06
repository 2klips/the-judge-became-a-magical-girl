export function createGauge(
  label: string,
  value: number,
  minimum = 0,
  maximum = 100,
  previousValue?: number,
): HTMLElement {
  const safeValue = Math.min(maximum, Math.max(minimum, value));
  const safePreviousValue = Math.min(
    maximum,
    Math.max(minimum, previousValue ?? safeValue),
  );
  const wrapper = document.createElement("section");
  wrapper.className = "gauge";
  const heading = document.createElement("div");
  heading.className = "gauge-heading";
  const name = document.createElement("span");
  name.textContent = label;
  const number = document.createElement("strong");
  number.textContent = String(safeValue);
  heading.append(name, number);
  const track = document.createElement("div");
  track.className = "gauge-track";
  track.setAttribute("role", "meter");
  track.setAttribute("aria-label", label);
  track.setAttribute("aria-valuemin", String(minimum));
  track.setAttribute("aria-valuemax", String(maximum));
  track.setAttribute("aria-valuenow", String(safeValue));
  const fill = document.createElement("div");
  fill.className = "gauge-fill";
  const range = maximum - minimum;
  const targetWidth = range === 0 ? 100 : ((safeValue - minimum) / range) * 100;
  const initialWidth = range === 0 ? 100 : ((safePreviousValue - minimum) / range) * 100;
  fill.style.width = `${initialWidth}%`;
  if (initialWidth !== targetWidth) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = `${targetWidth}%`;
      });
    });
  }
  track.append(fill);
  wrapper.append(heading, track);
  return wrapper;
}
