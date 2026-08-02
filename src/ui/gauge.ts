export function createGauge(
  label: string,
  value: number,
  minimum = 0,
  maximum = 100,
): HTMLElement {
  const safeValue = Math.min(maximum, Math.max(minimum, value));
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
  fill.style.width = `${((safeValue - minimum) / (maximum - minimum)) * 100}%`;
  track.append(fill);
  wrapper.append(heading, track);
  return wrapper;
}
