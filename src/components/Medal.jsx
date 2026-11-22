export function Medal({ place }) {
  return (
    <span className={`medal medal-${place}`} aria-hidden="true">
      {place}
    </span>
  );
}
